import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyRedis from '@fastify/redis';
import { config } from '@/config/env.js';
import { ServiceUnavailableError } from '@/shared/errors/AppError.js';

/**
 * This plugin registers @fastify/redis so that all other plugins/routes
 * have access to `fastify.redis.get()` and `fastify.redis.set()`.
 */
export default fp(async (fastify: FastifyInstance) => {
    await fastify.register(fastifyRedis, {
        url: config.REDIS_URL,
        password: config?.REDIS_PASSWORD,
        connectTimeout: 2_000,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times >= 4) {
                return null;
            }

            return 503;
        },
    });

    try {
        await fastify.redis.ping();
    } catch (error) {
        throw new ServiceUnavailableError('Redis connection failed', {
            details: error,
        });
    }
});
