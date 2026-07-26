import { config } from '@/config/env.js';

export const envToLogger = {
    development: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
        level: config.LOG_LEVEL ?? 'debug',
    },
    production: {
        level: config.LOG_LEVEL ?? 'info',
    },
    test: false,
};
