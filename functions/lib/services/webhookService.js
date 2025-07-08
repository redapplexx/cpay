"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const admin_1 = require("../admin");
const utils_1 = require("../utils");
const auditLogService_1 = require("./auditLogService");
const db = admin_1.admin.firestore();
const webhooksCollection = db.collection('webhooks');
class WebhookService {
    static async receiveEvent(event, receivedBy) {
        const id = (0, utils_1.generateId)();
        const now = new Date();
        const webhook = Object.assign(Object.assign({ id }, event), { status: 'pending', attempts: 0, createdAt: (0, utils_1.formatDate)(now), updatedAt: (0, utils_1.formatDate)(now) });
        await webhooksCollection.doc(id).set(webhook);
        await auditLogService_1.AuditLogService.log({
            actor: receivedBy,
            action: 'WEBHOOK_RECEIVED',
            resource: 'webhooks',
            resourceId: id,
            after: webhook,
        });
    }
    static async retryEvent(id, retriedBy) {
        await webhooksCollection.doc(id).update({ attempts: admin_1.admin.firestore.FieldValue.increment(1), updatedAt: (0, utils_1.formatDate)(new Date()) });
        await auditLogService_1.AuditLogService.log({
            actor: retriedBy,
            action: 'WEBHOOK_RETRY',
            resource: 'webhooks',
            resourceId: id,
            after: { retry: true },
        });
    }
    static async getEvent(id) {
        const doc = await webhooksCollection.doc(id).get();
        return doc.exists ? doc.data() : null;
    }
    static async list(limit = 100) {
        const snapshot = await webhooksCollection.orderBy('createdAt', 'desc').limit(limit).get();
        return snapshot.docs.map(doc => doc.data());
    }
}
exports.WebhookService = WebhookService;
//# sourceMappingURL=webhookService.js.map