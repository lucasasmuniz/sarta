import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { telemetryRoutes } from "@modules/telemetry/routes.js";
import { env } from "@shared/env.js";
import fastify from "fastify";
import {
	jsonSchemaTransform,
	jsonSchemaTransformObject,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import z from "zod";

const PORT = env.API_PORT;

const app = fastify({
	logger: true,
}).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifySwagger, {
	openapi: {
		openapi: "3.0.0",
		info: {
			title: "Sistema de Alerta e Recepção de Telemetria Assíncrona (SARTA)",
			description:
				"API para o sistema SARTA, que recebe telemetria de sensores impantados na bacia do rio una e fornece alertas em tempo real.",
			version: "0.1.0",
		},
		servers: [
			{
				url: "http://localhost:3000",
				description: "Development server",
			},
		],
		tags: [
			{ name: "Health-Check", description: "Operações relacionadas à verificação de integridade" },
			{ name: "Telemetria", description: "Operações relacionadas à telemetria" },
		],
		externalDocs: {
			url: "https://github.com/lucasasmuniz/sarta",
			description: "Repositório do projeto no GitHub",
		},
	},
	transform: jsonSchemaTransform,
	transformObject: jsonSchemaTransformObject,
});

app.register(fastifySwaggerUi, {
	routePrefix: "/docs",
	uiConfig: {
		docExpansion: "full",
		deepLinking: true,
		tryItOutEnabled: true,
		persistAuthorization: true,
	},
});

app.register(async (fastify) => {
	fastify.get(
		"/health",
		{
			schema: {
				tags: ["Health-Check"],
				summary: "Verificação de integridade da API",
				description:
					"Rota para verificar se a API está funcionando corretamente. Retorna um status 'ok' se a API estiver saudável.",
				response: {
					200: z.object({
						status: z.string(),
					}),
				},
			},
		},
		async (_request, reply) => {
			return reply.status(200).send({ status: "ok" });
		},
	);
});

app.register(telemetryRoutes, { prefix: "/telemetry" });

(async () => {
	try {
		await app.listen({ port: PORT, host: "0.0.0.0" });
		app.log.info(`Server is running on port ${PORT}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
})();
