"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const admin_1 = require("../admin");
const auditLogService_1 = require("./auditLogService");
const db = admin_1.admin.firestore();
const configCollection = db.collection('configurations');
class ConfigService {
    static async getConfig(key) {
        const doc = await configCollection.doc(key).get();
        return doc.exists ? doc.data() : null;
    }
    static async setConfig(key, value, updatedBy) {
        await configCollection.doc(key).set({ value, updatedBy, updatedAt: new Date().toISOString() });
        await auditLogService_1.AuditLogService.log({
            actor: updatedBy,
            action: 'CONFIG_SET',
            resource: 'configurations',
            resourceId: key,
            after: { value },
        });
    }
    static async listConfigs() {
        const snapshot = await configCollection.get();
        return snapshot.docs.map(doc => (Object.assign({ key: doc.id }, doc.data())));
    }
}
exports.ConfigService = ConfigService;
//# sourceMappingURL=configService.js.map