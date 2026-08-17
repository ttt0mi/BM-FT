export interface PaginatedResponse<T> {
    items: T[];
    nextCursor: string | null; // null means "no more pages"
    hasMore: boolean;
}

/**
 * Builds a PaginatedResponse from a page of rows fetched with `take: limit + 1`.
 *
 * Fetching one extra row lets us determine `hasMore` without running a
 * separate, expensive COUNT query — if we got more rows back than the
 * requested limit, there's a next page.
 *
 * Reusable across any module that lists resources (transactions today,
 * potentially accounts or budgets later).
 */
export function buildPaginatedResponse<T extends { id: string }>(
    rows: T[],
    limit: number,
): PaginatedResponse<T> {
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? (items[items.length - 1] as T).id : null;

    return { items, nextCursor, hasMore };
}
