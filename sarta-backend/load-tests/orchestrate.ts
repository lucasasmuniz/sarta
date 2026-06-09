import { sql } from "drizzle-orm";
import { db } from "../src/database/index.js";
import { redis } from "../src/database/redis.js";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Queue } from "bullmq";
import { QUEUE_NAME } from "../src/modules/telemetry/providers/telemetry-queue.js";
import fs from 'node:fs';
import { type InternalMetrics, type K6Metrics, type PerformanceMetrics, routes, scenarios, type routesType, type SqlMetrics } from "./types.js";

const queue = new Queue(QUEUE_NAME, { connection: redis });
const summariesPath = fileURLToPath(new URL('./summaries', import.meta.url));
const DROPPED_ITERATIONS__RATE_THRESHOLD = 0.01;

const cleanState = async () => {
  await Promise.all([
    db.execute(sql`TRUNCATE telemetry_readings RESTART IDENTITY`),
    redis.flushdb(),
  ]);
};

const closeConnections = async () => {
  await Promise.all([
    redis.quit(),
    db.$client.end(),
    queue.close(),
  ]);
};

const whereRouteOrderByScenarioAsc = (route: routesType, metrics: PerformanceMetrics[]): PerformanceMetrics[] => {
  return metrics.filter(rounds => rounds.route === route).sort((a, b) => Number(a.scenario.split('C')[1] ?? 0) - Number(b.scenario.split('C')[1] ?? 0));
}

const dropRate = (metrics: PerformanceMetrics): number => {
  return (metrics.dropped/(metrics.iterations + metrics.dropped));
}

const isSaturated = (metrics: PerformanceMetrics): boolean => {
  return dropRate(metrics) > DROPPED_ITERATIONS__RATE_THRESHOLD;
};

const dropRatePercentage = (metrics: PerformanceMetrics): string => {
  return (dropRate(metrics) * 100).toFixed(2);
}

const objectArrayToCSV = <T extends Record<string, unknown>>(arr: T[]): string => {
  if (arr.length === 0) return '';
  const headers = Object.keys(arr[0]);

  const csvRows = [
    headers.join(','),
    ...arr.map(obj => headers.map(header => String(obj[header] ?? '')).join(','))
  ];

  return csvRows.join('\n');
}

const shuffle = <T>(array: T[]): void => {
  let currentIndex = array.length;
  
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    const temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
};

const rounds = routes.flatMap(route => scenarios.map(scenario => ({ route, scenario })));
shuffle(rounds);

(async () => {
  const k6IngestPath = fileURLToPath(new URL("./ingest.js", import.meta.url));
  const roundsResults: PerformanceMetrics[] = [];
  for (const { route, scenario } of rounds) {
    await cleanState();
    
    try {
      execFileSync('k6', ['run', '-e', `SCENARIO=${scenario}`, '-e', `ROUTE=${route}`, '-e', `SUMMARIES_PATH=${summariesPath}`,  k6IngestPath], { stdio: 'inherit' });
    } catch (err) {
      console.error(`Error running scenario ${scenario} on route ${route}:`, err);
    }
    
    if(route === 'async'){  
      while(await queue.getJobCounts().then(counts => counts.waiting + counts.active + counts.delayed + counts.paused > 0)) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      };
    };
    
    const result = await db.execute<SqlMetrics>(sql`
      WITH latency_data AS (
        SELECT
          EXTRACT(EPOCH FROM (created_at - received_at)) * 1000 AS latency,
          NTILE(10) OVER (ORDER BY received_at) AS bucket
        FROM telemetry_readings
      )
      SELECT
        percentile_cont(0.5) WITHIN GROUP (ORDER BY latency) AS p50,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY latency) AS p95,
        percentile_cont(0.99) WITHIN GROUP (ORDER BY latency) AS p99,
        max(latency) AS max,
        avg(latency) AS avg,
        count(*)     AS n
      FROM latency_data
      WHERE bucket > 1;`
    );
    const { p50, p95, p99, max, avg, n } = result.rows[0];
    const queryResults: InternalMetrics = {
      internal_p50: p50,
      internal_p95: p95,
      internal_p99: p99,
      internal_max: max,
      internal_avg: avg,
      internal_count: Number(n)
    }

    const routeScenarioSummaryPath = `${summariesPath}/summary-${route}-${scenario}.json`;
    const rawSummaryFile = fs.readFileSync(routeScenarioSummaryPath, 'utf8');
    const jsonSummary: K6Metrics = JSON.parse(rawSummaryFile);
    
    roundsResults.push({
      ...jsonSummary,
      ...queryResults
    });
  }

  const syncResults = whereRouteOrderByScenarioAsc('sync', roundsResults);
  const asyncResults = whereRouteOrderByScenarioAsc('async', roundsResults);
  const orderedRoundsResults = [...syncResults, ...asyncResults];

  const syncSaturatedIteration = syncResults.find(isSaturated);
  const asyncSaturatedIteration = asyncResults.find(isSaturated);

  const syncTextResult = syncSaturatedIteration ? `A rota sync satura em ${syncSaturatedIteration.scenario} (${dropRatePercentage(syncSaturatedIteration)}% de drop)` : 'A rota sync não saturou';
  const asyncTextResult = asyncSaturatedIteration ? `A rota async satura em ${asyncSaturatedIteration.scenario} (${dropRatePercentage(asyncSaturatedIteration)}% de drop)` : 'A rota async não saturou'

  console.log(`${syncTextResult}\n${asyncTextResult}`);

  console.table(orderedRoundsResults)
  fs.writeFileSync(new URL("./summaries/result.csv", import.meta.url), objectArrayToCSV(orderedRoundsResults))

  await closeConnections();
})();