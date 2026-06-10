import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";
import { check } from "k6";
import exec from "k6/execution";
import http from "k6/http";
import { Counter, Rate, Trend } from "k6/metrics";

const REGISTRED_STATIONS = 500;
const SENSORS_PER_STATION = 4;
const REGISTRED_SENSORS = REGISTRED_STATIONS * SENSORS_PER_STATION;

const BASE_DATETIME = new Date("2026-06-03T00:00:00.000Z");
const TIME_PER_READING = 600000; // 10 minutes in milliseconds

const scenarioLookUp = {
	C1: 2000,
	C2: 6000,
	C3: 12000,
	C4: 24000,
	C5: 48000,
};

const sensorTypes = ["RAIN", "LEVEL", "TEMPERATURE", "PRESSURE"];

const validRoutes = ["sync", "async"];

const scenarioValue = __ENV.SCENARIO;
const routeValue = __ENV.ROUTE;
const SUMMARIES_PATH = __ENV.SUMMARIES_PATH ?? "./load-tests/summaries";

if (!(scenarioValue in scenarioLookUp)) {
	throw new Error(`Invalid scenario: ${scenarioValue}. Valid scenarios are C1, C2, C3, C4, C5.`);
}
const total = scenarioLookUp[scenarioValue];

if (!validRoutes.includes(routeValue)) {
	throw new Error(`Invalid route: ${routeValue}. Valid routes are sync, async.`);
}

export const options = {
	thresholds: {
		"http_reqs{status:400}": ["count>=0"],
	},
	summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)", "count"],
	scenarios: {
		burst: {
			executor: "constant-arrival-rate",
			rate: total,
			timeUnit: "15s",
			duration: "15s",
			// TODO: por ora fixo (dimensionado pro pior caso, sync/C5). Depois derivar
			// do `total` no init (como a rate) pra não sobrar VU ocioso nos cenários leves.
			preAllocatedVUs: 60,
			maxVUs: 60,
		},
	},
};

const status422Counter = new Counter("status_422");

const steadyLatency = new Trend("steadyLatency");

const serverErrorRate = new Rate("server_error_rate");

export default function () {
	const iteration = exec.scenario.iterationInTest;
	const sensor = iteration % REGISTRED_SENSORS;
	const reading = Math.floor(iteration / REGISTRED_SENSORS);

	const sensorType = sensorTypes[sensor % sensorTypes.length];
	const stationId = (Math.floor(sensor / SENSORS_PER_STATION) + 1).toString().padStart(3, "0");

	const timestamp = new Date(BASE_DATETIME.getTime() + reading * TIME_PER_READING).toISOString();

	const randomValue = iteration % 200 === 0 ? null : (iteration * 0.1) / (sensor + 1);

	const route = `http://localhost:3000/telemetry/ingest/${routeValue}`;
	const res = http.post(
		route,
		JSON.stringify({
			sensorId: `SNS-${stationId}-${sensorType}`,
			timestamp: timestamp,
			value: randomValue,
		}),
		{
			headers: { "Content-Type": "application/json" },
		},
	);

	if (res.status === 422) {
		status422Counter.add(1);
	}

	if (iteration > total / 10) {
		serverErrorRate.add(res.status >= 500);
		steadyLatency.add(res.timings.duration);
	}

	check(res, {
		"is status 200 or 202": (r) => r.status === 200 || r.status === 202,
	});
}

export function handleSummary(data) {
	const metrics = data.metrics;
	return {
		[`${SUMMARIES_PATH}/summary-${routeValue}-${scenarioValue}.json`]: JSON.stringify(
			{
				route: routeValue,
				scenario: scenarioValue,
				http_med: metrics.steadyLatency.values.med,
				http_p95: metrics.steadyLatency.values["p(95)"],
				http_p99: metrics.steadyLatency.values["p(99)"],
				http_max: metrics.steadyLatency.values.max,
				http_avg: metrics.steadyLatency.values.avg,
				throughput_rps: metrics.http_reqs.values.rate,
				server_error_rate: metrics.server_error_rate.values.rate,
				http_failed_rate: metrics.http_req_failed.values.rate,
				status_422: metrics.status_422?.values?.count ?? 0,
				dropped: metrics.dropped_iterations?.values?.count ?? 0,
				iterations: metrics.iterations.values.count,
				test_duration_ms: data.state.testRunDurationMs,
			},
			null,
			2,
		),
		stdout: textSummary(data, { indent: " ", enableColors: true }),
	};
}
