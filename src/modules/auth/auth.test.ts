import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '@/app.js';
import type { SuccessResponse, ErrorResponse } from '@/types/index.js';
import type { AuthResponse, UserResponse } from './auth.schema.js';
import type { AppErrorObject, ValidationErrorObject } from '@/shared/errors/schema.js';

const TEST_EMAIL = 'auth.test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const TEST_FIRST_NAME = 'Auth';
const TEST_LAST_NAME = 'TestUser';

const VALID_REGISTER_PAYLOAD = {
    firstName: TEST_FIRST_NAME,
    lastName: TEST_LAST_NAME,
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    preferences: {
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        locale: 'en-NG',
        weekStartsOn: 'SUNDAY',
    },
};

const TAMPERED_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
    '.eyJzdWIiOiJmYWtlLWlkIiwiZW1haWwiOiJmYWtlQGV4YW1wbGUuY29tIn0' +
    '.this-signature-is-invalid';

describe('Auth Routes', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = await buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        await app.prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    });

    describe('POST /api/v1/auth/register', () => {
        it('creates a user and returns a JWT + safe user object', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/register',
                payload: VALID_REGISTER_PAYLOAD,
            });

            expect(res.statusCode).toBe(201);
            const body = res.json<SuccessResponse<AuthResponse>>();
            expect(body.success).toBe(true);

            expect(body.data.accessToken.split('.')).toHaveLength(3);

            expect(body.data.user.email).toBe(TEST_EMAIL);
            expect(body.data.user.fullName).toBe(TEST_FIRST_NAME.concat(' ', TEST_LAST_NAME));
            expect(body.data.user.id).toBeDefined();
            expect(body.data.user.createdAt).toBeDefined();
            expect(body.data.user).not.toHaveProperty('hashedPassword');
            expect(body.data.user).not.toHaveProperty('deletedAt');
        });

        it('returns 409 when the email is already registered', async () => {
            await app.inject({
                method: 'POST',
                url: '/api/v1/auth/register',
                payload: VALID_REGISTER_PAYLOAD,
            });

            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/register',
                payload: VALID_REGISTER_PAYLOAD,
            });

            expect(res.statusCode).toBe(409);
            const { error } = res.json<ErrorResponse<AppErrorObject>>();
            expect(error.message).toBe('An account with this email already exists');
            expect(error.details).toStrictEqual({
                field: 'email',
            });
        });

        it('returns 422 for an invalid email format', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/register',
                payload: { ...VALID_REGISTER_PAYLOAD, email: 'not-an-email' },
            });

            expect(res.statusCode).toBe(422);

            const { error } = res.json<ErrorResponse<ValidationErrorObject>>();
            //field-level errors should tell the client exactly which field failed
            expect(error.details[0]).toBeDefined();
            expect(error.details[0]?.field).toBe('email');
        });

        it('returns 422 when password is shorter than 8 characters', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/register',
                payload: { ...VALID_REGISTER_PAYLOAD, password: 'short' },
            });

            expect(res.statusCode).toBe(422);

            const { error } = res.json<ErrorResponse<ValidationErrorObject>>();
            expect(error.details[0]).toBeDefined();
            expect(error.details[0]?.field).toBe('password');
        });

        it('returns 422 when required fields are missing', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/register',
                payload: { email: TEST_EMAIL },
            });

            expect(res.statusCode).toBe(422);

            const { error } = res.json<ErrorResponse<ValidationErrorObject>>();
            for (let i = 0; i < 3; i++) {
                expect(error.details[i]).toBeDefined();
                expect(['password', 'firstName', 'lastName']).toContain(error.details[i]?.field);
            }
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            await app.inject({
                method: 'POST',
                url: '/api/v1/auth/register',
                payload: VALID_REGISTER_PAYLOAD,
            });
        });

        it('returns a token and user for valid credentials', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/login',
                payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
            });

            expect(res.statusCode).toBe(200);
            const body = res.json<SuccessResponse<AuthResponse>>();
            expect(body.success).toBe(true);

            expect(body.data.accessToken.split('.')).toHaveLength(3);
            expect(body.data.user.email).toBe(TEST_EMAIL);
            expect(body.data.user).not.toHaveProperty('hashedPassword');
        });

        it('returns 401 for a wrong password', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/login',
                payload: { email: TEST_EMAIL, password: 'WrongPassword123!' },
            });

            expect(res.statusCode).toBe(401);

            const { error } = res.json<ErrorResponse<AppErrorObject>>();
            expect(error.message).toBe('Login Failed, Invalid user credentials');
        });

        it('returns 401 for a non-existent email', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/login',
                payload: { email: 'nobody@example.com', password: TEST_PASSWORD },
            });

            expect(res.statusCode).toBe(401);

            const { error } = res.json<ErrorResponse<AppErrorObject>>();
            expect(error.message).toBe('Login Failed, Invalid user credentials');
        });

        it('returns 422 for a missing password field', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/login',
                payload: { email: TEST_EMAIL },
            });

            expect(res.statusCode).toBe(422);

            const { error } = res.json<ErrorResponse<ValidationErrorObject>>();
            expect(error.details[0]).toBeDefined();
            expect(error.details[0]?.field).toBe('password');
        });
    });

    describe('GET /api/v1/auth/me', () => {
        it('returns the authenticated user profile with a valid token', async () => {
            const registerRes = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/register',
                payload: VALID_REGISTER_PAYLOAD,
            });

            const registerBody = registerRes.json<SuccessResponse<AuthResponse>>();
            expect(registerBody.success).toBe(true);

            const meRes = await app.inject({
                method: 'GET',
                url: '/api/v1/auth/me',
                headers: { authorization: `Bearer ${registerBody.data.accessToken}` },
            });

            expect(meRes.statusCode).toBe(200);

            const loginBody = meRes.json<SuccessResponse<UserResponse>>();

            expect(loginBody.success).toBe(true);

            expect(loginBody.data.email).toBe(TEST_EMAIL);
            expect(loginBody.data.fullName).toBe(TEST_FIRST_NAME.concat(' ', TEST_LAST_NAME));
            expect(loginBody.data).not.toHaveProperty('hashedPassword');
        });

        it('returns 401 when no Authorization header is sent', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/api/v1/auth/me',
            });

            expect(res.statusCode).toBe(401);
        });

        it('returns 401 for a token with an invalid signature', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/api/v1/auth/me',
                headers: { authorization: `Bearer ${TAMPERED_TOKEN}` },
            });

            expect(res.statusCode).toBe(401);
        });

        it('returns 401 for a malformed Authorization header', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/api/v1/auth/me',
                headers: { authorization: 'NotBearer randomToken' },
            });

            expect(res.statusCode).toBe(401);
        });

        it('returns 404 for an non-existent user', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/auth/register',
                payload: VALID_REGISTER_PAYLOAD,
            });
            const body = res.json<SuccessResponse<AuthResponse>>();

            await app.prisma.user.deleteMany({ where: { id: body.data.user.id } });

            const res2 = await app.inject({
                method: 'GET',
                url: '/api/v1/auth/me',
                headers: { authorization: `Bearer ${body.data.accessToken}` },
            });

            expect(res2.statusCode).toBe(404);
        });
    });
});
