export const envToLogger = {
    development: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
        level: process.env.LOG_LEVEL ?? 'debug',
    },
    production: {
        level: process.env.LOG_LEVEL ?? 'info',
    },
    test: false,
};
