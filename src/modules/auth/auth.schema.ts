import * as z from 'zod';

export const RegisterSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50).trim(),
    lastName: z.string().min(1, 'Last name is required').max(50).trim(),
    email: z.email('Invalid email address').toLowerCase().trim(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(32, 'Password is too long'),
});

export const LoginSchema = z.object({
    email: z.email('Invalid email address').toLowerCase().trim(),
    // argon2.verify produces a constant-time 401, not a fast 422 that leaks information due to minimum password length.
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
