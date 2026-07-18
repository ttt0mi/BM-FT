import fp from 'fastify-plugin';
import fastifyEnv from '@fastify/env';
import { z } from 'zod';
import path from 'path';
import { environmentSchema } from '@/config/env.js';


const currentEnv = process.env.NODE_ENV || 'development';

const configOptions = {
    validate: (data: unknown) => {
        const result = environmentSchema.safeParse(data);
        if (!result.success) {
            console.error('Invalid env configuration:', z.treeifyError(result.error));
            throw new Error('Environment validation failed');
        }
        return result.data;
    },
    dotenv: {
        path: path.resolve(process.cwd(), `.env.${currentEnv}`),
        debug: currentEnv === 'development',
    },
};

export default fp(async (fastify) => {
    await fastify.register(fastifyEnv, configOptions);
});
