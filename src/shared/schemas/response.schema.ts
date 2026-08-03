import * as z from 'zod';

export const successResponseSchemaFactory = <T extends z.ZodType>(
    data: T,
): z.ZodObject<{ success: z.ZodLiteral<true>; data: T }> =>
    z.object({
        success: z.literal(true),
        data,
    });

export const errorResponseSchemaFactory = <T extends z.ZodType>(
    error: T,
): z.ZodObject<{ success: z.ZodLiteral<false>; error: T }> =>
    z.object({
        success: z.literal(false),
        error,
    });

//add docstring to explain what this does
export const ValidationDetailSchema = z.object({
    field: z.string(),
    rule: z.string(),
    message: z.string().optional(),
});

export const AppErrorObjectSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
});

export const ValidationErrorObjectSchema = AppErrorObjectSchema.extend({
    code: z.literal('VALIDATION_ERROR'),
    details: z.array(ValidationDetailSchema),
});

export type AppErrorObject = z.infer<typeof AppErrorObjectSchema>;
export type ValidationErrorObject = z.infer<typeof ValidationErrorObjectSchema>;
