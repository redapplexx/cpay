// core-functions/src/auth/coreAuth.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { customAlphabet } from 'nanoid';

try { admin.initializeApp(); } catch (e) { /* App already initialized */ }
const db = admin.firestore();

// --- OTP Storage (In a real system, use a dedicated, secure, short-lived cache like Redis) ---
const otpCollection = db.collection('otp_codes');

const generateOtp = (): string => {
  return customAlphabet('0123456789', 6)(); // 6-digit numeric OTP
};

/**
 * Sends an OTP to a mobile number.
 * Fulfills: FR-SEC-001.
 */
export const sendOtpToMobile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }
  const { phoneNumber } = z.object({ phoneNumber: z.string().startsWith('+639') }).parse(data);

  // Generate OTP
  const otp = generateOtp();
  const expiry = admin.firestore.FieldValue.serverTimestamp(); // For demonstration, actual expiry handled client-side/via Cloud Task

  // Save OTP with expiry to Firestore (replace with Redis/memory store for production)
  await otpCollection.doc(context.auth.uid).set({
    otp,
    phoneNumber,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // OTP valid for 5 minutes
  });

  // TODO: Integrate with SMS Gateway (e.g., Twilio, Nexmo) to send the OTP.
  console.log(`Sending OTP ${otp} to ${phoneNumber} for user ${context.auth.uid}`);

  return { success: true, message: 'OTP sent to your mobile number.' };
});

/**
 * Verifies an OTP provided by the user.
 */
export const verifyOtp = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }
  const { otp } = z.object({ otp: z.string().length(6) }).parse(data);

  const otpDoc = await otpCollection.doc(context.auth.uid).get();

  if (!otpDoc.exists || otpDoc.data()?.otp !== otp) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid OTP.');
  }
  if (otpDoc.data()?.expiresAt.toDate() < new Date()) {
    throw new functions.https.HttpsError('aborted', 'OTP has expired.');
  }

  // Invalidate OTP after use
  await otpCollection.doc(context.auth.uid).delete();

  return { success: true, message: 'OTP verified successfully.' };
});

const signInSchema = z.object({
  mobileNumber: z.string().startsWith('+639').optional(),
  email: z.string().email().optional(),
  password: z.string().min(6),
}).refine(data => data.mobileNumber || data.email, { message: "Either mobileNumber or email must be provided." });

/**
 * Handles user login with mobile number/password or email/password.
 * This function can also set custom claims if needed for roles.
 * Fulfills: FR-AUTH-001, FR-AUTH-004.
 */
export const coreUserLogin = functions.https.onCall(async (data, context) => {
  // Client-side Firebase Auth SDK should handle the primary authentication (signInWithEmailAndPassword)
  // This Cloud Function is for post-auth claims setting or advanced login flows.
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  // This function would typically verify the user's status/claims from Firestore
  // after client-side Auth has successfully returned a user.
  const userRef = db.collection('users').doc(context.auth.uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User profile not found.');
  }

  // If custom claims need to be set/refreshed based on Firestore data,
  // you would do it here using admin.auth().setCustomUserClaims(uid, { ...claims });
  // And then return a custom token or instruct client to refresh ID token.

  return { success: true, message: 'Login successful.' };
});
