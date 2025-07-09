// backend/functions/src/admin/userManagement.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin if not already done
try {
  admin.initializeApp();
} catch (e) {
  // Ignore error if already initialized
}

const db = admin.firestore();

/**
 * Checks if the caller is an admin. Throws an error if not.
 * @param {functions.https.CallableContext} context - The context of the callable function.
 */
const ensureAdmin = async (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to perform this action.');
  }
  const user = await admin.auth().getUser(context.auth.uid);
  if (user.customClaims?.role !== 'ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'You must be an administrator to perform this action.');
  }
};

/**
 * Cloud Function to list all users (both from Auth and Firestore for combined data).
 */
export const adminListUsers = functions.https.onCall(async (data, context) => {
  await ensureAdmin(context);

  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    const firestoreUsers = await db.collection('users').get();
    const firestoreDataMap = new Map(firestoreUsers.docs.map(doc => [doc.id, doc.data()]));
    
    const combinedUsers = listUsersResult.users.map(user => {
        const firestoreUser = firestoreDataMap.get(user.uid);
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            disabled: user.disabled,
            customClaims: user.customClaims,
            profile: firestoreUser?.profile || {},
        };
    });

    return combinedUsers;
  } catch (error: any) {
    console.error('Error listing users:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while fetching users.', error.message);
  }
});

/**
 * Cloud Function to set a custom user role (e.g., ADMIN).
 */
export const adminSetUserRole = functions.https.onCall(async (data: { uid: string, role: string }, context) => {
  await ensureAdmin(context);

  const { uid, role } = data;
  if (!uid || (role !== 'ADMIN' && role !== 'USER')) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid UID or role provided.');
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    return { status: 'success', message: `User ${uid} has been made an ${role}.` };
  } catch (error: any) {
    console.error('Error setting user role:', error);
    throw new functions.https.HttpsError('internal', 'Failed to set user role.', error.message);
  }
});
