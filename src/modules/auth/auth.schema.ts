import * as z from 'zod';
import { Weekday } from '@/generated/prisma/enums.js';
import { CurrencySchema } from '../accounts/accounts.schema.js';

export const UserPreferencesSchema = z.object({
    currency: CurrencySchema.default('NGN'),
    timezone: z.string().default('Africa/Lagos'),
    locale: z.string().default('en-NG'),
    weekStartsOn: z.enum(Weekday).default(Weekday.MONDAY),
});

export const RegisterSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50).trim(),
    lastName: z.string().min(1, 'Last name is required').max(50).trim(),
    email: z.email('Invalid email address').toLowerCase().trim(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(32, 'Password is too long')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/,
            'Password must contain at least 1 lowercase, 1 uppercase, 1 number, and 1 special character',
        ),
    preferences: UserPreferencesSchema.optional(),
});

export const LoginSchema = z.object({
    email: z.email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

export const UserResponseSchema = z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
    createdAt: z.date(),
});

export const AuthResponseSchema = z.object({
    accessToken: z.string(),
    user: UserResponseSchema,
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
