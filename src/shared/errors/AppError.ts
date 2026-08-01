import { type ErrorOptions } from '@/types/index.js';

const ErrorCode = {
    NOT_FOUND: 'NOT_FOUND',
    SERVER_ERROR: 'SERVER_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    CONFLICT: 'CONFLICT',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;


/**
 * Base application error. All other errors extend this.
 */
export class AppError extends Error {
    public readonly details?: unknown;

    constructor(
        message: string,
        public readonly status: number = 500,
        public readonly code: string = ErrorCode.SERVER_ERROR,
        options?: ErrorOptions,
    ) {
        super(message);
        this.name = 'AppError';
        this.details = options?.details;
    }
}

/**
 * 404 -> Resource not found.
 * @example throw new NotFoundError('Account not found')
 */
export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found', options?: ErrorOptions) {
        super(message, 404, ErrorCode.NOT_FOUND, options);
        this.name = 'NotFoundError';
    }
}

/**
 * 401 -> Not authenticated (no valid token).
 * @example throw new UnauthorizedError('Account not authorised', 
 *               details: {userId: 456, platform: "web"}
 *         )
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Authentication required', options?: ErrorOptions) {
        super(message, 401, ErrorCode.UNAUTHORIZED, options);
        this.name = 'UnauthorizedError';
    }
}

/**
 * 403 -> Authenticated but not allowed to access this resource.
 * E.g. trying to access another user's account.
 */
export class ForbiddenError extends AppError {
    constructor(
        message: string = 'You do not have permission to perform this action',
        options?: ErrorOptions,
    ) {
        super(message, 403, ErrorCode.FORBIDDEN, options);
        this.name = 'ForbiddenError';
    }
}

/**
 * 409 -> Conflict. Resource already exists, or a business rule was violated.
 * @example throw new ConflictError('An account with this name already exists')
 */
export class ConflictError extends AppError {
    constructor(message: string = 'Conflict', options?: ErrorOptions) {
        super(message, 409, ErrorCode.CONFLICT, options);
        this.name = 'ConflictError';
    }
}

/**
 * 422 -> Validation error. Input was structurally valid JSON but failed
 * business rules (e.g. amount exceeds limit).
 */
export class ValidationError extends AppError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, 422, ErrorCode.VALIDATION_ERROR, options);
        this.name = 'ValidationError';
    }
}
