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
exports.onUserDeleted = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const storage = admin.storage();
exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
    try {
        const { uid } = user;
        // Get user data to find tenant
        const userSnapshot = await db.collectionGroup('users').where('uid', '==', uid).get();
        if (userSnapshot.empty) {
            console.log(`No user profile found for ${uid}`);
            return;
        }
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        const tenantId = userData.tenantId;
        // Delete user profile
        await userDoc.ref.delete();
        // Delete KYC documents from Storage
        try {
            const kycFiles = await storage.bucket().getFiles({
                prefix: `kyc_docs/${uid}/`
            });
            for (const file of kycFiles[0]) {
                await file.delete();
            }
        }
        catch (error) {
            console.log('No KYC files to delete or error deleting files:', error);
        }
        // Delete KYC submissions
        const kycSubmissions = await db.collection('tenants').doc(tenantId).collection('kyc_submissions')
            .where('userId', '==', uid).get();
        for (const doc of kycSubmissions.docs) {
            await doc.ref.delete();
        }
        // Delete KYC documents
        const kycDocuments = await db.collection('tenants').doc(tenantId).collection('kyc_documents')
            .where('userId', '==', uid).get();
        for (const doc of kycDocuments.docs) {
            await doc.ref.delete();
        }
        // Delete KYC logs
        const kycLogs = await db.collection('tenants').doc(tenantId).collection('kyc_logs')
            .where('userId', '==', uid).get();
        for (const doc of kycLogs.docs) {
            await doc.ref.delete();
        }
        // Delete AI queries
        const aiQueries = await db.collection('tenants').doc(tenantId).collection('ai_queries')
            .where('userId', '==', uid).get();
        for (const doc of aiQueries.docs) {
            await doc.ref.delete();
        }
        // Delete AI logs
        const aiLogs = await db.collection('tenants').doc(tenantId).collection('ai_logs')
            .where('userId', '==', uid).get();
        for (const doc of aiLogs.docs) {
            await doc.ref.delete();
        }
        // Delete notifications
        const notifications = await db.collection('tenants').doc(tenantId).collection('notifications')
            .where('userId', '==', uid).get();
        for (const doc of notifications.docs) {
            await doc.ref.delete();
        }
        // Delete device fingerprints
        const deviceFingerprints = await db.collection('tenants').doc(tenantId).collection('device_fingerprints')
            .where('userId', '==', uid).get();
        for (const doc of deviceFingerprints.docs) {
            await doc.ref.delete();
        }
        // Delete export requests
        const exportRequests = await db.collection('tenants').doc(tenantId).collection('export_requests')
            .where('userId', '==', uid).get();
        for (const doc of exportRequests.docs) {
            await doc.ref.delete();
        }
        // Delete user transaction history
        const userHistory = await db.collection('tenants').doc(tenantId).collection('users').doc(uid)
            .collection('history').get();
        for (const doc of userHistory.docs) {
            await doc.ref.delete();
        }
        // Log the user deletion
        await db.collection('tenants').doc(tenantId).collection('access_logs').add({
            userId: uid,
            tenantId,
            action: 'user_deleted',
            ipAddress: 'unknown',
            userAgent: 'firebase_auth',
            deviceFingerprint: 'unknown',
            success: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`User data cleaned up for ${uid}`);
    }
    catch (error) {
        console.error('Error cleaning up user data:', error);
        throw error;
    }
});
//# sourceMappingURL=userDeleted.js.map