import { z } from 'zod';

export const environmentSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('127.0.0.1'),
    DATABASE_URL: z.url(),
    DIRECT_URL: z.url(),
    ACCESS_JWT_SECRET: z.string().min(16),
    ACCESS_JWT_EXPIRES_IN: z.string(),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('debug'),
    FRONTEND_URL: z.string(),
});

export const config = environmentSchema.parse(process.env);