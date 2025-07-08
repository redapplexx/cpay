"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const admin_1 = require("../admin");
const utils_1 = require("../utils");
const db = admin_1.admin.firestore();
const auditLogsCollection = db.collection('audit_logs');
class AuditLogService {
    static async log({ actor, action, resource, resourceId, before, after }) {
        const now = new Date();
        await auditLogsCollection.add({
            id: (0, utils_1.generateId)(),
            actor,
            action,
            resource,
            resourceId,
            before,
            after,
            timestamp: (0, utils_1.formatDate)(now),
        });
    }
    static async getLogsByUser(userId, limit = 100) {
        const snapshot = await auditLogsCollection
            .where('actor', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    }
    static async list(limit = 100) {
        const snapshot = await auditLogsCollection
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    }
}
exports.AuditLogService = AuditLogService;
//# sourceMappingURL=auditLogService.js.map