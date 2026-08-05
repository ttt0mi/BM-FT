import * as z from 'zod';

/**
 * Builds a schema for a successful API response object with a fixed success flag and typed data payload. This ensures that success responses are consistently shaped across the application.
 *
 * @param data - Zod schema describing the shape of the response data payload.
 * @returns A Zod object schema with `success: true` and a `data` field matching the provided schema.
 */
export const successResponseSchemaFactory = <T extends z.ZodType>(
    data: T,
): z.ZodObject<{ success: z.ZodLiteral<true>; data: T }> =>
    z.object({
        success: z.literal(true),
        data,
    });

/**
 * Builds a schema for a failed API response object with a fixed failure flag and typed error payload. This ensures that error responses are consistently structured across the application.
 *
 * @param error - Zod schema describing the shape of the error payload.
 * @returns A Zod object schema with `success: false` and an `error` field matching the provided schema.
 */
export const errorResponseSchemaFactory = <T extends z.ZodType>(
    error: T,
): z.ZodObject<{ success: z.ZodLiteral<false>; error: T }> =>
    z.object({
        success: z.literal(false),
        error,
    });

/**
 * Describes a single validation issue found in a request or payload. It captures which field failed validation and what rule was violated, with an optional human-readable message.
 *
 * @returns A Zod object schema containing the validation field name, rule identifier, and optional message.
 */
export const ValidationDetailSchema = z.object({
    field: z.string(),
    rule: z.string(),
    message: z.string().optional(),
});

/**
 * Represents a generic application error payload based on the application's AppError class. It standardises error responses with a code, message, and optional structured details.
 *
 * @returns A Zod object schema containing an error code, human-readable message, and optional details field.
 */
export const AppErrorObjectSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
});

/**
 * Represents a validation-specific error payload containing detailed validation issues. It specialises the generic application error object for validation failures.
 *
 * @returns A Zod object schema with a fixed `VALIDATION_ERROR` code and a list of validation detail entries.
 */
export const ValidationErrorObjectSchema = AppErrorObjectSchema.extend({
    code: z.literal('VALIDATION_ERROR'),
    details: z.array(ValidationDetailSchema),
});

export type AppErrorObject = z.infer<typeof AppErrorObjectSchema>;
export type ValidationErrorObject = z.infer<typeof ValidationErrorObjectSchema>;
