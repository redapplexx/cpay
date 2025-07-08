import { admin } from '../admin';
import { KYCDocument, KYCDocumentStatus, KYCDocumentType } from '../types';
import { generateId, formatDate } from '../utils';
import { DatabaseError } from '../utils/errors';
import { AuditLogService } from './auditLogService';

const db = admin.firestore();
const storage = admin.storage();
const kycCollection = db.collection('kyc_records');

export class KYCService {
  static async uploadDocument(userId: string, fileBuffer: Buffer, fileName: string, docType: KYCDocumentType, uploadedBy: string): Promise<KYCDocument> {
    const now = new Date();
    const id = generateId();
    const filePath = `kyc/${userId}/${id}_${fileName}`;
    const bucket = storage.bucket();
    await bucket.file(filePath).save(fileBuffer);
    const fileUrl = `gs://${bucket.name}/${filePath}`;
    const doc: KYCDocument = {
      id,
      userId,
      type: docType,
      status: KYCDocumentStatus.PENDING,
      fileUrl,
      fileName,
      fileSize: fileBuffer.length,
      mimeType: '',
      uploadedAt: now,
      metadata: {},
    };
    try {
      await kycCollection.doc(id).set({ ...doc, uploadedAt: formatDate(now) });
      await AuditLogService.log({
        actor: uploadedBy,
        action: 'KYC_DOCUMENT_UPLOADED',
        resource: 'kyc_records',
        resourceId: id,
        after: doc,
      });
      return doc;
    } catch (error) {
      throw new DatabaseError(`Failed to upload KYC document: ${error}`);
    }
  }

  static async verifyDocument(id: string, status: KYCDocumentStatus, verifiedBy: string, rejectionReason?: string): Promise<void> {
    await kycCollection.doc(id).update({ status, verifiedAt: formatDate(new Date()), verifiedBy, rejectionReason });
    await AuditLogService.log({
      actor: verifiedBy,
      action: 'KYC_DOCUMENT_VERIFIED',
      resource: 'kyc_records',
      resourceId: id,
      after: { status, rejectionReason },
    });
  }

  static async getRecordsByUser(userId: string): Promise<KYCDocument[]> {
    const snapshot = await kycCollection.where('userId', '==', userId).get();
    return snapshot.docs.map(doc => doc.data() as KYCDocument);
  }

  static async list(limit = 100): Promise<KYCDocument[]> {
    const snapshot = await kycCollection.orderBy('uploadedAt', 'desc').limit(limit).get();
    return snapshot.docs.map(doc => doc.data() as KYCDocument);
  }
} 