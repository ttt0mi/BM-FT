import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyHelmet from '@fastify/helmet';

/**
* This plugin registers @fastify/helmet for secure HTTP headers 
* such as Cross-Origin policies, content type sniffing, etc.
*/
export default fp(async (fastify: FastifyInstance) => {
    await fastify.register(fastifyHelmet, {
        hsts: true,
        noSniff: true,
    });    
});
