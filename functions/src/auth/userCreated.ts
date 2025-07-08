import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { handleError } from '../utils/handleError';
import { User, Wallet } from '../types';

const db = admin.firestore();

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    const { uid, phoneNumber } = user;

    // Build user profile per final schema
    const userProfile: User = {
      userId: uid,
      mobileNumber: phoneNumber || '',
      fullName: '',
      dateOfBirth: admin.firestore.Timestamp.now(), // Placeholder, to be updated by KYC
      placeOfBirth: '',
      currentAddress: '',
      nationality: '',
      kycStatus: 'pending',
      termsAccepted: false,
      privacyPolicyAccepted: false,
      createdAt: admin.firestore.Timestamp.now(),
    };

    // Save user profile
    await db.collection('users').doc(uid).set(userProfile);

    // Initialize PHP wallet sub-collection
    const wallet: Wallet = {
      currency: 'PHP',
      balance: 0,
    };
    await db.collection('users').doc(uid).collection('wallets').doc('main').set(wallet);

    // Set custom claims (user role only)
    await admin.auth().setCustomUserClaims(uid, { role: 'user' });

    // Log user creation (structured)
    await db.collection('access_logs').add({
      userId: uid,
      action: 'user_created',
      success: true,
      timestamp: admin.firestore.Timestamp.now(),
    });

    console.log(`User profile and wallet created for ${uid}`);
  } catch (error) {
    handleError({
      functionName: 'onUserCreated',
      userId: user.uid,
      error,
      message: 'Error creating user profile',
    });
    throw error;
  }
}); 