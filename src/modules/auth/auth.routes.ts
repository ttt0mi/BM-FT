import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { RegisterSchema, LoginSchema, UserResponseSchema } from './auth.schema.js';
import * as authService from './auth.service.js';
import {
    successResponseSchemaFactory,
    errorResponseSchemaFactory,
    AppErrorObjectSchema,
    ValidationErrorObjectSchema,
} from '@/shared/schemas/response.schema.js';
import { AuthResponseSchema } from './auth.schema.js';

const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.post(
        '/register',
        {
            schema: {
                body: RegisterSchema,
                response: {
                    201: successResponseSchemaFactory(AuthResponseSchema),
                    409: errorResponseSchemaFactory(AppErrorObjectSchema), //for conflict errors
                    422: errorResponseSchemaFactory(ValidationErrorObjectSchema),
                },
            },
        },
        async (request, reply) => {
            const { body } = request;

            const user = await authService.registerUser(fastify.prisma, body);
            const accessToken = fastify.jwt.sign({ sub: user.id, email: user.email });

            return reply.status(201).send({ success: true, data: { accessToken, user } });
        },
    );

    fastify.post(
        '/login',
        {
            schema: {
                body: LoginSchema,
                response: {
                    200: successResponseSchemaFactory(AuthResponseSchema),
                    401: errorResponseSchemaFactory(AppErrorObjectSchema), //for unauthenticated errors
                    422: errorResponseSchemaFactory(ValidationErrorObjectSchema),
                },
            },
        },
        async (request, reply) => {
            const { body } = request;

            const user = await authService.loginUser(fastify.prisma, body);
            const accessToken = fastify.jwt.sign({ sub: user.id, email: user.email });

            return reply.status(200).send({ success: true, data: { accessToken, user } });
        },
    );

    fastify.get(
        '/me',
        {
            schema: {
                response: {
                    200: successResponseSchemaFactory(UserResponseSchema),
                    401: errorResponseSchemaFactory(AppErrorObjectSchema), //for unauthenticated errors
                    422: errorResponseSchemaFactory(ValidationErrorObjectSchema),
                },
            },
            onRequest: [fastify.authenticate],
        },
        async (request, reply) => {
            // request.user.sub is the user ID we signed into the token at login.
            // TypeScript knows this because of the JwtPayload augmentation in types/index.ts.
            const user = await authService.getUserById(fastify.prisma, request.user.sub);

            return reply.send({ success: true, data: user });
        },
    );
};

export default authRoutes;
