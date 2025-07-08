import { ValidationError } from './errors';
import { 
  validateEmail, 
  validatePhoneNumber, 
  validateAmount, 
  validateCurrency,
  validateUUID 
} from './index';
import { 
  UserRole, 
  WalletStatus, 
  TransactionType,
  KYCDocumentType,
  KYCDocumentStatus
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateUser = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.email || typeof data.email !== 'string') {
    errors.push(new ValidationError('Email is required', 'email'));
  } else if (!validateEmail(data.email)) {
    errors.push(new ValidationError('Invalid email format', 'email'));
  }

  if (!data.firstName || typeof data.firstName !== 'string') {
    errors.push(new ValidationError('First name is required', 'firstName'));
  } else if (data.firstName.length < 2 || data.firstName.length > 50) {
    errors.push(new ValidationError('First name must be between 2 and 50 characters', 'firstName'));
  }

  if (!data.lastName || typeof data.lastName !== 'string') {
    errors.push(new ValidationError('Last name is required', 'lastName'));
  } else if (data.lastName.length < 2 || data.lastName.length > 50) {
    errors.push(new ValidationError('Last name must be between 2 and 50 characters', 'lastName'));
  }

  // Optional fields with validation
  if (data.phoneNumber && !validatePhoneNumber(data.phoneNumber)) {
    errors.push(new ValidationError('Invalid phone number format', 'phoneNumber'));
  }

  if (data.dateOfBirth) {
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (isNaN(birthDate.getTime())) {
      errors.push(new ValidationError('Invalid date of birth format', 'dateOfBirth'));
    } else if (age < 18 || age > 120) {
      errors.push(new ValidationError('Age must be between 18 and 120 years', 'dateOfBirth'));
    }
  }

  if (data.nationality && typeof data.nationality !== 'string') {
    errors.push(new ValidationError('Nationality must be a string', 'nationality'));
  }

  if (data.role && !Object.values(UserRole).includes(data.role)) {
    errors.push(new ValidationError('Invalid user role', 'role'));
  }

  if (data.address) {
    const addressErrors = validateAddress(data.address);
    errors.push(...addressErrors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateAddress = (address: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!address.street || typeof address.street !== 'string') {
    errors.push(new ValidationError('Street address is required', 'address.street'));
  }

  if (!address.city || typeof address.city !== 'string') {
    errors.push(new ValidationError('City is required', 'address.city'));
  }

  if (!address.state || typeof address.state !== 'string') {
    errors.push(new ValidationError('State is required', 'address.state'));
  }

  if (!address.country || typeof address.country !== 'string') {
    errors.push(new ValidationError('Country is required', 'address.country'));
  }

  if (!address.postalCode || typeof address.postalCode !== 'string') {
    errors.push(new ValidationError('Postal code is required', 'address.postalCode'));
  }

  return errors;
};

export const validateWallet = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!data.userId || !validateUUID(data.userId)) {
    errors.push(new ValidationError('Valid user ID is required', 'userId'));
  }

  if (!data.currency || !validateCurrency(data.currency)) {
    errors.push(new ValidationError('Valid currency is required', 'currency'));
  }

  if (data.balance !== undefined && !validateAmount(data.balance)) {
    errors.push(new ValidationError('Balance must be a positive number', 'balance'));
  }

  if (data.availableBalance !== undefined && !validateAmount(data.availableBalance)) {
    errors.push(new ValidationError('Available balance must be a positive number', 'availableBalance'));
  }

  if (data.frozenBalance !== undefined && data.frozenBalance < 0) {
    errors.push(new ValidationError('Frozen balance cannot be negative', 'frozenBalance'));
  }

  if (data.status && !Object.values(WalletStatus).includes(data.status)) {
    errors.push(new ValidationError('Invalid wallet status', 'status'));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateTransaction = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!data.type || !Object.values(TransactionType).includes(data.type)) {
    errors.push(new ValidationError('Valid transaction type is required', 'type'));
  }

  if (!data.amount || !validateAmount(data.amount)) {
    errors.push(new ValidationError('Valid amount is required', 'amount'));
  }

  if (!data.currency || !validateCurrency(data.currency)) {
    errors.push(new ValidationError('Valid currency is required', 'currency'));
  }

  if (!data.description || typeof data.description !== 'string') {
    errors.push(new ValidationError('Description is required', 'description'));
  } else if (data.description.length > 500) {
    errors.push(new ValidationError('Description must be less than 500 characters', 'description'));
  }

  if (!data.reference || typeof data.reference !== 'string') {
    errors.push(new ValidationError('Reference is required', 'reference'));
  }

  // Validate wallet IDs if provided
  if (data.fromWalletId && !validateUUID(data.fromWalletId)) {
    errors.push(new ValidationError('Invalid from wallet ID', 'fromWalletId'));
  }

  if (data.toWalletId && !validateUUID(data.toWalletId)) {
    errors.push(new ValidationError('Invalid to wallet ID', 'toWalletId'));
  }

  // Validate user IDs if provided
  if (data.fromUserId && !validateUUID(data.fromUserId)) {
    errors.push(new ValidationError('Invalid from user ID', 'fromUserId'));
  }

  if (data.toUserId && !validateUUID(data.toUserId)) {
    errors.push(new ValidationError('Invalid to user ID', 'toUserId'));
  }

  // Validate fees
  if (data.fee !== undefined && data.fee < 0) {
    errors.push(new ValidationError('Fee cannot be negative', 'fee'));
  }

  if (data.fxFee !== undefined && data.fxFee < 0) {
    errors.push(new ValidationError('FX fee cannot be negative', 'fxFee'));
  }

  if (data.fxRate !== undefined && data.fxRate <= 0) {
    errors.push(new ValidationError('FX rate must be positive', 'fxRate'));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateKYCDocument = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!data.userId || !validateUUID(data.userId)) {
    errors.push(new ValidationError('Valid user ID is required', 'userId'));
  }

  if (!data.type || !Object.values(KYCDocumentType).includes(data.type)) {
    errors.push(new ValidationError('Valid document type is required', 'type'));
  }

  if (!data.fileUrl || typeof data.fileUrl !== 'string') {
    errors.push(new ValidationError('File URL is required', 'fileUrl'));
  }

  if (!data.fileName || typeof data.fileName !== 'string') {
    errors.push(new ValidationError('File name is required', 'fileName'));
  }

  if (data.fileSize === undefined || data.fileSize <= 0) {
    errors.push(new ValidationError('Valid file size is required', 'fileSize'));
  }

  if (!data.mimeType || typeof data.mimeType !== 'string') {
    errors.push(new ValidationError('MIME type is required', 'mimeType'));
  }

  if (data.status && !Object.values(KYCDocumentStatus).includes(data.status)) {
    errors.push(new ValidationError('Invalid document status', 'status'));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateMassPayout = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!data.recipients || !Array.isArray(data.recipients)) {
    errors.push(new ValidationError('Recipients array is required', 'recipients'));
  } else if (data.recipients.length === 0) {
    errors.push(new ValidationError('At least one recipient is required', 'recipients'));
  } else if (data.recipients.length > 1000) {
    errors.push(new ValidationError('Maximum 1000 recipients allowed per batch', 'recipients'));
  } else {
    // Validate each recipient
    data.recipients.forEach((recipient: any, index: number) => {
      if (!recipient.userId || !validateUUID(recipient.userId)) {
        errors.push(new ValidationError(`Invalid user ID for recipient ${index + 1}`, `recipients[${index}].userId`));
      }
      if (!recipient.amount || !validateAmount(recipient.amount)) {
        errors.push(new ValidationError(`Invalid amount for recipient ${index + 1}`, `recipients[${index}].amount`));
      }
    });
  }

  if (!data.currency || !validateCurrency(data.currency)) {
    errors.push(new ValidationError('Valid currency is required', 'currency'));
  }

  if (data.description && typeof data.description !== 'string') {
    errors.push(new ValidationError('Description must be a string', 'description'));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateWebhookConfig = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!data.url || typeof data.url !== 'string') {
    errors.push(new ValidationError('Webhook URL is required', 'url'));
  } else {
    try {
      new URL(data.url);
    } catch {
      errors.push(new ValidationError('Invalid webhook URL format', 'url'));
    }
  }

  if (!data.events || !Array.isArray(data.events)) {
    errors.push(new ValidationError('Events array is required', 'events'));
  } else if (data.events.length === 0) {
    errors.push(new ValidationError('At least one event type is required', 'events'));
  }

  if (!data.secret || typeof data.secret !== 'string') {
    errors.push(new ValidationError('Webhook secret is required', 'secret'));
  } else if (data.secret.length < 16) {
    errors.push(new ValidationError('Webhook secret must be at least 16 characters', 'secret'));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePagination = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  if (data.limit !== undefined) {
    if (!Number.isInteger(data.limit) || data.limit < 1 || data.limit > 100) {
      errors.push(new ValidationError('Limit must be between 1 and 100', 'limit'));
    }
  }

  if (data.offset !== undefined) {
    if (!Number.isInteger(data.offset) || data.offset < 0) {
      errors.push(new ValidationError('Offset must be a non-negative integer', 'offset'));
    }
  }

  if (data.page !== undefined) {
    if (!Number.isInteger(data.page) || data.page < 1) {
      errors.push(new ValidationError('Page must be a positive integer', 'page'));
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateDateRange = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  if (data.startDate) {
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push(new ValidationError('Invalid start date format', 'startDate'));
    }
  }

  if (data.endDate) {
    const endDate = new Date(data.endDate);
    if (isNaN(endDate.getTime())) {
      errors.push(new ValidationError('Invalid end date format', 'endDate'));
    }
  }

  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (startDate > endDate) {
      errors.push(new ValidationError('Start date cannot be after end date', 'dateRange'));
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generic validation function
export const validateObject = (data: any, schema: Record<string, (value: any) => boolean>): ValidationResult => {
  const errors: ValidationError[] = [];

  Object.entries(schema).forEach(([field, validator]) => {
    if (!validator(data[field])) {
      errors.push(new ValidationError(`Invalid ${field}`, field));
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}; 