import * as z from 'zod';
import { AccountType } from '@/generated/prisma/client.js';

//ISO 4217: exactly 3 uppercase letters. check https://www.iso.org/iso-4217-currency-codes.html
export const CurrencySchema = z
    .string()
    .length(3, 'Currency must be a 3-letter ISO code (e.g. NGN, USD, EUR)')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase (e.g. NGN, USD, EUR)');

export const AccountTypeSchema = z.enum(AccountType);

export const CreateAccountSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100).trim(),
    type: AccountTypeSchema,
    currency: CurrencySchema.optional(), //currency is optional, falls back to user preference if not provided
    notes: z.string().max(500).trim().optional(),
});

export const UpdateAccountSchema = z
    .object({
        name: z.string().min(1, 'Name cannot be empty').max(100).trim(),
        notes: z.string().max(500).trim().nullable(), //null clears the field(note)
    })
    .partial()
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'At least one field must be provided',
    });

export const AccountParamsSchema = z.object({
    id: z.string().min(1),
});

export const ListAccountsQuerySchema = z.object({
    type: AccountTypeSchema.optional(),
    currency: CurrencySchema.optional(),
    createdAfter: z.coerce.date().optional(),
    createdBefore: z.coerce.date().optional(),
});

export const AccountResponseSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    type: AccountTypeSchema,
    balance: z.string(), //decimal string from fromMinorUnits() — BigInt never exposed
    currency: CurrencySchema,
    notes: z.string().nullable(), //notes can be undefined (no change), null (clear), or a string (update).
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const DeletedAccountResponseSchema = z.object({
    id: z.string(),
});

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
export type ListAccountsQuery = z.infer<typeof ListAccountsQuerySchema>;
export type AccountResponse = z.infer<typeof AccountResponseSchema>;
export type DeletedAccountResponse = z.infer<typeof DeletedAccountResponseSchema>;
