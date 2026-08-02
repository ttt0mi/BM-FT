import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyCors from '@fastify/cors';
import { config } from '@/config/env.js';

/**
 * This plugin registers @fastify/cors, allowing cross-origin requests,
 */
export default fp(async (fastify: FastifyInstance) => {
    await fastify.register(fastifyCors, {
        origin: config.NODE_ENV === 'production' ? config.FRONTEND_URL : true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    });
});
