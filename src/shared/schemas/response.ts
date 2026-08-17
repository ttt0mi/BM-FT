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
