// backend/partner-functions/src/auth.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
<<<<<<< HEAD
import type { PartnerUser } from './types';

try { admin.initializeApp(); } catch (e) { /* App already initialized */ }
const db = admin.firestore();

// NOTE: In a real-world scenario, the ability to register a user for a partner
// would be restricted to existing 'OWNER' or 'ADMIN' roles of that partner.
// This function is the first step in that chain.
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  partnerId: z.string(), // The partner this user belongs to
  role: z.enum(['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']),
});

export const registerPartnerUser = functions.https.onCall(async (data, context) => {
  // TODO: Add security check to ensure 'context.auth.uid' is an admin of the specified partnerId.
  // For now, we allow it for initial setup.
  
  const validation = registerSchema.safeParse(data);
  if (!validation.success) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid data provided.', validation.error.format());
  }

  const { email, password, partnerId, role } = validation.data;

  try {
    // 1. Create the Firebase Auth user
    const userRecord = await admin.auth().createUser({ email, password });
    const uid = userRecord.uid;

    // 2. Set custom claims for security rules. This is CRITICAL for scoping access.
    await admin.auth().setCustomUserClaims(uid, { partnerId, role });

    // 3. Create the user's document in the partner's sub-collection
    const userRef = db.collection('partners').doc(partnerId).collection('users').doc(uid);
    const partnerUser: PartnerUser = {
      uid,
      partnerId,
      email,
      role,
      addedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    };
    await userRef.set(partnerUser);

    return {
      status: 'success',
      message: `User ${email} created and assigned to partner ${partnerId}.`,
      uid: uid,
    };
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'This email address is already in use.');
    }
    console.error("Error registering partner user:", error);
    throw new functions.https.HttpsError('internal', 'An internal error occurred while creating the user.');
=======
import { PartnerUser } from './types';

// Initialize admin if not already done
try {
  admin.initializeApp();
} catch (e) {
  // Ignore error if already initialized
}

const db = admin.firestore();

const registerPartnerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6), // Firebase Auth minimum password length
  partnerId: z.string().min(1), // The ID of the partner they are joining
  role: z.enum(['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER']).default('VIEWER'),
});

/**
 * Callable Cloud Function to register a new partner user.
 * This function should ideally only be called by an existing partner admin or the core CPay admin.
 * For now, we'll allow any authenticated user to create a partner_user entry if they know the partnerId.
 * In a real system, partner user creation would be tightly controlled (e.g., invite system).
 */
export const registerPartnerUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required to register a partner user.');
  }

  const { email, password, partnerId, role } = registerPartnerUserSchema.parse(data);

  try {
    // 1. Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

    const uid = userRecord.uid;

    // 2. Set custom claims on Auth user for partnerId and role for security rules
    await admin.auth().setCustomUserClaims(uid, { partnerId, role });

    // 3. Create partner_user document in Firestore
    const partnerUserRef = db.collection('partners').doc(partnerId).collection('users').doc(uid);
    const newPartnerUser: PartnerUser = {
      uid: uid,
      partnerId: partnerId,
      role: role,
      addedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    };
    await partnerUserRef.set(newPartnerUser);

    // 4. Create a basic user profile in the main 'users' collection for general system access
    // This links the partner user back to the main CPay user system for broader context if needed.
    await db.collection('users').doc(uid).set({
        email: email,
        partnerId: partnerId, // Link to partner
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        // Add other default user fields if necessary
        profile: { kycStatus: 'Unverified', isMerchant: false },
        customClaims: { partnerId: partnerId, role: role } // Duplicate for easy access
    }, { merge: true });

    return { status: 'success', message: 'Partner user registered successfully.', uid: uid };
  } catch (error: any) {
    console.error('Error registering partner user:', error);
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'The email address is already in use by another account.');
    }
    throw new functions.https.HttpsError('internal', 'Failed to register partner user.', error.message);
  }
});

const loginPartnerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * Callable Cloud Function to log in a partner user and ensure custom claims are set.
 * This function primarily serves to confirm the user's role and partnerId after they authenticate
 * client-side (e.g., via signInWithEmailAndPassword).
 * It can be used to re-issue custom claims if they were lost or to refresh the token.
 */
export const loginPartnerUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required to log in.');
  }

  const { email, password } = loginPartnerUserSchema.parse(data);
  const uid = context.auth.uid; // The user should already be authenticated via Firebase Auth client SDK

  try {
    // Verify user's partner status from Firestore
    const partnerUsersSnapshot = await db.collectionGroup('users').where('uid', '==', uid).get();

    if (partnerUsersSnapshot.empty) {
      throw new functions.https.HttpsError('unauthenticated', 'No partner association found for this user.');
    }
    
    // Assuming a user can only belong to one partner for now in this context
    const partnerUserData = partnerUsersSnapshot.docs[0].data() as PartnerUser;
    const partnerId = partnerUserData.partnerId;
    const role = partnerUserData.role;

    // Re-set custom claims on Auth user token
    await admin.auth().setCustomUserClaims(uid, { partnerId, role });
    
    // Generate a new ID token with updated claims to be sent back to client
    const idToken = await admin.auth().createCustomToken(uid, { partnerId, role });

    return { status: 'success', message: 'Logged in to partner portal.', token: idToken, partnerId: partnerId, role: role };
  } catch (error: any) {
    console.error('Error logging in partner user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to log in to partner portal.', error.message);
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
  }
});
