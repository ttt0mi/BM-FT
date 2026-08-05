import { type FastifyInstance, type FastifyError } from 'fastify';
import fp from 'fastify-plugin';
import { AppError, ErrorCodes } from '@/shared/errors/AppError.js';

export default fp(async (fastify: FastifyInstance) => {
    fastify.setNotFoundHandler((request, reply) => {
        reply.status(404).send({
            success: false,
            error: {
                code: ErrorCodes.NOT_FOUND,
                message: `Resource not found`,
                details: {
                    method: request.method,
                    url: request.url,
                },
            },
        });
    });

    fastify.setErrorHandler((error: AppError | FastifyError, request, reply) => {
        if (error instanceof AppError) {
            return reply.status(error.status).send({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                    details: error?.details,
                },
            });
        }

        // Fastify's built-in validation errors (from JSON schema or Zod)
        if (error.validation) {
            return reply.status(422).send({
                success: false,
                error: {
                    code: ErrorCodes.VALIDATION_ERROR,
                    message: `Could not process request. Validation failed`,
                    details: error.validation.map((err) => ({
                        field:
                            err.instancePath.split('/').filter(Boolean).join('.') ||
                            err.params.missingProperty ||
                            'root',
                        rule: err.keyword,
                        message: err.message,
                    })),
                },
            });
        }

        request.log.error(error);
        return reply.status(500).send({
            success: false,
            error: {
                code: ErrorCodes.INTERNAL_SERVER_ERROR,
                message: error.message,
                details: {
                    method: request.method,
                    url: request.url,
                    cause: error.cause,
                    stack: error.stack,
                },
            },
        });
    });
});
