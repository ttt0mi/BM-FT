import 'fastify';
import type { PrismaClient } from '@/generated/prisma/client.js';
import '@fastify/redis';
import type { Redis } from 'ioredis';

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        prisma: PrismaClient;
        redis: Redis;
    }
}
