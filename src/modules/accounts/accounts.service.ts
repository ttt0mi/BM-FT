import { Prisma, type Account, type PrismaClient } from '@/generated/prisma/client.js';
import { fromMinorUnit } from '@/lib/utilities.js';
import { ForbiddenError, NotFoundError } from '@/shared/errors/AppError.js';
import type {
    AccountResponse,
    CreateAccountInput,
    ListAccountsQuery,
    UpdateAccountInput,
} from './accounts.schema.js';

function toAccountResponse(account: Account): AccountResponse {
    return {
        id: account.id,
        userId: account.userId,
        name: account.name,
        type: account.type,
        balance: fromMinorUnit(account.balanceInMinorUnit, account.currency),
        currency: account.currency,
        notes: account.notes,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
    };
}

async function assertAccountAccess(
    prisma: PrismaClient,
    accountId: string,
    userId: string,
): Promise<Account> {
    const account = await prisma.account.findUnique({ where: { id: accountId } });

    if (!account || account.deletedAt) {
        throw new NotFoundError('Account not found');
    }

    if (account.userId !== userId) {
        throw new ForbiddenError('You do not have access to this account');
    }

    return account;
}

export async function createAccount(
    prisma: PrismaClient,
    userId: string,
    input: CreateAccountInput,
): Promise<AccountResponse> {
    let resolvedCurrency = input.currency;

    //if the client didn't specify a currency, use the user's preference.
    if (!resolvedCurrency) {
        const preference = await prisma.userPreference.findUnique({
            where: { userId: userId },
            select: { currency: true },
        });
        resolvedCurrency = preference?.currency ?? 'NGN';
    }

    const account = await prisma.account.create({
        data: {
            userId,
            name: input.name,
            type: input.type,
            currency: resolvedCurrency,
            notes: input.notes ?? null, //null means there are no notes, not undefined
            //every account starts at zero. every balance movement must come through a transaction
            balanceInMinorUnit: 0n,
        },
    });

    return toAccountResponse(account);
}

export async function listAccounts(
    prisma: PrismaClient,
    userId: string,
    filters: ListAccountsQuery,
): Promise<AccountResponse[]> {
    // TODO: add pagination
    const accounts = await prisma.account.findMany({
        where: {
            userId,
            deletedAt: null,
            type: filters.type ?? Prisma.skip,
            currency: filters.currency ?? Prisma.skip,
            createdAt: {
                gte: filters.createdAfter ?? Prisma.skip,
                lte: filters.createdBefore ?? Prisma.skip,
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return accounts.map(toAccountResponse);
}

export async function getAccountById(
    prisma: PrismaClient,
    accountId: string,
    userId: string,
): Promise<AccountResponse> {
    const account = await assertAccountAccess(prisma, accountId, userId);
    return toAccountResponse(account);
}

export async function updateAccount(
    prisma: PrismaClient,
    accountId: string,
    userId: string,
    input: UpdateAccountInput,
): Promise<AccountResponse> {
    await assertAccountAccess(prisma, accountId, userId);

    const account = await prisma.account.update({
        where: { id: accountId },
        data: {
            ...(input.name !== undefined && { name: input.name }),
            ...(input.notes !== undefined && { notes: input.notes }),
        },
    });

    return toAccountResponse(account);
}

export async function deleteAccount(
    prisma: PrismaClient,
    accountId: string,
    userId: string,
): Promise<void> {
    await assertAccountAccess(prisma, accountId, userId);
    await prisma.account.update({
        where: { id: accountId },
        data: { deletedAt: new Date() },
    });
}
