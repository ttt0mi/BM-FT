import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyCors from '@fastify/cors';

/**
* This plugin registers @fastify/cors, allowing cross-origin requests,
*/
export default fp(async (fastify: FastifyInstance) => {
    await fastify.register(fastifyCors, {
        origin: fastify.config.NODE_ENV === 'production' ? fastify.config.FRONTEND_URL : true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    });
});