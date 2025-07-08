import type { Timestamp } from 'firebase/firestore';

// Multi-tenant support
export interface Tenant {
  id: string;
  name: string;
  country: string;
  currency: string;
  language: 'en' | 'kr' | 'tl';
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  settings: TenantSettings;
}

export interface TenantSettings {
  fxMarkupPercent: number;
  minTransferAmount: number;
  maxTransferAmount: number;
  dailyLimit: number;
  monthlyLimit: number;
  kycRequired: boolean;
  aiAdvisorEnabled: boolean;
}

// Enhanced User Profile with KYC and multi-tenant support
export interface UserProfile {
  uid: string;
  tenantId: string;
  email: string;
  mobileNumber: string;
  fullName: string;
  birthDate: string;
  placeOfBirth: string;
  homeAddress: string;
  nationality: string;
  role: 'admin' | 'user' | 'agent';
  kycStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  kycTier: 'basic' | 'enhanced' | 'premium';
  balance: {
    PHP: number;
    KRW: number;
    USD: number;
  };
  dailyLimit: number;
  monthlyLimit: number;
  language: 'en' | 'kr' | 'tl';
  fcmToken?: string;
  aiScore: number;
  aiRecommendations: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: Timestamp;
  deviceFingerprint?: string;
  ipAddress?: string;
}

// KYC Workflow
export interface KYCDocument {
  id: string;
  userId: string;
  tenantId: string;
  documentType: 'passport' | 'national_id' | 'drivers_license' | 'selfie' | 'proof_of_address';
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface KYCSubmission {
  id: string;
  userId: string;
  tenantId: string;
  documents: KYCDocument[];
  status: 'pending' | 'approved' | 'rejected';
  adminReviewedBy?: string;
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  kycProvider: 'onfido' | 'sumsub' | 'manual';
  externalId?: string;
  verificationScore?: number;
}

export interface KYCLog {
  id: string;
  userId: string;
  tenantId: string;
  action: 'submitted' | 'approved' | 'rejected' | 'expired';
  timestamp: Timestamp;
  details: string;
  adminId?: string;
}

// Cash-In / Cash-Out System
export interface CashTransaction {
  id: string;
  tenantId: string;
  userId: string;
  type: 'cash_in' | 'cash_out';
  amount: number;
  currency: 'PHP' | 'KRW' | 'USD';
  method: 'gcash' | 'maya' | 'bank_transfer' | 'cash_pickup' | 'mobile_money';
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
  referenceNumber: string;
  externalReference?: string;
  fees: number;
  netAmount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  failureReason?: string;
  providerResponse?: any;
}

// P2P Fund Transfers
export interface P2PTransaction {
  id: string;
  tenantId: string;
  senderUid: string;
  recipientUid: string;
  amount: number;
  sourceCurrency: string;
  destinationCurrency: string;
  fxRate: number;
  fxMarkupPercent: number;
  fees: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  blockchainHash?: string;
  txConfirmed: boolean;
  timestamp: Timestamp;
  completedAt?: Timestamp;
  failureReason?: string;
  message?: string;
}

// Unified Transaction type
export interface Transaction {
  id: string;
  tenantId: string;
  type: 'p2p' | 'cash_in' | 'cash_out';
  senderUid?: string;
  recipientUid?: string;
  userId?: string; // for cash transactions
  amount: number;
  sourceCurrency: string;
  destinationCurrency: string;
  fxRate: number;
  fxMarkupPercent: number;
  fees: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  blockchainHash?: string;
  txConfirmed: boolean;
  referenceNumber: string;
  externalReference?: string;
  method?: string;
  timestamp: Timestamp;
  completedAt?: Timestamp;
  failureReason?: string;
  message?: string;
  providerResponse?: any;
}

// Blockchain Integration
export interface BlockchainTransaction {
  id: string;
  tenantId: string;
  transactionId: string;
  hash: string;
  blockNumber?: number;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: number;
  gasPrice?: number;
  timestamp: Timestamp;
  network: 'ethereum' | 'polygon' | 'binance_smart_chain';
}

// AI Integration
export interface AIQuery {
  id: string;
  userId: string;
  tenantId: string;
  message: string;
  response: string;
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude';
  tokensUsed: number;
  cost: number;
  timestamp: Timestamp;
  category: 'financial_advice' | 'fraud_detection' | 'general';
  riskScore?: number;
}

export interface AILog {
  id: string;
  userId: string;
  tenantId: string;
  timestamp: Timestamp;
  riskScore: number;
  insight: string;
  recommendation: string;
  category: 'transaction' | 'kyc' | 'behavior';
  confidence: number;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  tenantId: string;
  title: string;
  body: string;
  type: 'transaction' | 'kyc' | 'security' | 'promotional';
  data?: Record<string, any>;
  read: boolean;
  sentAt: Timestamp;
  readAt?: Timestamp;
  fcmSent: boolean;
  fcmSentAt?: Timestamp;
}

// FX Rates
export interface FXRate {
  id: string;
  date: string; // YYYY-MM-DD format
  rates: {
    PHP: number;
    KRW: number;
    USD: number;
  };
  source: 'manual' | 'api';
  updatedAt: Timestamp;
  updatedBy: string;
}

// Admin Settings
export interface AdminSettings {
  tenantId: string;
  fxMarkupPercent: number;
  minTransferAmount: number;
  maxTransferAmount: number;
  aiAdvisorEnabled: boolean;
  kycRequired: boolean;
  blockchainEnabled: boolean;
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  securitySettings: {
    require2FA: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
}

// Access Logs
export interface AccessLog {
  id: string;
  userId: string;
  tenantId: string;
  action: 'login' | 'logout' | 'transaction' | 'kyc_submission' | 'profile_update';
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  location?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  success: boolean;
  errorMessage?: string;
  timestamp: Timestamp;
}

// Device Fingerprinting
export interface DeviceFingerprint {
  id: string;
  userId: string;
  tenantId: string;
  fingerprint: string;
  deviceInfo: {
    userAgent: string;
    screenResolution: string;
    timezone: string;
    language: string;
    platform: string;
  };
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  isTrusted: boolean;
  riskScore: number;
}

// Export types for different formats
export interface ExportRequest {
  id: string;
  userId: string;
  tenantId: string;
  type: 'transactions' | 'kyc' | 'ai_logs';
  format: 'pdf' | 'csv' | 'json';
  dateRange: {
    start: Timestamp;
    end: Timestamp;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  errorMessage?: string;
}
