
// /partner-portal/src/lib/partner-api.ts
import { getFunctions, httpsCallable } from 'firebase/functions';
import { KYCFormData } from '@/schemas/kybForm';

const functions = getFunctions();

// A typed wrapper for the submitKybData Cloud Function
// NOTE: Firebase Functions codebase feature requires function names to be prefixed.
export const submitKybData = httpsCallable<
  { partnerId: string } & KYCFormData,
  { success: boolean; message: string }
>(functions, 'partner-submitKybData'); // This should match your deployed function name

// A typed wrapper for the getPartnerKybUploadUrl Cloud Function
export const getPartnerKybUploadUrl = httpsCallable<
  { fileName: string; fileType: string; uploadPath: string; },
  { signedUrl: string; finalPath: string }
>(functions, 'partner-generateUploadUrl'); // This should match your deployed function name
