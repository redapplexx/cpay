"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttle = exports.debounce = exports.chunkArray = exports.validateUUID = exports.roundToDecimals = exports.calculatePercentage = exports.generateRandomString = exports.maskSensitiveData = exports.sanitizeObject = exports.retry = exports.sleep = exports.isExpired = exports.addHours = exports.addDays = exports.parseDate = exports.formatDate = exports.formatAmount = exports.validateCurrency = exports.validateAmount = exports.validatePhoneNumber = exports.validateEmail = exports.generateWebhookSignature = exports.calculateHash = exports.generateBatchId = exports.generateReference = exports.generateId = void 0;
const uuid_1 = require("uuid");
const crypto = __importStar(require("crypto"));
const generateId = () => {
    return (0, uuid_1.v4)();
};
exports.generateId = generateId;
const generateReference = (prefix = 'TXN') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`.toUpperCase();
};
exports.generateReference = generateReference;
const generateBatchId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `BATCH-${timestamp}-${random}`.toUpperCase();
};
exports.generateBatchId = generateBatchId;
const calculateHash = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};
exports.calculateHash = calculateHash;
const generateWebhookSignature = (payload, secret) => {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};
exports.generateWebhookSignature = generateWebhookSignature;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
};
exports.validatePhoneNumber = validatePhoneNumber;
const validateAmount = (amount) => {
    return amount > 0 && Number.isFinite(amount);
};
exports.validateAmount = validateAmount;
const validateCurrency = (currency) => {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'SGD', 'MYR', 'THB', 'IDR', 'PHP', 'VND'];
    return validCurrencies.includes(currency.toUpperCase());
};
exports.validateCurrency = validateCurrency;
const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};
exports.formatAmount = formatAmount;
const formatDate = (date) => {
    return date.toISOString();
};
exports.formatDate = formatDate;
const parseDate = (dateString) => {
    return new Date(dateString);
};
exports.parseDate = parseDate;
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
exports.addDays = addDays;
const addHours = (date, hours) => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
};
exports.addHours = addHours;
const isExpired = (date) => {
    return new Date() > date;
};
exports.isExpired = isExpired;
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.sleep = sleep;
const retry = async (fn, maxAttempts = 3, delay = 1000) => {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxAttempts) {
                throw lastError;
            }
            await (0, exports.sleep)(delay * attempt);
        }
    }
    throw lastError;
};
exports.retry = retry;
const sanitizeObject = (obj) => {
    const sanitized = Object.assign({}, obj);
    Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === undefined || sanitized[key] === null) {
            delete sanitized[key];
        }
    });
    return sanitized;
};
exports.sanitizeObject = sanitizeObject;
const maskSensitiveData = (data, type) => {
    switch (type) {
        case 'email':
            const [local, domain] = data.split('@');
            return `${local.charAt(0)}***@${domain}`;
        case 'phone':
            return data.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
        case 'card':
            return data.replace(/(\d{4})\d{8}(\d{4})/, '$1********$2');
        default:
            return data;
    }
};
exports.maskSensitiveData = maskSensitiveData;
const generateRandomString = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};
exports.generateRandomString = generateRandomString;
const calculatePercentage = (value, total) => {
    return total > 0 ? (value / total) * 100 : 0;
};
exports.calculatePercentage = calculatePercentage;
const roundToDecimals = (value, decimals = 2) => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};
exports.roundToDecimals = roundToDecimals;
const validateUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
exports.validateUUID = validateUUID;
const chunkArray = (array, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
};
exports.chunkArray = chunkArray;
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
exports.debounce = debounce;
const throttle = (func, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};
exports.throttle = throttle;
//# sourceMappingURL=index.js.map