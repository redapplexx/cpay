// backend/partner-functions/src/types.ts
import type { Timestamp } from 'firebase-admin/firestore';

/**
 * Defines the main document for a partner organization.
 * Stored in the `partners` collection.
 */
export interface Partner {
  partnerId: string; // The unique ID for the partner, e.g., 'winny'
  name: string;      // The partner's legal name
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED';
  apiCredentials: {
    test: {
      merchantId: string;
      sha256Key: string;
      lastGeneratedAt?: Timestamp;
    };
    production: {
      merchantId: string;
      sha256Key: string;
       lastGeneratedAt?: Timestamp;
    };
  };
  webhookConfig?: {
    sandboxUrl?: string;
    liveUrl?: string;
    secret?: string;
  };
  environment: 'SANDBOX' | 'LIVE';
  apiDocsUrl?: string;
  postmanCollectionUrl?: string;
  createdAt: Timestamp;
  approvedAt?: Timestamp;
}

/**
 * Defines a user associated with a partner.
 * Stored in the `partners/{partnerId}/users` sub-collection.
 */
export interface PartnerUser {
  uid: string;       // Firebase Auth UID
  partnerId: string;
  email: string;     // For easy reference
  role: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'MAKER' | 'APPROVER';
  addedAt: Timestamp;
}

/**
 * Defines an audit log entry for partner actions.
 * Stored in the `partners/{partnerId}/auditLogs` sub-collection.
 */
export interface AuditLog {
  logId: string;
  timestamp: Timestamp;
  userId: string;    // UID of the user who performed the action
  userEmail: string;
  ipAddress?: string;
  action: string;    // e.g., 'REGENERATE_API_KEY', 'UPLOAD_PAYOUT_BATCH'
  details: Record<string, any>; // Contextual details of the action
}

/**
 * Defines a batch of payouts uploaded by a partner.
 * Stored in `partners/{partnerId}/payoutBatches`.
 */
export interface PayoutBatch {
    batchId: string;
    partnerId: string;
    uploadedByUid: string;
    fileName: string;
    gcsFilePath: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    totalPayouts: number;
    totalAmount: number;
    currency: string;
    createdAt: Timestamp;
    completedAt?: Timestamp;
}

/**
 * Defines a single payout log entry within a batch.
 * Stored in `partners/{partnerId}/payoutLogs`.
 */
export interface PayoutLog {
    logId: string;
    batchId: string;
    partnerId: string;
    payoutId: string; // Partner's internal reference ID for this specific payout
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    channel: string;
    amount: number;
    currency: string;
    requestPayload: any;
    responsePayload: any;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    failureReason?: string;
}

/**
 * Defines a webhook log entry.
 * Stored in `partners/{partnerId}/webhookLogs`.
 */
export interface WebhookLog {
  logId: string;
  partnerId: string;
  eventType: string; // e.g., 'payout.success', 'payout.failed'
  endpointUrl: string;
  deliveryStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  requestPayload: any;
  responseStatusCode?: number;
  responseBody?: string;
  createdAt: Timestamp;
  lastAttemptAt: Timestamp;
  attempts: number;
}
