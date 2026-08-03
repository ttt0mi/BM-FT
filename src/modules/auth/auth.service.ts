import argon2 from 'argon2';
import type { PrismaClient } from '@/generated/prisma/client.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '@/shared/errors/AppError.js';
import type { RegisterInput, LoginInput, UserResponse } from './auth.schema.js';

// Every function in this file must return UserResponse, never the raw Prisma model.
function toUserResponse(user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: Date;
}): UserResponse {
    return {
        id: user.id,
        fullName: user.firstName.concat(' ', user.lastName),
        email: user.email,
        createdAt: user.createdAt,
    };
}

/**
 * Registers a new user.
 *
 * This function accepts Prisma as a parameter (dependency injection) rather than
 * importing the singleton directly.
 */
export async function registerUser(
    prisma: PrismaClient,
    input: RegisterInput,
): Promise<UserResponse> {
    const existing = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (existing) {
        throw new ConflictError('An account with this email already exists', {
            details: { field: 'email' },
        });
    }

    const passwordHash = await argon2.hash(input.password);

    const user = await prisma.user.create({
        data: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            hashedPassword: passwordHash,
        },
    });

    return toUserResponse(user);
}

/**
 * Verifies credentials and returns the authenticated user.
 */
export async function loginUser(prisma: PrismaClient, input: LoginInput): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (!user || user.deletedAt) {
        throw new UnauthorizedError('Login Failed, Invalid user credentials');
    }

    const isValid = await argon2.verify(user.hashedPassword, input.password);

    if (!isValid) {
        throw new UnauthorizedError('Login Failed, Invalid user credentials');
    }

    return toUserResponse(user);
}

/**
 * Returns a user by their ID
 */
export async function getUserById(prisma: PrismaClient, userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user || user.deletedAt) {
        throw new NotFoundError('User not found');
    }

    return toUserResponse(user);
}
