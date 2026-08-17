import * as z from 'zod';

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
