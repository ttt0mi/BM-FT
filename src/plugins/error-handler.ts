import { type FastifyInstance, type FastifyError } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '@/shared/errors/AppError.js';

export default fp(async (fastify: FastifyInstance) => {
    fastify.setNotFoundHandler((request, reply) => {
        reply.status(404).send({
            error: {
                code: 'NOT_FOUND',
                message: `Route ${request.method} ${request.url} not found`,
            },
        });
    });

    fastify.setErrorHandler((error: AppError | FastifyError, request, reply) => {
        // AppError subclasses. use their status code and code
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send({
                error: {
                    errorType: error.errorType,
                    message: error.message,
                },
            });
        }

        // Fastify's built-in validation errors (from JSON schema or Zod)
        if (error.validation) {
            return reply.status(422).send({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: `Could not process request ${request.id}. Validation failed`,
                    details: error.validation,
                },
            });
        }

        // Unknown errors. log them and return a generic 500
        request.log.error(error);
        return reply.status(500).send({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
            },
        });
    });
});
