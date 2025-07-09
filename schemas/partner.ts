// /schemas/partner.ts
import type { Timestamp } from 'firebase-admin/firestore';

interface Partner {
    partnerId: string;
    partnerName: string;
    // REFINED: We store paths to secrets, not the secrets themselves.
    apiKeySecretManagerPath: string; // e.g., 'projects/cpay/secrets/partner-live-sk-xyz/versions/1'
    sha256SecretManagerPath: string; // e.g., 'projects/cpay/secrets/partner-sha-secret-xyz/versions/1'
    webhookURL: string;
    isActive: boolean;
    createdAt: Timestamp;
    // Denormalized data for quick access
    adminUsers: {
        [uid: string]: string; // e.g., { "abc123xyz": "john.doe@partner.com" }
    };
}
