import "fastify";
import { type PrismaClient } from "@prisma/client/extension";

declare module "fastify" {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        prisma: PrismaClient;
    }
}
