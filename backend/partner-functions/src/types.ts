// backend/partner-functions/src/types.ts

import * as admin from 'firebase-admin';

// Interface for the 'partners' collection
export interface Partner {
  partnerId: string; // Unique ID for the partner (e.g., 'winny')
  name: string;      // Partner's registered name
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED';
  apiCredentials: {
    test: {
      merchantId: string;
      sha256Key: string; // Hashed or securely stored
      // Other test API keys/secrets
    };
    production: {
      merchantId: string;
      sha256Key: string; // Hashed or securely stored
      // Other prod API keys/secrets
    };
    lastTestKeyGeneratedAt?: admin.firestore.Timestamp;
    lastProdKeyGeneratedAt?: admin.firestore.Timestamp;
  };
  webhookConfig: {
    sandboxUrl?: string;
    liveUrl?: string;
    secret?: string; // Webhook signing secret
  };
  environment: 'SANDBOX' | 'LIVE'; // Current environment for API calls via the portal
  // References to API docs and Postman collections (e.g., GCS URLs)
  apiDocsUrl?: string;
  postmanCollectionUrl?: string;
  createdAt: admin.firestore.Timestamp;
  approvedAt?: admin.firestore.Timestamp;
}

// Interface for the 'partner_users' sub-collection within a partner document
// Path: partners/{partnerId}/users/{userId}
export interface PartnerUser {
  uid: string; // Firebase Auth UID of the partner user
  partnerId: string; // The partner this user belongs to
  role: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER'; // Role within the partner account
  addedAt: admin.firestore.Timestamp;
}

// --- Additional types for payout operations (placeholders for now) ---
export interface PayoutBatch {
  batchId: string;
  partnerId: string;
  uploadedByUid: string;
  fileName: string;
  status: 'UPLOADED' | 'VALIDATING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalPayouts: number;
  totalAmount: number;
  currency: string;
  createdAt: admin.firestore.Timestamp;
  processedAt?: admin.firestore.Timestamp;
}

export interface PayoutLog {
  logId: string;
  batchId: string;
  partnerId: string;
  payoutId: string; // Unique ID for each individual payout in the batch
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
  channel: string; // e.g., 'instapay', 'gcash', 'bdo'
  amount: number;
  currency: string;
  requestPayload: any; // Raw request sent to channel
  responsePayload: any; // Raw response from channel
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

// --- Additional types for webhook logs (placeholders for now) ---
export interface WebhookLog {
  logId: string;
  partnerId: string;
  eventType: string; // e.g., 'payout.completed', 'kyc.approved'
  endpointUrl: string;
  requestHeaders: any;
  requestPayload: any;
  responseStatusCode?: number;
  responseBody?: any;
  deliveryStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | 'RETRYING';
  attempts: number;
  lastAttemptAt: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
}

// --- Additional types for Audit Logs ---
export interface AuditLog {
  logId: string;
  partnerId?: string; // Optional for global admin actions
  userId: string; // UID of the user who performed the action
  userEmail?: string; // Email for readability
  action: string; // e.g., 'LOGIN', 'REGENERATE_API_KEY', 'UPLOAD_PAYOUT_BATCH', 'APPROVE_KYC'
  timestamp: admin.firestore.Timestamp;
  ipAddress?: string;
  details?: any; // Additional context about the action
}
