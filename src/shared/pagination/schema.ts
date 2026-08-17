import * as z from 'zod';

export const paginatedResponseSchemaFactory = <T extends z.ZodType>(
    item: T,
): z.ZodObject<{
    items: z.ZodArray<T>;
    nextCursor: z.ZodNullable<z.ZodString>;
    hasMore: z.ZodBoolean;
}> =>
    z.object({
        items: z.array(item),
        nextCursor: z.string().nullable(),
        hasMore: z.boolean(),
    });

// Reusable query schema for any cursor-paginated list endpoint.
// limit is coerced from the query string and clamped between 1 and 100.
export const PaginationQuerySchema = z.object({
    cursor: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Cursor-based pagination params.
 * Cursor pagination ("give me items after this ID").
 */
export type PaginationQueryParams = z.infer<typeof PaginationQuerySchema>;
