import "@fastify/jwt";

/**
 * Augment Fastify's JWT module so that TypeScript knows the exact
 * shape of the data stored inside our JWT tokens.
 *
 * After this, `request.user` anywhere in the app is typed as JwtPayload.
 */
declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: JwtPayload; // what we encode when we sign the token
        user: JwtPayload; // what request.user contains after verification
    }
}

export interface JwtPayload {
    sub: string; // the user's id
    email: string;
    iat?: number; // issued at (added automatically by the JWT library)
    exp?: number; // expiry (added automatically by the JWT library)
}

/**
 * A generic API response wrapper.
 * Every endpoint in this app returns a consistent shape:
 *   { success: true, data: {...} }   on success
 *   { success: false, error: '...' }  on failure
 */
export type ApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: string; details?: unknown };

/**
 * Cursor-based pagination params.
 * Offset pagination ("page 2 of 10") breaks when data changes between requests.
 * Cursor pagination ("give me items after this ID") is stable and scales better.
 */
export interface PaginationParams {
    cursor?: string; // the ID of the last item on the previous page
    limit?: number; // how many items to return (default: 20, max: 100)
}

export interface PaginatedResponse<T> {
    items: T[];
    nextCursor: string | null; // null means "no more pages"
    hasMore: boolean;
}
