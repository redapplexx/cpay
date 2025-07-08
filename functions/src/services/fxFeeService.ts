import { admin } from '../admin';
import { AuditLogService } from './auditLogService';

const db = admin.firestore();
const fxFeesCollection = db.collection('fx_fees');

export class FXFeeService {
  static async getFeeConfig(currency: string): Promise<{ type: 'flat' | 'percent'; value: number }> {
    const doc = await fxFeesCollection.doc(currency.toUpperCase()).get();
    if (!doc.exists) return { type: 'flat', value: 50 };
    return doc.data() as { type: 'flat' | 'percent'; value: number };
  }

  static async setFeeConfig(currency: string, config: { type: 'flat' | 'percent'; value: number }, updatedBy: string): Promise<void> {
    await fxFeesCollection.doc(currency.toUpperCase()).set(config);
    await AuditLogService.log({
      actor: updatedBy,
      action: 'FX_FEE_CONFIG_UPDATED',
      resource: 'fx_fees',
      resourceId: currency.toUpperCase(),
      after: config,
    });
  }

  static async calculateFXFee(amount: number, currency: string): Promise<number> {
    const config = await this.getFeeConfig(currency);
    if (config.type === 'flat') return config.value;
    return Math.round((amount * config.value) / 100);
  }
} 