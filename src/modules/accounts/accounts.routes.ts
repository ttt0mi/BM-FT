import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import {
    errorResponseSchemaFactory,
    successResponseSchemaFactory,
} from '@/shared/schemas/response.js';
import { AppErrorObjectSchema, ValidationErrorObjectSchema } from '@/shared/errors/schema.js';
import {
    AccountParamsSchema,
    AccountResponseSchema,
    CreateAccountSchema,
    DeletedAccountResponseSchema,
    ListAccountsQuerySchema,
    UpdateAccountSchema,
} from './accounts.schema.js';
import * as accountsService from './accounts.service.js';
import * as z from 'zod';

const accountsRoutes: FastifyPluginAsyncZod = async (fastify) => {
    fastify.addHook('onRequest', fastify.authenticate);

    fastify.post(
        '/',
        {
            schema: {
                body: CreateAccountSchema,
                response: {
                    201: successResponseSchemaFactory(AccountResponseSchema),
                    401: errorResponseSchemaFactory(AppErrorObjectSchema),
                    422: errorResponseSchemaFactory(ValidationErrorObjectSchema),
                },
            },
        },
        async (request, reply) => {
            const account = await accountsService.createAccount(
                fastify.prisma,
                request.user.sub,
                request.body,
            );

            return reply.status(201).send({ success: true, data: account });
        },
    );

    fastify.get(
        '/',
        {
            schema: {
                querystring: ListAccountsQuerySchema,
                response: {
                    200: successResponseSchemaFactory(z.array(AccountResponseSchema)),
                    401: errorResponseSchemaFactory(AppErrorObjectSchema),
                    422: errorResponseSchemaFactory(ValidationErrorObjectSchema),
                },
            },
        },
        async (request, reply) => {
            const accounts = await accountsService.listAccounts(
                fastify.prisma,
                request.user.sub,
                request.query,
            );

            return reply.send({ success: true, data: accounts });
        },
    );

    fastify.get(
        '/:id',
        {
            schema: {
                params: AccountParamsSchema,
                response: {
                    200: successResponseSchemaFactory(AccountResponseSchema),
                    401: errorResponseSchemaFactory(AppErrorObjectSchema),
                    403: errorResponseSchemaFactory(AppErrorObjectSchema),
                    404: errorResponseSchemaFactory(AppErrorObjectSchema),
                },
            },
        },
        async (request, reply) => {
            const account = await accountsService.getAccountById(
                fastify.prisma,
                request.params.id,
                request.user.sub,
            );

            return reply.send({ success: true, data: account });
        },
    );

    fastify.patch(
        '/:id',
        {
            schema: {
                params: AccountParamsSchema,
                body: UpdateAccountSchema,
                response: {
                    200: successResponseSchemaFactory(AccountResponseSchema),
                    401: errorResponseSchemaFactory(AppErrorObjectSchema),
                    403: errorResponseSchemaFactory(AppErrorObjectSchema),
                    404: errorResponseSchemaFactory(AppErrorObjectSchema),
                    422: errorResponseSchemaFactory(ValidationErrorObjectSchema),
                },
            },
        },
        async (request, reply) => {
            const account = await accountsService.updateAccount(
                fastify.prisma,
                request.params.id,
                request.user.sub,
                request.body,
            );

            return reply.send({ success: true, data: account });
        },
    );

    fastify.delete(
        '/:id',
        {
            schema: {
                params: AccountParamsSchema,
                response: {
                    //the deleted id is returned so any client can update local state.
                    200: successResponseSchemaFactory(DeletedAccountResponseSchema),
                    401: errorResponseSchemaFactory(AppErrorObjectSchema),
                    403: errorResponseSchemaFactory(AppErrorObjectSchema),
                    404: errorResponseSchemaFactory(AppErrorObjectSchema),
                },
            },
        },
        async (request, reply) => {
            await accountsService.deleteAccount(
                fastify.prisma,
                request.params.id,
                request.user.sub,
            );

            return reply.send({ success: true, data: { id: request.params.id } });
        },
    );
};

export default accountsRoutes;
