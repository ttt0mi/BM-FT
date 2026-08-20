import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { prisma } from '@/lib/prisma.js';
import { ServiceUnavailableError } from '@/shared/errors/AppError.js';

/**
 * This plugin registers `fastify.prisma` with the Fastify instance.
 * and adds a `onClose` hook that disconnects from the database.
 */
export default fp(async (fastify: FastifyInstance) => {
    fastify.decorate('prisma', prisma);

    try {
        await prisma.$connect();
    } catch (error) {
        throw new ServiceUnavailableError('Database connection failed', {
            details: error,
        });
    }

    fastify.addHook('onClose', async () => {
        await prisma.$disconnect();
    });
});
