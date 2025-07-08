export class FintechError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends FintechError {
  constructor(message: string, field?: string) {
    const code = field ? `VALIDATION_ERROR_${field.toUpperCase()}` : 'VALIDATION_ERROR';
    super(message, code, 400);
  }
}

export class AuthenticationError extends FintechError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class AuthorizationError extends FintechError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

export class NotFoundError extends FintechError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND_ERROR', 404);
  }
}

export class ConflictError extends FintechError {
  constructor(message: string) {
    super(message, 'CONFLICT_ERROR', 409);
  }
}

export class InsufficientFundsError extends FintechError {
  constructor(walletId: string, required: number, available: number) {
    const message = `Insufficient funds in wallet ${walletId}. Required: ${required}, Available: ${available}`;
    super(message, 'INSUFFICIENT_FUNDS_ERROR', 400);
  }
}

export class TransactionError extends FintechError {
  constructor(message: string, transactionId?: string) {
    const code = transactionId ? `TRANSACTION_ERROR_${transactionId}` : 'TRANSACTION_ERROR';
    super(message, code, 400);
  }
}

export class WalletError extends FintechError {
  constructor(message: string, walletId?: string) {
    const code = walletId ? `WALLET_ERROR_${walletId}` : 'WALLET_ERROR';
    super(message, code, 400);
  }
}

export class KYCError extends FintechError {
  constructor(message: string) {
    super(message, 'KYC_ERROR', 400);
  }
}

export class RateLimitError extends FintechError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429);
  }
}

export class ExternalServiceError extends FintechError {
  constructor(service: string, message: string) {
    super(message, `EXTERNAL_SERVICE_ERROR_${service.toUpperCase()}`, 502);
  }
}

export class DatabaseError extends FintechError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR', 500);
  }
}

export class WebhookError extends FintechError {
  constructor(message: string, webhookId?: string) {
    const code = webhookId ? `WEBHOOK_ERROR_${webhookId}` : 'WEBHOOK_ERROR';
    super(message, code, 500);
  }
}

// Error codes for consistent error handling
export const ErrorCodes = {
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
} as const;

// Error handler function
export const handleError = (error: unknown): FintechError => {
  if (error instanceof FintechError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new FintechError(error.message, 'UNKNOWN_ERROR', 500, false);
  }
  
  return new FintechError('An unknown error occurred', 'UNKNOWN_ERROR', 500, false);
};

// Error response formatter
export const formatErrorResponse = (error: FintechError) => {
  return {
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
    },
  };
};

// Validation error formatter
export const formatValidationErrors = (errors: ValidationError[]) => {
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