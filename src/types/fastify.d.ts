import 'fastify';
import type { PrismaClient } from '@/generated/prisma/client.js';
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        prisma: PrismaClient;
    }
}
