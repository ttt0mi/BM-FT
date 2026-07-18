// Custom error class hierarchy for the application.
// Why custom errors?
// - They carry an HTTP status code so the error handler knows what to respond with
// - They carry a machine-readable `code` string (e.g. 'ACCOUNT_NOT_FOUND')
//   that clients can switch on without parsing message strings
// - TypeScript lets you `catch (e) { if (e instanceof NotFoundError) ... }`

/**
 * Base application error. All other errors extend this.
 */
export class AppError extends Error {
    constructor(
        message: string,
        public readonly status: number= 500,
        public readonly code: string = ErrorCode.SERVER_ERROR,
        public readonly details?: unknown,
    ) {
        super(message);
        this.status = status;
        this.code = code;
        this.name = 'AppError';
    }
}

/**
 * 404 — Resource not found.
 * @example throw new NotFoundError('Account not found')
 */
export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, 404, ErrorCode.NOT_FOUND);
        this.name = "NotFoundError";
    }
}

/**
 * 401 — Not authenticated (no valid token).
 */
export class UnauthorizedError extends AppError {
    constructor(message = "Authentication required") {
        super(message, 401, ErrorCode.UNAUTHORIZED);
        this.name = "UnauthorizedError";
    }
}

/**
 * 403 — Authenticated but not allowed to access this resource.
 * E.g. trying to access another user's account.
 */
export class ForbiddenError extends AppError {
    constructor(message = "You do not have permission to perform this action") {
        super(message, 403, ErrorCode.FORBIDDEN);
        this.name = "ForbiddenError";
    }
}

/**
 * 409 — Conflict. Resource already exists, or a business rule was violated.
 * @example throw new ConflictError('An account with this name already exists')
 */
export class ConflictError extends AppError {
    constructor(message = "Conflict") {
        super(message, 409, ErrorCode.CONFLICT);
        this.name = "ConflictError";
    }
}

/**
 * 422 — Validation error. Input was structurally valid JSON but failed
 * business rules (e.g. amount exceeds limit).
 */
export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 422, ErrorCode.VALIDATION_ERROR);
        this.name = "ValidationError";
    }
}


const ErrorCode = {
    NOT_FOUND: 'NOT_FOUND',
    SERVER_ERROR: 'SERVER_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    CONFLICT: 'CONFLICT',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;
