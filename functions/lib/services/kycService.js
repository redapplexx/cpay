"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYCService = void 0;
const admin_1 = require("../admin");
const types_1 = require("../types");
const utils_1 = require("../utils");
const errors_1 = require("../utils/errors");
const auditLogService_1 = require("./auditLogService");
const db = admin_1.admin.firestore();
const storage = admin_1.admin.storage();
const kycCollection = db.collection('kyc_records');
class KYCService {
    static async uploadDocument(userId, fileBuffer, fileName, docType, uploadedBy) {
        const now = new Date();
        const id = (0, utils_1.generateId)();
        const filePath = `kyc/${userId}/${id}_${fileName}`;
        const bucket = storage.bucket();
        await bucket.file(filePath).save(fileBuffer);
        const fileUrl = `gs://${bucket.name}/${filePath}`;
        const doc = {
            id,
            userId,
            type: docType,
            status: types_1.KYCDocumentStatus.PENDING,
            fileUrl,
            fileName,
            fileSize: fileBuffer.length,
            mimeType: '',
            uploadedAt: now,
            metadata: {},
        };
        try {
            await kycCollection.doc(id).set(Object.assign(Object.assign({}, doc), { uploadedAt: (0, utils_1.formatDate)(now) }));
            await auditLogService_1.AuditLogService.log({
                actor: uploadedBy,
                action: 'KYC_DOCUMENT_UPLOADED',
                resource: 'kyc_records',
                resourceId: id,
                after: doc,
            });
            return doc;
        }
        catch (error) {
            throw new errors_1.DatabaseError(`Failed to upload KYC document: ${error}`);
        }
    }
    static async verifyDocument(id, status, verifiedBy, rejectionReason) {
        await kycCollection.doc(id).update({ status, verifiedAt: (0, utils_1.formatDate)(new Date()), verifiedBy, rejectionReason });
        await auditLogService_1.AuditLogService.log({
            actor: verifiedBy,
            action: 'KYC_DOCUMENT_VERIFIED',
            resource: 'kyc_records',
            resourceId: id,
            after: { status, rejectionReason },
        });
    }
    static async getRecordsByUser(userId) {
        const snapshot = await kycCollection.where('userId', '==', userId).get();
        return snapshot.docs.map(doc => doc.data());
    }
    static async list(limit = 100) {
        const snapshot = await kycCollection.orderBy('uploadedAt', 'desc').limit(limit).get();
        return snapshot.docs.map(doc => doc.data());
    }
}
exports.KYCService = KYCService;
//# sourceMappingURL=kycService.js.map