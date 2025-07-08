import * as functions from 'firebase-functions';
import { UserService } from '../../services/userService';
import { KYCService } from '../../services/kycService';
import { AccessControlService } from '../../services/accessControlService';
import { formatErrorResponse, handleError } from '../../utils/errors';
import { KYCDocumentStatus } from '../../types';

// Upload KYC document
export const uploadKYCDocument = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'create', 'kyc_records');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const { userId, fileBuffer, fileName, docType } = data;
    
    // Convert base64 to buffer if needed
    const buffer = typeof fileBuffer === 'string' 
      ? Buffer.from(fileBuffer, 'base64') 
      : Buffer.from(fileBuffer);

    const document = await KYCService.uploadDocument(
      userId,
      buffer,
      fileName,
      docType,
      context.auth.uid
    );
    
    return {
      success: true,
      data: document
    };
  } catch (error) {
    console.error('uploadKYCDocument error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Verify KYC document
export const verifyKYCDocument = functions.https.onCall(async (data: { 
  documentId: string; 
  status: string; 
  rejectionReason?: string 
}, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'update', 'kyc_records');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    await KYCService.verifyDocument(
      data.documentId,
      data.status as KYCDocumentStatus,
      context.auth.uid,
      data.rejectionReason
    );
    
    return {
      success: true,
      message: 'Document verification status updated'
    };
  } catch (error) {
    console.error('verifyKYCDocument error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// Get KYC records by user
export const getKYCRecords = functions.https.onCall(async (data: { userId: string }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'kyc_records');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const records = await KYCService.getRecordsByUser(data.userId);
    
    return {
      success: true,
      data: records
    };
  } catch (error) {
    console.error('getKYCRecords error:', error);
    return formatErrorResponse(handleError(error));
  }
});

// List all KYC records (admin/compliance only)
export const listKYC = functions.https.onCall(async (data: { limit?: number }, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const user = await UserService.getUserById(context.auth.uid);
    const hasPermission = await AccessControlService.checkPermission(user.role, 'read', 'kyc_records');
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    const records = await KYCService.list(data.limit || 100);
    
    return {
      success: true,
      data: records
    };
  } catch (error) {
    console.error('listKYC error:', error);
    return formatErrorResponse(handleError(error));
  }
}); 