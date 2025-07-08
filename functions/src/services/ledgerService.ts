import { admin } from '../admin';
import { LedgerEntry } from '../types';
import { generateId, formatDate } from '../utils';
import { DatabaseError } from '../utils/errors';
import { AuditLogService } from './auditLogService';

const db = admin.firestore();
const ledgerCollection = db.collection('ledger');

export class LedgerService {
  static async appendEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>, actor: string): Promise<LedgerEntry> {
    const now = new Date();
    const id = generateId();
    const ledgerEntry: LedgerEntry = {
      id,
      ...entry,
      createdAt: now,
    };
    try {
      await ledgerCollection.doc(id).set({ ...ledgerEntry, createdAt: formatDate(now) });
      await AuditLogService.log({
        actor,
        action: 'LEDGER_ENTRY_APPENDED',
        resource: 'ledger',
        resourceId: id,
        after: ledgerEntry,
      });
      return ledgerEntry;
    } catch (error) {
      throw new DatabaseError(`Failed to append ledger entry: ${error}`);
    }
  }

  static async getEntriesByWallet(walletId: string, limit = 100): Promise<LedgerEntry[]> {
    const snapshot = await ledgerCollection.where('walletId', '==', walletId).orderBy('createdAt', 'desc').limit(limit).get();
    return snapshot.docs.map(doc => doc.data() as LedgerEntry);
  }

  static async list(limit = 100): Promise<LedgerEntry[]> {
    const snapshot = await ledgerCollection.orderBy('createdAt', 'desc').limit(limit).get();
    return snapshot.docs.map(doc => doc.data() as LedgerEntry);
  }
} 