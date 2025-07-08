"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AMLService = void 0;
const admin_1 = require("../admin");
const utils_1 = require("../utils");
const auditLogService_1 = require("./auditLogService");
const db = admin_1.admin.firestore();
const amlFlagsCollection = db.collection('aml_flags');
class AMLService {
    static async flagTransaction({ transactionId, userId, riskScore, reason, severity }, flaggedBy) {
        const id = (0, utils_1.generateId)();
        const now = new Date();
        const flag = {
            id,
            transactionId,
            userId,
            riskScore,
            reason,
            severity,
            reviewed: false,
            createdAt: (0, utils_1.formatDate)(now),
            updatedAt: (0, utils_1.formatDate)(now),
        };
        await amlFlagsCollection.doc(id).set(flag);
        await auditLogService_1.AuditLogService.log({
            actor: flaggedBy,
            action: 'AML_FLAG_CREATED',
            resource: 'aml_flags',
            resourceId: id,
            after: flag,
        });
    }
    static async reviewFlag(id, reviewedBy) {
        await amlFlagsCollection.doc(id).update({ reviewed: true, updatedAt: (0, utils_1.formatDate)(new Date()) });
        await auditLogService_1.AuditLogService.log({
            actor: reviewedBy,
            action: 'AML_FLAG_REVIEWED',
            resource: 'aml_flags',
            resourceId: id,
            after: { reviewed: true },
        });
    }
    static async getFlagsByUser(userId) {
        const snapshot = await amlFlagsCollection.where('userId', '==', userId).get();
        return snapshot.docs.map(doc => doc.data());
    }
    static async list(limit = 100) {
        const snapshot = await amlFlagsCollection.orderBy('createdAt', 'desc').limit(limit).get();
        return snapshot.docs.map(doc => doc.data());
    }
}
exports.AMLService = AMLService;
//# sourceMappingURL=amlService.js.map