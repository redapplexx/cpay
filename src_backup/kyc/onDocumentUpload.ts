import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sharp from 'sharp';

const db = admin.firestore();
const storage = admin.storage();

interface KYCDocumentData {
  userId: string;
  tenantId: string;
  documentType: 'passport' | 'national_id' | 'drivers_license' | 'selfie' | 'proof_of_address';
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export const onKYCDocumentUploaded = functions.storage
  .object()
  .onFinalize(async (object) => {
    try {
      const filePath = object.name;
      const bucket = object.bucket;

      // Only process KYC documents
      if (!filePath?.startsWith('kyc_docs/')) {
        return;
      }

      console.log(`Processing KYC document upload: ${filePath}`);

      // Parse file path to extract user ID and document info
      const pathParts = filePath.split('/');
      if (pathParts.length < 3) {
        console.error('Invalid KYC document path:', filePath);
        return;
      }

      const userId = pathParts[1];
      const fileName = pathParts[pathParts.length - 1];
      const documentType = extractDocumentType(fileName);

      // Get user data to find tenant
      const userSnapshot = await db.collectionGroup('users').where('uid', '==', userId).get();
      if (userSnapshot.empty) {
        console.error(`User ${userId} not found`);
        return;
      }

      const userData = userSnapshot.docs[0].data();
      const tenantId = userData.tenantId;

      // Get file metadata
      const file = storage.bucket(bucket).file(filePath);
      const [metadata] = await file.getMetadata();

      // Process image if it's an image file
      let processedFileUrl = object.mediaLink;
      if (isImageFile(metadata.contentType)) {
        processedFileUrl = await processImage(file, bucket, filePath);
      }

      // Create KYC document record
      const kycDocument = {
        id: `${userId}_${documentType}_${Date.now()}`,
        userId,
        tenantId,
        documentType,
        fileUrl: processedFileUrl,
        fileName,
        fileSize: parseInt(metadata.size),
        mimeType: metadata.contentType,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
      };

      await db.collection('tenants').doc(tenantId).collection('kyc_documents')
        .doc(kycDocument.id).set(kycDocument);

      // Check if user has a pending KYC submission
      const existingSubmission = await db.collection('tenants').doc(tenantId).collection('kyc_submissions')
        .where('userId', '==', userId)
        .where('status', '==', 'pending')
        .limit(1)
        .get();

      if (existingSubmission.empty) {
        // Create new KYC submission
        const kycSubmission = {
          id: `${userId}_submission_${Date.now()}`,
          userId,
          tenantId,
          documents: [kycDocument],
          status: 'pending',
          submittedAt: admin.firestore.FieldValue.serverTimestamp(),
          kycProvider: 'manual'
        };

        await db.collection('tenants').doc(tenantId).collection('kyc_submissions')
          .doc(kycSubmission.id).set(kycSubmission);

        // Log KYC submission
        await db.collection('tenants').doc(tenantId).collection('kyc_logs').add({
          userId,
          tenantId,
          action: 'submitted',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          details: `KYC submission created with ${documentType} document`,
          adminId: 'system'
        });

        console.log(`Created new KYC submission for user ${userId}`);
      } else {
        // Add document to existing submission
        const submissionDoc = existingSubmission.docs[0];
        const submissionData = submissionDoc.data();
        
        // Check if document type already exists
        const existingDoc = submissionData.documents.find((doc: any) => doc.documentType === documentType);
        if (existingDoc) {
          // Replace existing document
          const updatedDocuments = submissionData.documents.map((doc: any) => 
            doc.documentType === documentType ? kycDocument : doc
          );
          
          await submissionDoc.ref.update({
            documents: updatedDocuments,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Add new document
          await submissionDoc.ref.update({
            documents: admin.firestore.FieldValue.arrayUnion(kycDocument),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        console.log(`Added ${documentType} document to existing KYC submission for user ${userId}`);
      }

      // Send notification to user
      const notificationData = {
        userId,
        tenantId,
        title: 'KYC Document Uploaded',
        body: `Your ${documentType.replace('_', ' ')} document has been uploaded successfully.`,
        type: 'kyc',
        data: {
          documentType,
          fileName
        },
        read: false,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        fcmSent: false
      };

      await db.collection('tenants').doc(tenantId).collection('notifications').add(notificationData);

      console.log(`KYC document ${fileName} processed successfully for user ${userId}`);

    } catch (error) {
      console.error('Error processing KYC document upload:', error);
      throw error;
    }
  });

function extractDocumentType(fileName: string): string {
  const lowerFileName = fileName.toLowerCase();
  
  if (lowerFileName.includes('passport')) return 'passport';
  if (lowerFileName.includes('national') || lowerFileName.includes('id')) return 'national_id';
  if (lowerFileName.includes('driver') || lowerFileName.includes('license')) return 'drivers_license';
  if (lowerFileName.includes('selfie') || lowerFileName.includes('photo')) return 'selfie';
  if (lowerFileName.includes('address') || lowerFileName.includes('utility')) return 'proof_of_address';
  
  // Default to selfie if can't determine
  return 'selfie';
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

async function processImage(file: any, bucket: string, filePath: string): Promise<string> {
  try {
    // Download the file
    const [fileBuffer] = await file.download();

    // Process image with Sharp
    const processedBuffer = await sharp(fileBuffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Upload processed image
    const processedFileName = filePath.replace(/\.[^/.]+$/, '_processed.jpg');
    const processedFile = storage.bucket(bucket).file(processedFileName);
    
    await processedFile.save(processedBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      }
    });

    // Make the file publicly readable
    await processedFile.makePublic();

    // Return the public URL
    return `https://storage.googleapis.com/${bucket}/${processedFileName}`;

  } catch (error) {
    console.error('Error processing image:', error);
    // Return original file URL if processing fails
    return file.publicUrl();
  }
} 