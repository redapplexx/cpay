"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerService = void 0;
const admin_1 = require("../admin");
const utils_1 = require("../utils");
const errors_1 = require("../utils/errors");
const auditLogService_1 = require("./auditLogService");
const db = admin_1.admin.firestore();
const ledgerCollection = db.collection('ledger');
class LedgerService {
    static async appendEntry(entry, actor) {
        const now = new Date();
        const id = (0, utils_1.generateId)();
        const ledgerEntry = Object.assign(Object.assign({ id }, entry), { createdAt: now });
        try {
            await ledgerCollection.doc(id).set(Object.assign(Object.assign({}, ledgerEntry), { createdAt: (0, utils_1.formatDate)(now) }));
            await auditLogService_1.AuditLogService.log({
                actor,
                action: 'LEDGER_ENTRY_APPENDED',
                resource: 'ledger',
                resourceId: id,
                after: ledgerEntry,
            });
            return ledgerEntry;
        }
        catch (error) {
            throw new errors_1.DatabaseError(`Failed to append ledger entry: ${error}`);
        }
    }
    static async getEntriesByWallet(walletId, limit = 100) {
        const snapshot = await ledgerCollection.where('walletId', '==', walletId).orderBy('createdAt', 'desc').limit(limit).get();
        return snapshot.docs.map(doc => doc.data());
    }
    static async list(limit = 100) {
        const snapshot = await ledgerCollection.orderBy('createdAt', 'desc').limit(limit).get();
        return snapshot.docs.map(doc => doc.data());
    }
}
exports.LedgerService = LedgerService;
//# sourceMappingURL=ledgerService.js.map