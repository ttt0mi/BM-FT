import Fastify, { type FastifyInstance } from "fastify";
import helmetPlugin from '@/plugins/helmet.js';
import corsPlugin from "@/plugins/cors.js"
import authPlugin from '@/plugins/auth.js';
import databasePlugin from '@/plugins/database.js';
import errorHandlerPlugin from '@/plugins/error-handler.js';
import configPlugin from '@/plugins/env-config.js';
import { envToLogger } from "@/plugins/logger.js";


const currentEnv = process.env.NODE_ENV as keyof typeof envToLogger

/** 
* The app factory. a function that builds and returns a configured Fastify instance.
* In testing, you call buildApp() to get a fresh instance for each test. 
* This prevents state from leaking between tests.
*/
export async function buildApp(): Promise<FastifyInstance> {
    const app = Fastify({
        logger: envToLogger[currentEnv] ?? envToLogger.production,
    });
    
    await app.register(helmetPlugin);

    await app.register(corsPlugin);

    await app.register(databasePlugin);

    await app.register(authPlugin);

    await app.register(errorHandlerPlugin);

    await app.register(configPlugin);

    app.get("/health", async (_request, reply) => {
        return reply.send({
            status: "ok",
            uptime: process.uptime(),
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            environment: app.config.NODE_ENV,
        });
    });

    return app;
}
