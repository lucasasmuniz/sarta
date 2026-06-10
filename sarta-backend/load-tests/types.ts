export const scenarios = ["C1", "C2", "C3", "C4", "C5"] as const;
export const routes = ["sync", "async"] as const;

export type routesType = (typeof routes)[number];
type scenariosType = (typeof scenarios)[number];

export type K6Metrics = {
	route: routesType;
	scenario: scenariosType;

	http_med: number;
	http_p95: number;
	http_p99: number;
	http_max: number;
	http_avg: number;

	throughput_rps: number;

	server_error_rate: number;
	http_failed_rate: number;

	status_422: number;

	dropped: number;
	iterations: number;

	test_duration_ms: number;
};

export type InternalMetrics = {
	internal_p50: number;
	internal_p95: number;
	internal_p99: number;

	internal_max: number;
	internal_avg: number;

	internal_count: number;

	drain_rps: number;
};

export type SqlMetrics = {
	p50: number;
	p95: number;
	p99: number;

	max: number;
	avg: number;

	n: number;
};

export type PerformanceMetrics = K6Metrics & InternalMetrics;

export type SpanLatency = {
	span_s: number;
	count: number;
};
