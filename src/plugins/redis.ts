import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyRedis from '@fastify/redis';
import { config } from '@/config/env.js';

/**
 * This plugin registers @fastify/redis so that all other plugins/routes
 * have access to `fastify.redis.get()` and `fastify.redis.set()`.
 */
export default fp(async (fastify: FastifyInstance) => {
    await fastify.register(fastifyRedis, {
        url: config.REDIS_URL,
        password: config?.REDIS_PASSWORD,
    });
});
