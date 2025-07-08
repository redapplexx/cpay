"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FXFeeService = void 0;
const admin_1 = require("../admin");
const auditLogService_1 = require("./auditLogService");
const db = admin_1.admin.firestore();
const fxFeesCollection = db.collection('fx_fees');
class FXFeeService {
    static async getFeeConfig(currency) {
        const doc = await fxFeesCollection.doc(currency.toUpperCase()).get();
        if (!doc.exists)
            return { type: 'flat', value: 50 };
        return doc.data();
    }
    static async setFeeConfig(currency, config, updatedBy) {
        await fxFeesCollection.doc(currency.toUpperCase()).set(config);
        await auditLogService_1.AuditLogService.log({
            actor: updatedBy,
            action: 'FX_FEE_CONFIG_UPDATED',
            resource: 'fx_fees',
            resourceId: currency.toUpperCase(),
            after: config,
        });
    }
    static async calculateFXFee(amount, currency) {
        const config = await this.getFeeConfig(currency);
        if (config.type === 'flat')
            return config.value;
        return Math.round((amount * config.value) / 100);
    }
}
exports.FXFeeService = FXFeeService;
//# sourceMappingURL=fxFeeService.js.map