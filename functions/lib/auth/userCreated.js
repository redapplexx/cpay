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
exports.onUserCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    try {
        const { uid, email, phoneNumber } = user;
        // Default tenant ID (you can customize this based on your logic)
        const defaultTenantId = 'default';
        // Create user profile in Firestore
        const userProfile = {
            uid,
            tenantId: defaultTenantId,
            email: email || '',
            mobileNumber: phoneNumber || '',
            fullName: '',
            birthDate: '',
            placeOfBirth: '',
            homeAddress: '',
            nationality: '',
            role: 'user',
            kycStatus: 'pending',
            kycTier: 'basic',
            balance: {
                PHP: 0,
                KRW: 0,
                USD: 0
            },
            dailyLimit: 50000, // Default daily limit in PHP
            monthlyLimit: 500000, // Default monthly limit in PHP
            language: 'en',
            aiScore: 0,
            aiRecommendations: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active',
            lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
        };
        // Save to Firestore
        await db.collection('tenants').doc(defaultTenantId).collection('users').doc(uid).set(userProfile);
        // Set custom claims
        const customClaims = {
            role: 'user',
            tenantId: defaultTenantId,
            kycStatus: 'pending',
            kycTier: 'basic',
            status: 'active',
            dailyLimit: 50000,
            monthlyLimit: 500000
        };
        await admin.auth().setCustomUserClaims(uid, customClaims);
        // Log the user creation
        await db.collection('tenants').doc(defaultTenantId).collection('access_logs').add({
            userId: uid,
            tenantId: defaultTenantId,
            action: 'user_created',
            ipAddress: 'unknown',
            userAgent: 'firebase_auth',
            deviceFingerprint: 'unknown',
            success: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`User profile created for ${uid}`);
    }
    catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
});
//# sourceMappingURL=userCreated.js.map