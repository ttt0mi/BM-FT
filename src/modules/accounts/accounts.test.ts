import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { AccountType } from '@/generated/prisma/client.js';
import { buildApp } from '@/app.js';
import type { SuccessResponse, ErrorResponse } from '@/types/index.js';
import type { AccountResponse, DeletedAccountResponse } from './accounts.schema.js';
import type { AuthResponse } from '../auth/auth.schema.js';
import type { ValidationErrorObject } from '@/shared/errors/schema.js';

const USER_A_EMAIL = 'accounts.user_a@example.com';
const USER_B_EMAIL = 'accounts.user_b@example.com';
const TEST_PASSWORD = 'TestPassword123!';

describe('Account Routes', () => {
    let app: FastifyInstance;
    let userAToken: string;
    let userBToken: string;

    beforeAll(async () => {
        app = await buildApp();
        await app.ready();

        await app.prisma.$transaction([
            app.prisma.account.deleteMany({
                where: { user: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } } },
            }),
            app.prisma.user.deleteMany({
                where: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } },
            }),
        ]);

        //create test users
        const [resA, resB] = await Promise.all([
            app.inject({
                method: 'POST',
                url: '/api/v1/auth/register',
                payload: {
                    firstName: 'User',
                    lastName: 'Alpha',
                    email: USER_A_EMAIL,
                    password: TEST_PASSWORD,
                    preferences: {
                        currency: 'NGN',
                        timezone: 'Africa/Lagos',
                        locale: 'en-NG',
                        weekStartsOn: 'SUNDAY',
                    },
                },
            }),
            app.inject({
                method: 'POST',
                url: '/api/v1/auth/register',
                payload: {
                    firstName: 'User',
                    lastName: 'Beta',
                    email: USER_B_EMAIL,
                    password: TEST_PASSWORD,
                },
            }),
        ]);

        userAToken = resA.json<SuccessResponse<AuthResponse>>().data.accessToken;
        userBToken = resB.json<SuccessResponse<AuthResponse>>().data.accessToken;
    });

    afterAll(async () => {
        await app.prisma.$transaction([
            app.prisma.account.deleteMany({
                where: { user: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } } },
            }),
            app.prisma.user.deleteMany({
                where: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } },
            }),
        ]);
        await app.close();
    });

    beforeEach(async () => {
        await app.prisma.account.deleteMany({
            where: { user: { email: { in: [USER_A_EMAIL, USER_B_EMAIL] } } },
        });
    });

    /**
     * Creates a test account with optional overrides.
     *
     * @param {string} [token] - The authentication token for the account creation request.
     * @param {Object} overrides - Optional parameters to override the default account creation.
     * @param {string} [overrides.name] - The name of the account.
     * @param {AccountType} [overrides.type] - The type of the account.
     * @param {string} [overrides.currency] - The currency of the account.
     * @param {string} [overrides.notes] - Notes about the account.
     * @return {Promise<SuccessResponse<AccountResponse>>} A promise that resolves to the response object containing the created account.
     */
    const createTestAccount = async (
        token: string,
        overrides: {
            name?: string;
            type?: AccountType;
            currency?: string;
            notes?: string;
        } = {},
    ): Promise<SuccessResponse<AccountResponse>> => {
        const res = await app.inject({
            method: 'POST',
            url: '/api/v1/accounts',
            headers: { authorization: `Bearer ${token}` },
            payload: { name: 'Main Account', type: AccountType.SAVINGS, ...overrides },
        });
        return res.json();
    };

    describe('POST /api/v1/accounts', () => {
        it('creates an account with the correct initial state', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/accounts',
                headers: { authorization: `Bearer ${userAToken}` },
                payload: { name: 'Salary Account', type: AccountType.SAVINGS, currency: 'USD' },
            });

            expect(res.statusCode).toBe(201);

            const body = res.json<SuccessResponse<AccountResponse>>();
            expect(body.success).toBe(true);
            expect(body.data.name).toBe('Salary Account');
            expect(body.data.type).toBe(AccountType.SAVINGS);
            expect(body.data.currency).toBe('USD');
            expect(body.data.balance).toBe('0.00');
            expect(body.data.notes).toBeNull();
            expect(body.data.id).toBeDefined();
            expect(body.data.createdAt).toBeDefined();
        });

        it('creates an account with notes', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/accounts',
                headers: { authorization: `Bearer ${userAToken}` },
                payload: {
                    name: 'Annotated Account',
                    type: AccountType.CASH,
                    notes: 'Used for daily expenses',
                },
            });

            expect(res.statusCode).toBe(201);
            expect(res.json<SuccessResponse<AccountResponse>>().data.notes).toBe(
                'Used for daily expenses',
            );
        });

        it("uses the user's preference currency when none is provided", async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/accounts',
                headers: { authorization: `Bearer ${userAToken}` },
                payload: { name: 'No Currency', type: AccountType.MOBILE_MONEY },
            });

            expect(res.statusCode).toBe(201);
            expect(res.json<SuccessResponse<AccountResponse>>().data.currency).toBe('NGN');
        });

        it('returns 422 when name is missing', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/accounts',
                headers: { authorization: `Bearer ${userAToken}` },
                payload: { type: AccountType.CHECKING },
            });

            expect(res.statusCode).toBe(422);
            expect(res.json<ErrorResponse<ValidationErrorObject>>().error.code).toBe(
                'VALIDATION_ERROR',
            );
        });

        it('returns 422 when type is missing', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/accounts',
                headers: { authorization: `Bearer ${userAToken}` },
                payload: { name: 'No Type Account' },
            });

            expect(res.statusCode).toBe(422);
        });

        it('returns 422 for an invalid account type', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/accounts',
                headers: { authorization: `Bearer ${userAToken}` },
                payload: { name: 'Bad Type', type: 'INVALID_TYPE' },
            });

            expect(res.statusCode).toBe(422);
        });

        it('returns 422 for a currency that is not 3 uppercase letters', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/accounts',
                headers: { authorization: `Bearer ${userAToken}` },
                payload: { name: 'Test', type: AccountType.CHECKING, currency: 'US' },
            });

            expect(res.statusCode).toBe(422);
        });

        it('returns 401 without a token', async () => {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/accounts',
                payload: { name: 'Test', type: AccountType.CHECKING },
            });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/v1/accounts', () => {
        it('returns an empty array when the user has no accounts', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/api/v1/accounts',
                headers: { authorization: `Bearer ${userAToken}` },
            });

            expect(res.statusCode).toBe(200);
            expect(res.json<SuccessResponse<AccountResponse[]>>().data).toHaveLength(0);
        });

        it("returns only the authenticated user's accounts, never other users'", async () => {
            await createTestAccount(userAToken, { name: 'A - Checking' });
            await createTestAccount(userAToken, { name: 'A - Savings', type: AccountType.SAVINGS });
            await createTestAccount(userBToken, { name: 'B - Main' });

            const res = await app.inject({
                method: 'GET',
                url: '/api/v1/accounts',
                headers: { authorization: `Bearer ${userAToken}` },
            });

            const accounts = res.json<SuccessResponse<AccountResponse[]>>().data;
            expect(accounts).toHaveLength(2);
            expect(new Set(accounts.map((a) => a.userId)).size).toBe(1);
            expect(accounts.find((a) => a.name === 'B - Main')).toBeUndefined();
        });

        it('returns 401 without a token', async () => {
            const res = await app.inject({ method: 'GET', url: '/api/v1/accounts' });
            expect(res.statusCode).toBe(401);
        });

        describe('filters', () => {
            //creates a fixed set of accounts for all filter tests in this block.
            beforeEach(async () => {
                await Promise.all([
                    createTestAccount(userAToken, {
                        name: 'Checking NGN',
                        type: AccountType.LOAN,
                        currency: 'NGN',
                    }),
                    createTestAccount(userAToken, {
                        name: 'Savings NGN',
                        type: AccountType.SAVINGS,
                        currency: 'NGN',
                    }),
                    createTestAccount(userAToken, {
                        name: 'Savings USD',
                        type: AccountType.SAVINGS,
                        currency: 'USD',
                    }),
                    createTestAccount(userAToken, {
                        name: 'Cash EUR',
                        type: AccountType.CASH,
                        currency: 'EUR',
                    }),
                ]);
            });

            it('filters by type and returns only matching accounts', async () => {
                const res = await app.inject({
                    method: 'GET',
                    url: `/api/v1/accounts?type=${AccountType.SAVINGS}`,
                    headers: { authorization: `Bearer ${userAToken}` },
                });

                const accounts = res.json<SuccessResponse<AccountResponse[]>>().data;
                expect(accounts).toHaveLength(2);
                expect(accounts.every((a) => a.type === AccountType.SAVINGS)).toBe(true);
            });

            it('filters by currency and returns only matching accounts', async () => {
                const res = await app.inject({
                    method: 'GET',
                    url: '/api/v1/accounts?currency=NGN',
                    headers: { authorization: `Bearer ${userAToken}` },
                });

                const accounts = res.json<SuccessResponse<AccountResponse[]>>().data;
                expect(accounts).toHaveLength(2);
                expect(accounts.every((a) => a.currency === 'NGN')).toBe(true);
            });

            it('filters by type and currency and returns accounts with both conditions', async () => {
                const res = await app.inject({
                    method: 'GET',
                    url: `/api/v1/accounts?type=${AccountType.SAVINGS}&currency=NGN`,
                    headers: { authorization: `Bearer ${userAToken}` },
                });

                const accounts = res.json<SuccessResponse<AccountResponse[]>>().data;
                expect(accounts).toHaveLength(1);
                expect(accounts[0]?.type).toBe(AccountType.SAVINGS);
                expect(accounts[0]?.name).toBe('Savings NGN');
            });

            it('returns empty array when no accounts match the combined filters', async () => {
                const res = await app.inject({
                    method: 'GET',
                    url: `/api/v1/accounts?type=${AccountType.INVESTMENT}&currency=NGN`,
                    headers: { authorization: `Bearer ${userAToken}` },
                });

                expect(res.json<SuccessResponse<AccountResponse[]>>().data).toHaveLength(0);
            });

            it('returns all accounts when createdAfter is before account creation', async () => {
                const yesterday = new Date(Date.now() - 86_400_000).toISOString();

                const res = await app.inject({
                    method: 'GET',
                    url: `/api/v1/accounts?createdAfter=${yesterday}`,
                    headers: { authorization: `Bearer ${userAToken}` },
                });

                //all accounts were created after yesterday
                expect(res.json<SuccessResponse<AccountResponse[]>>().data).toHaveLength(4);
            });

            it('returns empty array when createdAfter is after account creation', async () => {
                const tomorrow = new Date(Date.now() + 86_400_000).toISOString();

                const res = await app.inject({
                    method: 'GET',
                    url: `/api/v1/accounts?createdAfter=${tomorrow}`,
                    headers: { authorization: `Bearer ${userAToken}` },
                });

                expect(res.json<SuccessResponse<AccountResponse[]>>().data).toHaveLength(0);
            });

            it('returns empty array when createdBefore is before account creation', async () => {
                const yesterday = new Date(Date.now() - 86_400_000).toISOString();

                const res = await app.inject({
                    method: 'GET',
                    url: `/api/v1/accounts?createdBefore=${yesterday}`,
                    headers: { authorization: `Bearer ${userAToken}` },
                });

                expect(res.json<SuccessResponse<AccountResponse[]>>().data).toHaveLength(0);
            });

            it('returns all accounts when createdBefore is after account creation', async () => {
                const tomorrow = new Date(Date.now() + 86_400_000).toISOString();

                const res = await app.inject({
                    method: 'GET',
                    url: `/api/v1/accounts?createdBefore=${tomorrow}`,
                    headers: { authorization: `Bearer ${userAToken}` },
                });

                expect(res.json<SuccessResponse<AccountResponse[]>>().data).toHaveLength(4);
            });

            it('filters with date range with and type filter', async () => {
                const yesterday = new Date(Date.now() - 86_400_000).toISOString();
                const tomorrow = new Date(Date.now() + 86_400_000).toISOString();

                const res = await app.inject({
                    method: 'GET',
                    url: `/api/v1/accounts?type=${AccountType.SAVINGS}&createdAfter=${yesterday}&createdBefore=${tomorrow}`,
                    headers: { authorization: `Bearer ${userAToken}` },
                });

                const accounts = res.json<SuccessResponse<AccountResponse[]>>().data;
                expect(accounts).toHaveLength(2);
                expect(accounts.every((a) => a.type === AccountType.SAVINGS)).toBe(true);
            });

            it('returns 422 for an invalid type query param', async () => {
                const res = await app.inject({
                    method: 'GET',
                    url: '/api/v1/accounts?type=INVALID_TYPE',
                    headers: { authorization: `Bearer ${userAToken}` },
                });

                expect(res.statusCode).toBe(422);
            });
        });
    });

    describe('GET /api/v1/accounts/:id', () => {
        it('returns the full account for its owner', async () => {
            const { data: created } = await createTestAccount(userAToken, {
                name: 'My Account',
                type: AccountType.INVESTMENT,
                notes: 'Long-term savings',
            });

            const res = await app.inject({
                method: 'GET',
                url: `/api/v1/accounts/${created.id}`,
                headers: { authorization: `Bearer ${userAToken}` },
            });

            expect(res.statusCode).toBe(200);

            const { data } = res.json<SuccessResponse<AccountResponse>>();
            expect(data.id).toBe(created.id);
            expect(data.type).toBe(AccountType.INVESTMENT);
            expect(data.notes).toBe('Long-term savings');
        });

        it('returns 404 for a non-existent account ID', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/api/v1/accounts/this-id-does-not-exist',
                headers: { authorization: `Bearer ${userAToken}` },
            });

            expect(res.statusCode).toBe(404);
        });

        it("returns 403 when User B tries to access User A's account", async () => {
            const { data: userAAccount } = await createTestAccount(userAToken);

            const res = await app.inject({
                method: 'GET',
                url: `/api/v1/accounts/${userAAccount.id}`,
                headers: { authorization: `Bearer ${userBToken}` },
            });

            expect(res.statusCode).toBe(403);
        });

        it('returns 401 without a token', async () => {
            const { data: created } = await createTestAccount(userAToken);

            const res = await app.inject({
                method: 'GET',
                url: `/api/v1/accounts/${created.id}`,
            });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('PATCH /api/v1/accounts/:id', () => {
        it('updates the account name', async () => {
            const { data: created } = await createTestAccount(userAToken, { name: 'Old Name' });

            const res = await app.inject({
                method: 'PATCH',
                url: `/api/v1/accounts/${created.id}`,
                headers: { authorization: `Bearer ${userAToken}` },
                payload: { name: 'New Name' },
            });

            expect(res.statusCode).toBe(200);
            expect(res.json<SuccessResponse<AccountResponse>>().data.name).toBe('New Name');
        });

        it('sets notes when notes was previously null', async () => {
            const { data: created } = await createTestAccount(userAToken);
            expect(created.notes).toBeNull();

            const res = await app.inject({
                method: 'PATCH',
                url: `/api/v1/accounts/${created.id}`,
                headers: { authorization: `Bearer ${userAToken}` },
                payload: { notes: 'Added a note' },
            });

            expect(res.statusCode).toBe(200);
            expect(res.json<SuccessResponse<AccountResponse>>().data.notes).toBe('Added a note');
        });

        it('clears notes when null is sent', async () => {
            const { data: created } = await createTestAccount(userAToken, {
                notes: 'Will be cleared',
            });

            const res = await app.inject({
                method: 'PATCH',
                url: `/api/v1/accounts/${created.id}`,
                headers: { authorization: `Bearer ${userAToken}` },
                payload: { notes: null },
            });

            expect(res.statusCode).toBe(200);
            expect(res.json<SuccessResponse<AccountResponse>>().data.notes).toBeNull();
        });

        it('does not allow user to change account type', async () => {
            const { data: created } = await createTestAccount(userAToken, {
                type: AccountType.SAVINGS,
            });

            //if the user tries to change the account type, the update account schema doesn't include it,
            //so Zod strips it and the handler only gets the other fields.
            const res = await app.inject({
                method: 'PATCH',
                url: `/api/v1/accounts/${created.id}`,
                headers: { authorization: `Bearer ${userAToken}` },
                payload: { name: 'Updated', type: AccountType.CREDIT_CARD },
            });

            expect(res.statusCode).toBe(200);
            expect(res.json<SuccessResponse<AccountResponse>>().data.type).toBe(
                AccountType.SAVINGS,
            );
        });

        it('returns 422 when the request body has no valid fields', async () => {
            const { data: created } = await createTestAccount(userAToken);

            const res = await app.inject({
                method: 'PATCH',
                url: `/api/v1/accounts/${created.id}`,
                headers: { authorization: `Bearer ${userAToken}` },
                payload: {},
            });

            expect(res.statusCode).toBe(422);
        });

        it("returns 403 when User B tries to update User A's account", async () => {
            const { data: created } = await createTestAccount(userAToken);

            const res = await app.inject({
                method: 'PATCH',
                url: `/api/v1/accounts/${created.id}`,
                headers: { authorization: `Bearer ${userBToken}` },
                payload: { name: 'Not my account' },
            });

            expect(res.statusCode).toBe(403);
        });

        it('returns 404 for a non-existent account', async () => {
            const res = await app.inject({
                method: 'PATCH',
                url: '/api/v1/accounts/non-existent-id',
                headers: { authorization: `Bearer ${userAToken}` },
                payload: { name: 'Ghost' },
            });

            expect(res.statusCode).toBe(404);
        });

        it('returns 401 without a token', async () => {
            const { data: created } = await createTestAccount(userAToken);

            const res = await app.inject({
                method: 'PATCH',
                url: `/api/v1/accounts/${created.id}`,
                payload: { name: 'Unauthorized' },
            });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('DELETE /api/v1/accounts/:id', () => {
        it('soft-deletes an account and returns the deleted id', async () => {
            const { data: created } = await createTestAccount(userAToken);

            const res = await app.inject({
                method: 'DELETE',
                url: `/api/v1/accounts/${created.id}`,
                headers: { authorization: `Bearer ${userAToken}` },
            });

            expect(res.statusCode).toBe(200);
            expect(res.json<SuccessResponse<DeletedAccountResponse>>().data.id).toBe(created.id);
        });

        it('confirms the row still exists in the DB with deletedAt stamped', async () => {
            const { data: created } = await createTestAccount(userAToken);

            await app.inject({
                method: 'DELETE',
                url: `/api/v1/accounts/${created.id}`,
                headers: { authorization: `Bearer ${userAToken}` },
            });

            //bypass API to confirm it was a soft delete, not a hard delete
            const raw = await app.prisma.account.findUnique({ where: { id: created.id } });
            expect(raw).not.toBeNull();
            expect(raw?.deletedAt).not.toBeNull();
        });

        it('deleted account no longer appears in GET /accounts', async () => {
            const { data: created } = await createTestAccount(userAToken);

            await app.inject({
                method: 'DELETE',
                url: `/api/v1/accounts/${created.id}`,
                headers: { authorization: `Bearer ${userAToken}` },
            });

            const listAccountRes = await app.inject({
                method: 'GET',
                url: '/api/v1/accounts',
                headers: { authorization: `Bearer ${userAToken}` },
            });

            expect(listAccountRes.json<SuccessResponse<AccountResponse[]>>().data).toHaveLength(0);
        });

        it('deleted account returns 404 on subsequent GET /:id', async () => {
            const { data: created } = await createTestAccount(userAToken);

            await app.inject({
                method: 'DELETE',
                url: `/api/v1/accounts/${created.id}`,
                headers: { authorization: `Bearer ${userAToken}` },
            });

            const getRes = await app.inject({
                method: 'GET',
                url: `/api/v1/accounts/${created.id}`,
                headers: { authorization: `Bearer ${userAToken}` },
            });

            expect(getRes.statusCode).toBe(404);
        });

        it("returns 403 when User B tries to delete User A's account", async () => {
            const { data: created } = await createTestAccount(userAToken);

            const res = await app.inject({
                method: 'DELETE',
                url: `/api/v1/accounts/${created.id}`,
                headers: { authorization: `Bearer ${userBToken}` },
            });

            expect(res.statusCode).toBe(403);
        });

        it('returns 404 for a non-existent account', async () => {
            const res = await app.inject({
                method: 'DELETE',
                url: '/api/v1/accounts/non-existent-id',
                headers: { authorization: `Bearer ${userAToken}` },
            });

            expect(res.statusCode).toBe(404);
        });

        it('returns 401 without a token', async () => {
            const { data: created } = await createTestAccount(userAToken);

            const res = await app.inject({
                method: 'DELETE',
                url: `/api/v1/accounts/${created.id}`,
            });

            expect(res.statusCode).toBe(401);
        });
    });
});
