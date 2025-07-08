export interface User {
  userId: string; // Firebase Auth UID
  mobileNumber: string;
  fullName: string;
  dateOfBirth: FirebaseFirestore.Timestamp;
  placeOfBirth: string;
  currentAddress: string;
  nationality: string;
  kycStatus: 'pending' | 'verified';
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface Wallet {
  currency: 'PHP';
  balance: number;
}

export interface Transaction {
  transactionId: string;
  type: 'p2p' | 'cash-in' | 'cash-out' | 'bill-payment' | 'qr-payment';
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  currency: 'PHP';
  senderId: string;
  recipientId: string; // Can be a userId, billerId, or gateway identifier
  timestamp: FirebaseFirestore.Timestamp;
  description: string;
  referenceNumber?: string; // For external transactions (cash-in)
  otpVerified?: boolean;
}

export interface MassPayout {
  id: string;
  batchId: string;
  status: MassPayoutStatus;
  totalAmount: number;
  totalFee: number;
  currency: string;
  recipientCount: number;
  processedCount: number;
  failedCount: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface MassPayoutRecipient {
  id: string;
  massPayoutId: string;
  userId: string;
  walletId: string;
  amount: number;
  fee: number;
  status: MassPayoutRecipientStatus;
  transactionId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KYCDocument {
  id: string;
  userId: string;
  type: KYCDocumentType;
  status: KYCDocumentStatus;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  metadata?: Record<string, any>;
}

export interface AuditEvent {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  sessionId?: string;
}

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  payload: Record<string, any>;
  status: WebhookStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt?: Date;
  lastAttemptAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskScore {
  id: string;
  userId: string;
  score: number;
  factors: RiskFactor[];
  category: RiskCategory;
  calculatedAt: Date;
  expiresAt: Date;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  value: any;
  impact: number;
}

export interface LedgerEntry {
  id: string;
  walletId: string;
  transactionId: string;
  type: LedgerEntryType;
  amount: number;
  balance: number;
  description: string;
  reference: string;
  createdAt: Date;
}

// Enums
export enum UserRole {
  ADMIN = 'admin',
  MERCHANT = 'merchant',
  USER = 'user',
  COMPLIANCE = 'compliance',
  SUPPORT = 'support'
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  BLOCKED = 'blocked'
}

export enum KYCStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum WalletStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
  PENDING = 'pending'
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  PAYMENT = 'payment',
  REFUND = 'refund',
  FEE = 'fee',
  FX_CONVERSION = 'fx_conversion',
  MASS_PAYOUT = 'mass_payout'
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed'
}

export enum MassPayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum MassPayoutRecipientStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum KYCDocumentType {
  IDENTITY_CARD = 'identity_card',
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  UTILITY_BILL = 'utility_bill',
  BANK_STATEMENT = 'bank_statement',
  SELFIE = 'selfie',
  PROOF_OF_ADDRESS = 'proof_of_address'
}

export enum KYCDocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum WebhookEventType {
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_COMPLETED = 'transaction.completed',
  TRANSACTION_FAILED = 'transaction.failed',
  WALLET_CREATED = 'wallet.created',
  WALLET_UPDATED = 'wallet.updated',
  USER_KYC_APPROVED = 'user.kyc.approved',
  USER_KYC_REJECTED = 'user.kyc.rejected',
  MASS_PAYOUT_COMPLETED = 'mass_payout.completed'
}

export enum WebhookStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  RETRY = 'retry'
}

export enum RiskCategory {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum LedgerEntryType {
  CREDIT = 'credit',
  DEBIT = 'debit'
}

// API Request/Response Types
export interface CreateUserRequest {
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  role?: UserRole;
  metadata?: Record<string, any>;
}

export interface CreateWalletRequest {
  userId: string;
  currency: string;
  metadata?: Record<string, any>;
}

export interface CreateTransactionRequest {
  type: TransactionType;
  fromWalletId?: string;
  toWalletId?: string;
  fromUserId?: string;
  toUserId?: string;
  amount: number;
  currency: string;
  fee?: number;
  fxRate?: number;
  description?: string;
  reference?: string;
  externalReference?: string;
  metadata?: Record<string, any>;
}

export interface MassPayoutRequest {
  recipients: Array<{
    userId: string;
    amount: number;
    description?: string;
    metadata?: Record<string, any>;
  }>;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface WebhookConfig {
  id: string;
  userId: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Utility Types
export type WithId<T> = T & { id: string };
export type WithTimestamps<T> = T & { createdAt: Date; updatedAt: Date };
export type WithIdAndTimestamps<T> = T & { id: string; createdAt: Date; updatedAt: Date }; 