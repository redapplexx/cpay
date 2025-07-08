"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatValidationErrors = exports.formatErrorResponse = exports.handleError = exports.ErrorCodes = exports.WebhookError = exports.DatabaseError = exports.ExternalServiceError = exports.RateLimitError = exports.KYCError = exports.WalletError = exports.TransactionError = exports.InsufficientFundsError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.FintechError = void 0;
class FintechError extends Error {
    constructor(message, code, statusCode = 500, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.FintechError = FintechError;
class ValidationError extends FintechError {
    constructor(message, field) {
        const code = field ? `VALIDATION_ERROR_${field.toUpperCase()}` : 'VALIDATION_ERROR';
        super(message, code, 400);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends FintechError {
    constructor(message = 'Authentication required') {
        super(message, 'AUTHENTICATION_ERROR', 401);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends FintechError {
    constructor(message = 'Insufficient permissions') {
        super(message, 'AUTHORIZATION_ERROR', 403);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends FintechError {
    constructor(resource, id) {
        const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
        super(message, 'NOT_FOUND_ERROR', 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends FintechError {
    constructor(message) {
        super(message, 'CONFLICT_ERROR', 409);
    }
}
exports.ConflictError = ConflictError;
class InsufficientFundsError extends FintechError {
    constructor(walletId, required, available) {
        const message = `Insufficient funds in wallet ${walletId}. Required: ${required}, Available: ${available}`;
        super(message, 'INSUFFICIENT_FUNDS_ERROR', 400);
    }
}
exports.InsufficientFundsError = InsufficientFundsError;
class TransactionError extends FintechError {
    constructor(message, transactionId) {
        const code = transactionId ? `TRANSACTION_ERROR_${transactionId}` : 'TRANSACTION_ERROR';
        super(message, code, 400);
    }
}
exports.TransactionError = TransactionError;
class WalletError extends FintechError {
    constructor(message, walletId) {
        const code = walletId ? `WALLET_ERROR_${walletId}` : 'WALLET_ERROR';
        super(message, code, 400);
    }
}
exports.WalletError = WalletError;
class KYCError extends FintechError {
    constructor(message) {
        super(message, 'KYC_ERROR', 400);
    }
}
exports.KYCError = KYCError;
class RateLimitError extends FintechError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 'RATE_LIMIT_ERROR', 429);
    }
}
exports.RateLimitError = RateLimitError;
class ExternalServiceError extends FintechError {
    constructor(service, message) {
        super(message, `EXTERNAL_SERVICE_ERROR_${service.toUpperCase()}`, 502);
    }
}
exports.ExternalServiceError = ExternalServiceError;
class DatabaseError extends FintechError {
    constructor(message) {
        super(message, 'DATABASE_ERROR', 500);
    }
}
exports.DatabaseError = DatabaseError;
class WebhookError extends FintechError {
    constructor(message, webhookId) {
        const code = webhookId ? `WEBHOOK_ERROR_${webhookId}` : 'WEBHOOK_ERROR';
        super(message, code, 500);
    }
}
exports.WebhookError = WebhookError;
// Error codes for consistent error handling
exports.ErrorCodes = {
    // Validation errors
    INVALID_EMAIL: 'INVALID_EMAIL',
    INVALID_PHONE: 'INVALID_PHONE',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    INVALID_CURRENCY: 'INVALID_CURRENCY',
    INVALID_USER_ID: 'INVALID_USER_ID',
    INVALID_WALLET_ID: 'INVALID_WALLET_ID',
    INVALID_TRANSACTION_ID: 'INVALID_TRANSACTION_ID',
    // Authentication errors
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    // Authorization errors
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    ROLE_REQUIRED: 'ROLE_REQUIRED',
    // Business logic errors
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
    TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
    WALLET_ALREADY_EXISTS: 'WALLET_ALREADY_EXISTS',
    TRANSACTION_ALREADY_EXISTS: 'TRANSACTION_ALREADY_EXISTS',
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
    WALLET_SUSPENDED: 'WALLET_SUSPENDED',
    USER_SUSPENDED: 'USER_SUSPENDED',
    KYC_REQUIRED: 'KYC_REQUIRED',
    KYC_PENDING: 'KYC_PENDING',
    KYC_REJECTED: 'KYC_REJECTED',
    // System errors
    DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
    EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
    WEBHOOK_DELIVERY_ERROR: 'WEBHOOK_DELIVERY_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
};
// Error handler function
const handleError = (error) => {
    if (error instanceof FintechError) {
        return error;
    }
    if (error instanceof Error) {
        return new FintechError(error.message, 'UNKNOWN_ERROR', 500, false);
    }
    return new FintechError('An unknown error occurred', 'UNKNOWN_ERROR', 500, false);
};
exports.handleError = handleError;
// Error response formatter
const formatErrorResponse = (error) => {
    return {
        error: {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
            timestamp: new Date().toISOString(),
        },
    };
};
exports.formatErrorResponse = formatErrorResponse;
// Validation error formatter
const formatValidationErrors = (errors) => {
    return {
        error: {
            code: 'VALIDATION_ERRORS',
            message: 'Multiple validation errors occurred',
            statusCode: 400,
            timestamp: new Date().toISOString(),
            details: errors.map(err => ({
                code: err.code,
                message: err.message,
            })),
        },
    };
};
exports.formatValidationErrors = formatValidationErrors;
//# sourceMappingURL=errors.js.map