import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { config } from '@/config/env.js';

const pool = new Pool({
    connectionString: config.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});
const adapter = new PrismaPg(pool);

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
        log: config.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    });

if (config.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
