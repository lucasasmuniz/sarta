import { telemetryRoutes } from "@modules/telemetry/routes.js";
import { env } from "@shared/env.js";
import fastify from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

const PORT = env.API_PORT;

const app = fastify({
	logger: true,
}).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.get("/health", {
	schema: {
		response: {
			200: z.object({
				status: z.string(),
			}),
		},
	},
	handler: (_req, res) => {
		res.send({ status: "ok" });
	},
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
