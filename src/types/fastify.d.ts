import "fastify";
import { type PrismaClient } from "@prisma/client/extension";
import { EnvironmentConfig } from "@/config/env.ts";

declare module "fastify" {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        prisma: PrismaClient;
        config: EnvironmentConfig;
    }
}
