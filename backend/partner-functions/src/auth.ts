// backend/partner-functions/src/auth.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
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
  }
});
