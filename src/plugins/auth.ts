import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { config } from '@/config/env.js';

/**
 * This plugin registers @fastify/jwt so that all other plugins/routes
 * have access to `fastify.jwt.sign()` and `request.jwtVerify()`.
 */
export default fp(async (fastify: FastifyInstance) => {
    await fastify.register(fastifyJwt, {
        secret: config.ACCESS_JWT_SECRET,
        sign: {
            expiresIn: config.ACCESS_JWT_EXPIRES_IN,
        },
    });

    /**
     * Routes that need auth simply add: { onRequest: [fastify.authenticate] }
     *
     * @example
     *   fastify.get('/me', { onRequest: [fastify.authenticate] }, handler)
     */
    fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
        try {
            await request.jwtVerify();
        } catch (err) {
            void reply.status(401).send({
                success: false,
                error: {
                    code: 'UNAUTHORIZED_ACCESS',
                    message: 'Unauthorized Access',
                    details: err,
                },
            });
        }
    });
});
