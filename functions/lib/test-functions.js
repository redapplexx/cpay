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
exports.listWalletsByUser = exports.getWalletBalance = exports.postTransaction = exports.createWallet = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// Create Wallet - Simplified test version
exports.createWallet = functions.https.onCall(async (data, context) => {
    try {
        const userId = data.userId;
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'userId is required');
        }
        const walletRef = db.collection('wallets').doc();
        await walletRef.set({
            userId: userId,
            balance: 0,
            currency: 'PHP',
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Update user with wallet ID
        await db.collection('users').doc(userId).update({
            walletId: walletRef.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return {
            success: true,
            message: 'Wallet created',
            walletId: walletRef.id
        };
    }
    catch (error) {
        console.error('createWallet error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create wallet');
    }
});
// Post Transaction - Simplified test version
exports.postTransaction = functions.https.onCall(async (data, context) => {
    try {
        const { fromWallet, toWallet, amount } = data;
        if (!fromWallet || !toWallet || !amount) {
            throw new functions.https.HttpsError('invalid-argument', 'fromWallet, toWallet, and amount are required');
        }
        if (amount <= 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Amount must be greater than 0');
        }
        const txRef = db.collection('transactions').doc();
        const fromRef = db.collection('wallets').doc(fromWallet);
        const toRef = db.collection('wallets').doc(toWallet);
        // Check if sender wallet exists and has sufficient balance
        const fromDoc = await fromRef.get();
        if (!fromDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Sender wallet not found');
        }
        if (fromDoc.data().balance < amount) {
            throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance');
        }
        // Process transaction atomically
        await db.runTransaction(async (t) => {
            // Debit from sender
            t.update(fromRef, {
                balance: fromDoc.data().balance - amount,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Credit to receiver
            const toDoc = await t.get(toRef);
            if (!toDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Receiver wallet not found');
            }
            t.update(toRef, {
                balance: (toDoc.data().balance || 0) + amount,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Create transaction record
            t.set(txRef, {
                fromWallet,
                toWallet,
                amount,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                type: 'transfer',
                status: 'completed'
            });
        });
        return {
            success: true,
            message: 'Transaction complete',
            transactionId: txRef.id
        };
    }
    catch (error) {
        console.error('postTransaction error:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to process transaction');
    }
});
// Get wallet balance
exports.getWalletBalance = functions.https.onCall(async (data, context) => {
    try {
        const { walletId } = data;
        if (!walletId) {
            throw new functions.https.HttpsError('invalid-argument', 'walletId is required');
        }
        const walletDoc = await db.collection('wallets').doc(walletId).get();
        if (!walletDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Wallet not found');
        }
        const walletData = walletDoc.data();
        return {
            success: true,
            data: {
                walletId,
                balance: walletData.balance,
                currency: walletData.currency,
                status: walletData.status
            }
        };
    }
    catch (error) {
        console.error('getWalletBalance error:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to get wallet balance');
    }
});
// List wallets by user
exports.listWalletsByUser = functions.https.onCall(async (data, context) => {
    try {
        const { userId } = data;
        if (!userId) {
            throw new functions.https.HttpsError('invalid-argument', 'userId is required');
        }
        const walletsSnapshot = await db.collection('wallets')
            .where('userId', '==', userId)
            .get();
        const wallets = walletsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        return {
            success: true,
            data: wallets
        };
    }
    catch (error) {
        console.error('listWalletsByUser error:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to list wallets');
    }
});
//# sourceMappingURL=test-functions.js.map