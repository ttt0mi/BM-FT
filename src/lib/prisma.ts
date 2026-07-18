import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";


const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
* A singleton PrismaClient instance.
* Why a singleton? PrismaClient maintains a connection pool to your database.
* If you create a new PrismaClient on every request, you'll exhaust your
* database connections. This is one instance shared across the entire app.
* The `global` trick prevents the singleton from being lost during hot-reloads in development.
*/
export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "warn", "error"]
                : ["error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
