import z from "zod";

const defaultBodyPostTelemetryRequest = z.object({
	sensorId: z
		.string()
		.trim()
		.min(1, { error: "O valor do sensor não pode ser vazio" })
		.describe("Id externo do sensor"),
	timestamp: z.iso
		.datetime()
		.describe("Data e hora do momento da medição")
		.pipe(z.transform((val) => new Date(val))),
	value: z.number().nullable().describe("Valor medido pelo sensor"),
});

const sensorNotFoundErroResponse = z.object({
	name: z.string().describe("Nome da classe que gerou o erro"),
	statusCode: z.number().describe("Número do código do erro"),
	code: z.string().describe("Codigo referente ao erro"),
	message: z.string().describe("Mensagem referente ao erro"),
	timestamp: z.iso.datetime().describe("Data e hora do momento do erro"),
});

export const postTelemetrySyncSchema = {
	schema: {
		summary: "Ingestão síncrona de telemetria",
		description:
			"Rota para ingestão síncrona de telemetria. Retorna uma resposta imediata indicando se a telemetria é válida ou se é uma duplicata.",
		tags: ["Telemetria"],
		body: defaultBodyPostTelemetryRequest,
		response: {
			200: z.object({
				duplicate: z.boolean().describe("Booleano que evidencia duplicação de requisição"),
			}),
			422: sensorNotFoundErroResponse,
		},
	},
};
export const postTelemetryAsyncSchema = {
	schema: {
		summary: "Ingestão assíncrona de telemetria",
		description:
			"Rota para ingestão assíncrona de telemetria. Retorna uma resposta imediata indicando se a telemetria é válida ou se é uma duplicata.",
		tags: ["Telemetria"],
		body: defaultBodyPostTelemetryRequest,
		response: {
			200: z.object({
				enqueued: z.literal(false).describe("Booleano que representa se o valor foi enfileirado"),

				reason: z.string().describe("Razão pelo qual o valor não foi enfileirado"),
			}),
			202: z.object({
				enqueued: z.literal(true).describe("Booleano que representa se o valor foi enfileirado"),

				jobId: z.string().describe("Id do job"),
			}),
			422: sensorNotFoundErroResponse,
		},
	},
};
