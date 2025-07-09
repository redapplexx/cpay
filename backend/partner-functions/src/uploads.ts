// backend/partner-functions/src/uploads.ts
import * as functions from 'firebase-functions';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

try { admin.initializeApp(); } catch (e) {}
const storage = getStorage();

// Helper to ensure the caller is an authenticated partner
const ensurePartnerAuth = (context: functions.https.CallableContext) => {
  if (!context.auth || !context.auth.token.partnerId) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }
  return { partnerId: context.auth.token.partnerId as string };
};

export const generateUploadUrl = functions.https.onCall(async (data, context) => {
    const { partnerId } = ensurePartnerAuth(context);
    const { fileName, fileType, uploadPath } = data;

    if (!fileName || !fileType || !uploadPath) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing file name, type, or upload path.');
    }

    // Sanitize fileName to prevent path traversal
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '');

    // Construct the full path in GCS, scoped to the partner's folder
    const fullPath = `partners/${partnerId}/${uploadPath}/${Date.now()}_${sanitizedFileName}`;

    const options = {
        version: 'v4' as 'v4',
        action: 'write' as 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: fileType,
    };

    try {
        const [signedUrl] = await storage.bucket().file(fullPath).getSignedUrl(options);
        
        return { 
            signedUrl,
            // Return the GCS path so the client can reference the uploaded file.
            fileMetadata: {
                fullPath: `gs://${storage.bucket().name}/${fullPath}`,
                bucket: storage.bucket().name,
                path: fullPath,
            }
        };
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw new functions.https.HttpsError('internal', 'Could not create upload URL.');
    }
});
