import Fastify, { type FastifyInstance } from 'fastify';
import { serializerCompiler, validatorCompiler } from '@fastify/type-provider-zod';
import helmetPlugin from '@/plugins/helmet.js';
import corsPlugin from '@/plugins/cors.js';
import authPlugin from '@/plugins/auth.js';
import databasePlugin from '@/plugins/database.js';
import errorHandlerPlugin from '@/plugins/error-handler.js';
import { envToLogger } from '@/plugins/logger.js';
import { config } from '@/config/env.js';

const currentEnv = config.NODE_ENV;

/**
 * The app factory. a function that builds and returns a configured Fastify instance.
 * In testing, you call buildApp() to get a fresh instance for each test.
 * This prevents state from leaking between tests.
 */
export async function buildApp(): Promise<FastifyInstance> {
    const app = Fastify({
        logger: envToLogger[currentEnv] ?? envToLogger.production,
    });

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await app.register(helmetPlugin);

    await app.register(corsPlugin);

    await app.register(databasePlugin);

    await app.register(authPlugin);

    await app.register(errorHandlerPlugin);

    await app.register(import('./modules/auth/auth.routes.js'), { prefix: '/api/v1/auth' });

    await app.register(import('./modules/accounts/accounts.routes.js'), {
        prefix: '/api/v1/accounts',
    });

    app.get('/health', async (_request, reply) => {
        return reply.send({
            status: 'ok',
            uptime: process.uptime(),
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            environment: config.NODE_ENV,
        });
    });

    return app;
}
