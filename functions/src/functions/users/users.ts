import * as functions from 'firebase-functions';
import { UserService } from '../../services/userService';
import { AccessControlService } from '../../services/accessControlService';
import { formatErrorResponse, handleError } from '../../utils/errors';
import { z } from 'zod';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Zod schema for KYC data
const basicKycSchema = z.object({
  fullName: z.string().min(1),
  dateOfBirth: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
  placeOfBirth: z.string().min(1),
  currentAddress: z.string().min(1),
  nationality: z.string().min(1),
  termsAccepted: z.boolean().refine(val => val === true, { message: 'Terms must be accepted' }),
  privacyPolicyAccepted: z.boolean().refine(val => val === true, { message: 'Privacy policy must be accepted' }),
});

const setAdminRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.string().min(1),
});

const adminSearchUsersSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(50).default(10),
});

const adminGetTransactionDetailsSchema = z.object({
  transactionId: z.string().min(1),
});

// Create user
export const createUser = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'create', 'users');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const newUser = await UserService.createUser(data, context.auth.uid);
    
    return {
      success: true,
      data: newUser
    };
  } catch (error) {
    console.error('createUser error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Get user by ID
export const getUser = functions.https.onCall(async (data: { userId: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'users');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const targetUser = await UserService.getUserById(data.userId);
    
    return {
      success: true,
      data: targetUser
    };
  } catch (error) {
    console.error('getUser error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Update user
export const updateUser = functions.https.onCall(async (data: { userId: string; updates: any }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'update', 'users');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const updatedUser = await UserService.updateUser(data.userId, data.updates, context.auth.uid);
    
    return {
      success: true,
      data: updatedUser
    };
  } catch (error) {
    console.error('updateUser error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// List users
export const listUsers = functions.https.onCall(async (data: { filters?: any; limit?: number }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'users');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const result = await UserService.listUsers(data.filters || {});
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('listUsers error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Update user role (admin only)
export const updateUserRole = functions.https.onCall(async (data: { userId: string; role: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'update', 'users');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const updatedUser = await UserService.updateUserRole(data.userId, data.role as any, context.auth.uid);
    
    return {
      success: true,
      data: updatedUser
    };
  } catch (error) {
    console.error('updateUserRole error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Update KYC status
export const updateKYCStatus = functions.https.onCall(async (data: { userId: string; kycStatus: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'update', 'users');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const updatedUser = await UserService.updateKYCStatus(data.userId, data.kycStatus as any, context.auth.uid);
    
    return {
      success: true,
      data: updatedUser
    };
  } catch (error) {
    console.error('updateKYCStatus error:', error);
    return formatErrorResponse(handleError(error));
  }
});

export const completeBasicKyc = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const userId = context.auth.uid;
    const parseResult = basicKycSchema.safeParse(data);
    if (!parseResult.success) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parseResult.error.flatten());
    }
    const {
      fullName,
      dateOfBirth,
      placeOfBirth,
      currentAddress,
      nationality,
      termsAccepted,
      privacyPolicyAccepted,
    } = parseResult.data;

    // Update user profile in Firestore
    await db.collection('users').doc(userId).update({
      fullName,
      dateOfBirth: admin.firestore.Timestamp.fromDate(new Date(dateOfBirth)),
      placeOfBirth,
      currentAddress,
      nationality,
      termsAccepted,
      privacyPolicyAccepted,
      kycStatus: 'verified',
    });

    return { success: true };
  } catch (error) {
    handleError({
      functionName: 'completeBasicKyc',
      userId: context?.auth?.uid,
      error,
      message: 'Failed to complete basic KYC',
    });
    throw new functions.https.HttpsError('internal', 'Failed to complete basic KYC');
  }
});

export const setAdminRole = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    // Check if caller is super-admin
    const caller = await admin.auth().getUser(context.auth.uid);
    if (!caller.customClaims || caller.customClaims.role !== 'super-admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only super-admins can set admin roles');
    }
    const parseResult = setAdminRoleSchema.safeParse(data);
    if (!parseResult.success) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parseResult.error.flatten());
    }
    const { userId, role } = parseResult.data;
    await admin.auth().setCustomUserClaims(userId, { role });
    return { success: true };
  } catch (error) {
    handleError({
      functionName: 'setAdminRole',
      userId: context?.auth?.uid,
      error,
      message: 'Failed to set admin role',
    });
    throw new functions.https.HttpsError('internal', 'Failed to set admin role');
  }
});

export const adminSearchUsers = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    // Check if caller is admin
    const caller = await admin.auth().getUser(context.auth.uid);
    if (!caller.customClaims || (caller.customClaims.role !== 'admin' && caller.customClaims.role !== 'super-admin')) {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can search users');
    }
    const parseResult = adminSearchUsersSchema.safeParse(data);
    if (!parseResult.success) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parseResult.error.flatten());
    }
    const { query, limit } = parseResult.data;
    // Search by fullName or mobileNumber
    const snap = await db.collection('users')
      .where('fullName', '>=', query)
      .where('fullName', '<=', query + '\uf8ff')
      .limit(limit)
      .get();
    const users = snap.docs.map(doc => doc.data());
    return { success: true, users };
  } catch (error) {
    handleError({
      functionName: 'adminSearchUsers',
      userId: context?.auth?.uid,
      error,
      message: 'Failed to search users',
    });
    throw new functions.https.HttpsError('internal', 'Failed to search users');
  }
});

export const adminGetTransactionDetails = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    // Check if caller is admin
    const caller = await admin.auth().getUser(context.auth.uid);
    if (!caller.customClaims || (caller.customClaims.role !== 'admin' && caller.customClaims.role !== 'super-admin')) {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can get transaction details');
    }
    const parseResult = adminGetTransactionDetailsSchema.safeParse(data);
    if (!parseResult.success) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parseResult.error.flatten());
    }
    const { transactionId } = parseResult.data;
    const txDoc = await db.collection('transactions').doc(transactionId).get();
    if (!txDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Transaction not found');
    }
    return { success: true, transaction: txDoc.data() };
  } catch (error) {
    handleError({
      functionName: 'adminGetTransactionDetails',
      userId: context?.auth?.uid,
      error,
      message: 'Failed to get transaction details',
    });
    throw new functions.https.HttpsError('internal', 'Failed to get transaction details');
  }
}); 