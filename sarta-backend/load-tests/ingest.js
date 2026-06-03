import http from 'k6/http';

const scenarioLookUp = {
    'C1': 2000,
    'C2': 6000,
    'C3': 12000,
    'C4': 24000,
    'C5': 48000,
};

const validRoutes = ['sync', 'async'];

const scenarioValue = __ENV.SCENARIO;
const routeValue = __ENV.ROUTE;

if(!(scenarioValue in scenarioLookUp)) {
    throw new Error(`Invalid scenario: ${scenarioValue}. Valid scenarios are C1, C2, C3, C4, C5.`);
}
const total = scenarioLookUp[scenarioValue];

if(!(validRoutes.includes(routeValue))) {
    throw new Error(`Invalid route: ${routeValue}. Valid routes are sync, async.`);
}


export const options = {
    scenarios: {
        burst: {
            executor: 'constant-arrival-rate',
            rate: total, 
            timeUnit: '15s',
            duration: '15s',
            preAllocatedVUs: 1,
            maxVUs: 1,
        }
    }
};

export default function () {
    const route = `http://localhost:3000/telemetry/ingest/${routeValue}`;
    http.post(route, JSON.stringify({
        sensorId: "string",
        timestamp: "2026-06-03T03:04:38.930Z",
        value: 0
    }), {
        headers: { 'Content-Type': 'application/json' },
    });
};