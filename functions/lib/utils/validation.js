"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateObject = exports.validateDateRange = exports.validatePagination = exports.validateWebhookConfig = exports.validateMassPayout = exports.validateKYCDocument = exports.validateTransaction = exports.validateWallet = exports.validateAddress = exports.validateUser = void 0;
const errors_1 = require("./errors");
const index_1 = require("./index");
const types_1 = require("../types");
const validateUser = (data) => {
    const errors = [];
    // Required fields
    if (!data.email || typeof data.email !== 'string') {
        errors.push(new errors_1.ValidationError('Email is required', 'email'));
    }
    else if (!(0, index_1.validateEmail)(data.email)) {
        errors.push(new errors_1.ValidationError('Invalid email format', 'email'));
    }
    if (!data.firstName || typeof data.firstName !== 'string') {
        errors.push(new errors_1.ValidationError('First name is required', 'firstName'));
    }
    else if (data.firstName.length < 2 || data.firstName.length > 50) {
        errors.push(new errors_1.ValidationError('First name must be between 2 and 50 characters', 'firstName'));
    }
    if (!data.lastName || typeof data.lastName !== 'string') {
        errors.push(new errors_1.ValidationError('Last name is required', 'lastName'));
    }
    else if (data.lastName.length < 2 || data.lastName.length > 50) {
        errors.push(new errors_1.ValidationError('Last name must be between 2 and 50 characters', 'lastName'));
    }
    // Optional fields with validation
    if (data.phoneNumber && !(0, index_1.validatePhoneNumber)(data.phoneNumber)) {
        errors.push(new errors_1.ValidationError('Invalid phone number format', 'phoneNumber'));
    }
    if (data.dateOfBirth) {
        const birthDate = new Date(data.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (isNaN(birthDate.getTime())) {
            errors.push(new errors_1.ValidationError('Invalid date of birth format', 'dateOfBirth'));
        }
        else if (age < 18 || age > 120) {
            errors.push(new errors_1.ValidationError('Age must be between 18 and 120 years', 'dateOfBirth'));
        }
    }
    if (data.nationality && typeof data.nationality !== 'string') {
        errors.push(new errors_1.ValidationError('Nationality must be a string', 'nationality'));
    }
    if (data.role && !Object.values(types_1.UserRole).includes(data.role)) {
        errors.push(new errors_1.ValidationError('Invalid user role', 'role'));
    }
    if (data.address) {
        const addressErrors = (0, exports.validateAddress)(data.address);
        errors.push(...addressErrors);
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateUser = validateUser;
const validateAddress = (address) => {
    const errors = [];
    if (!address.street || typeof address.street !== 'string') {
        errors.push(new errors_1.ValidationError('Street address is required', 'address.street'));
    }
    if (!address.city || typeof address.city !== 'string') {
        errors.push(new errors_1.ValidationError('City is required', 'address.city'));
    }
    if (!address.state || typeof address.state !== 'string') {
        errors.push(new errors_1.ValidationError('State is required', 'address.state'));
    }
    if (!address.country || typeof address.country !== 'string') {
        errors.push(new errors_1.ValidationError('Country is required', 'address.country'));
    }
    if (!address.postalCode || typeof address.postalCode !== 'string') {
        errors.push(new errors_1.ValidationError('Postal code is required', 'address.postalCode'));
    }
    return errors;
};
exports.validateAddress = validateAddress;
const validateWallet = (data) => {
    const errors = [];
    if (!data.userId || !(0, index_1.validateUUID)(data.userId)) {
        errors.push(new errors_1.ValidationError('Valid user ID is required', 'userId'));
    }
    if (!data.currency || !(0, index_1.validateCurrency)(data.currency)) {
        errors.push(new errors_1.ValidationError('Valid currency is required', 'currency'));
    }
    if (data.balance !== undefined && !(0, index_1.validateAmount)(data.balance)) {
        errors.push(new errors_1.ValidationError('Balance must be a positive number', 'balance'));
    }
    if (data.availableBalance !== undefined && !(0, index_1.validateAmount)(data.availableBalance)) {
        errors.push(new errors_1.ValidationError('Available balance must be a positive number', 'availableBalance'));
    }
    if (data.frozenBalance !== undefined && data.frozenBalance < 0) {
        errors.push(new errors_1.ValidationError('Frozen balance cannot be negative', 'frozenBalance'));
    }
    if (data.status && !Object.values(types_1.WalletStatus).includes(data.status)) {
        errors.push(new errors_1.ValidationError('Invalid wallet status', 'status'));
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateWallet = validateWallet;
const validateTransaction = (data) => {
    const errors = [];
    if (!data.type || !Object.values(types_1.TransactionType).includes(data.type)) {
        errors.push(new errors_1.ValidationError('Valid transaction type is required', 'type'));
    }
    if (!data.amount || !(0, index_1.validateAmount)(data.amount)) {
        errors.push(new errors_1.ValidationError('Valid amount is required', 'amount'));
    }
    if (!data.currency || !(0, index_1.validateCurrency)(data.currency)) {
        errors.push(new errors_1.ValidationError('Valid currency is required', 'currency'));
    }
    if (!data.description || typeof data.description !== 'string') {
        errors.push(new errors_1.ValidationError('Description is required', 'description'));
    }
    else if (data.description.length > 500) {
        errors.push(new errors_1.ValidationError('Description must be less than 500 characters', 'description'));
    }
    if (!data.reference || typeof data.reference !== 'string') {
        errors.push(new errors_1.ValidationError('Reference is required', 'reference'));
    }
    // Validate wallet IDs if provided
    if (data.fromWalletId && !(0, index_1.validateUUID)(data.fromWalletId)) {
        errors.push(new errors_1.ValidationError('Invalid from wallet ID', 'fromWalletId'));
    }
    if (data.toWalletId && !(0, index_1.validateUUID)(data.toWalletId)) {
        errors.push(new errors_1.ValidationError('Invalid to wallet ID', 'toWalletId'));
    }
    // Validate user IDs if provided
    if (data.fromUserId && !(0, index_1.validateUUID)(data.fromUserId)) {
        errors.push(new errors_1.ValidationError('Invalid from user ID', 'fromUserId'));
    }
    if (data.toUserId && !(0, index_1.validateUUID)(data.toUserId)) {
        errors.push(new errors_1.ValidationError('Invalid to user ID', 'toUserId'));
    }
    // Validate fees
    if (data.fee !== undefined && data.fee < 0) {
        errors.push(new errors_1.ValidationError('Fee cannot be negative', 'fee'));
    }
    if (data.fxFee !== undefined && data.fxFee < 0) {
        errors.push(new errors_1.ValidationError('FX fee cannot be negative', 'fxFee'));
    }
    if (data.fxRate !== undefined && data.fxRate <= 0) {
        errors.push(new errors_1.ValidationError('FX rate must be positive', 'fxRate'));
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateTransaction = validateTransaction;
const validateKYCDocument = (data) => {
    const errors = [];
    if (!data.userId || !(0, index_1.validateUUID)(data.userId)) {
        errors.push(new errors_1.ValidationError('Valid user ID is required', 'userId'));
    }
    if (!data.type || !Object.values(types_1.KYCDocumentType).includes(data.type)) {
        errors.push(new errors_1.ValidationError('Valid document type is required', 'type'));
    }
    if (!data.fileUrl || typeof data.fileUrl !== 'string') {
        errors.push(new errors_1.ValidationError('File URL is required', 'fileUrl'));
    }
    if (!data.fileName || typeof data.fileName !== 'string') {
        errors.push(new errors_1.ValidationError('File name is required', 'fileName'));
    }
    if (data.fileSize === undefined || data.fileSize <= 0) {
        errors.push(new errors_1.ValidationError('Valid file size is required', 'fileSize'));
    }
    if (!data.mimeType || typeof data.mimeType !== 'string') {
        errors.push(new errors_1.ValidationError('MIME type is required', 'mimeType'));
    }
    if (data.status && !Object.values(types_1.KYCDocumentStatus).includes(data.status)) {
        errors.push(new errors_1.ValidationError('Invalid document status', 'status'));
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateKYCDocument = validateKYCDocument;
const validateMassPayout = (data) => {
    const errors = [];
    if (!data.recipients || !Array.isArray(data.recipients)) {
        errors.push(new errors_1.ValidationError('Recipients array is required', 'recipients'));
    }
    else if (data.recipients.length === 0) {
        errors.push(new errors_1.ValidationError('At least one recipient is required', 'recipients'));
    }
    else if (data.recipients.length > 1000) {
        errors.push(new errors_1.ValidationError('Maximum 1000 recipients allowed per batch', 'recipients'));
    }
    else {
        // Validate each recipient
        data.recipients.forEach((recipient, index) => {
            if (!recipient.userId || !(0, index_1.validateUUID)(recipient.userId)) {
                errors.push(new errors_1.ValidationError(`Invalid user ID for recipient ${index + 1}`, `recipients[${index}].userId`));
            }
            if (!recipient.amount || !(0, index_1.validateAmount)(recipient.amount)) {
                errors.push(new errors_1.ValidationError(`Invalid amount for recipient ${index + 1}`, `recipients[${index}].amount`));
            }
        });
    }
    if (!data.currency || !(0, index_1.validateCurrency)(data.currency)) {
        errors.push(new errors_1.ValidationError('Valid currency is required', 'currency'));
    }
    if (data.description && typeof data.description !== 'string') {
        errors.push(new errors_1.ValidationError('Description must be a string', 'description'));
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateMassPayout = validateMassPayout;
const validateWebhookConfig = (data) => {
    const errors = [];
    if (!data.url || typeof data.url !== 'string') {
        errors.push(new errors_1.ValidationError('Webhook URL is required', 'url'));
    }
    else {
        try {
            new URL(data.url);
        }
        catch (_a) {
            errors.push(new errors_1.ValidationError('Invalid webhook URL format', 'url'));
        }
    }
    if (!data.events || !Array.isArray(data.events)) {
        errors.push(new errors_1.ValidationError('Events array is required', 'events'));
    }
    else if (data.events.length === 0) {
        errors.push(new errors_1.ValidationError('At least one event type is required', 'events'));
    }
    if (!data.secret || typeof data.secret !== 'string') {
        errors.push(new errors_1.ValidationError('Webhook secret is required', 'secret'));
    }
    else if (data.secret.length < 16) {
        errors.push(new errors_1.ValidationError('Webhook secret must be at least 16 characters', 'secret'));
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateWebhookConfig = validateWebhookConfig;
const validatePagination = (data) => {
    const errors = [];
    if (data.limit !== undefined) {
        if (!Number.isInteger(data.limit) || data.limit < 1 || data.limit > 100) {
            errors.push(new errors_1.ValidationError('Limit must be between 1 and 100', 'limit'));
        }
    }
    if (data.offset !== undefined) {
        if (!Number.isInteger(data.offset) || data.offset < 0) {
            errors.push(new errors_1.ValidationError('Offset must be a non-negative integer', 'offset'));
        }
    }
    if (data.page !== undefined) {
        if (!Number.isInteger(data.page) || data.page < 1) {
            errors.push(new errors_1.ValidationError('Page must be a positive integer', 'page'));
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validatePagination = validatePagination;
const validateDateRange = (data) => {
    const errors = [];
    if (data.startDate) {
        const startDate = new Date(data.startDate);
        if (isNaN(startDate.getTime())) {
            errors.push(new errors_1.ValidationError('Invalid start date format', 'startDate'));
        }
    }
    if (data.endDate) {
        const endDate = new Date(data.endDate);
        if (isNaN(endDate.getTime())) {
            errors.push(new errors_1.ValidationError('Invalid end date format', 'endDate'));
        }
    }
    if (data.startDate && data.endDate) {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        if (startDate > endDate) {
            errors.push(new errors_1.ValidationError('Start date cannot be after end date', 'dateRange'));
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateDateRange = validateDateRange;
// Generic validation function
const validateObject = (data, schema) => {
    const errors = [];
    Object.entries(schema).forEach(([field, validator]) => {
        if (!validator(data[field])) {
            errors.push(new errors_1.ValidationError(`Invalid ${field}`, field));
        }
    });
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateObject = validateObject;
//# sourceMappingURL=validation.js.map