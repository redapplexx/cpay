import { admin } from '../admin';
import { Transaction, TransactionType, TransactionStatus, CreateTransactionRequest } from '../types';
import { generateId, formatDate } from '../utils';
import { validateTransaction } from '../utils/validation';
import { NotFoundError, DatabaseError } from '../utils/errors';
import { FXFeeService } from './fxFeeService';
import { AuditLogService } from './auditLogService';

const db = admin.firestore();
const transactionsCollection = db.collection('transactions');

export class TransactionService {
  static async createTransaction(data: CreateTransactionRequest, createdBy: string): Promise<Transaction> {
    const validation = validateTransaction(data);
    if (!validation.isValid) throw validation.errors[0];

    const now = new Date();
    const id = generateId();
    let fxFee = 0;
    if (data.type === TransactionType.FX_CONVERSION) {
      fxFee = await FXFeeService.calculateFXFee(data.amount, data.currency);
    }
    const transaction: Transaction = {
      id,
      type: data.type,
      status: TransactionStatus.PENDING,
      fromWalletId: data.fromWalletId,
      toWalletId: data.toWalletId,
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      amount: data.amount,
      currency: data.currency,
      fee: data.fee || 0,
      fxRate: data.fxRate,
      fxFee,
      description: data.description || '',
      reference: data.reference || '',
      externalReference: data.externalReference,
      metadata: data.metadata,
      createdAt: now,
      updatedAt: now,
      auditTrail: [],
    };
    try {
      await transactionsCollection.doc(id).set({
        ...transaction,
        createdAt: formatDate(now),
        updatedAt: formatDate(now),
      });
      await AuditLogService.log({
        actor: createdBy,
        action: 'TRANSACTION_CREATED',
        resource: 'transactions',
        resourceId: id,
        after: transaction,
      });
      return transaction;
    } catch (error) {
      throw new DatabaseError(`Failed to create transaction: ${error}`);
    }
  }

  static async getTransaction(id: string): Promise<Transaction> {
    const doc = await transactionsCollection.doc(id).get();
    if (!doc.exists) throw new NotFoundError('Transaction', id);
    return doc.data() as Transaction;
  }

  static async updateTransactionStatus(id: string, status: TransactionStatus, updatedBy: string): Promise<void> {
    const doc = await transactionsCollection.doc(id).get();
    if (!doc.exists) throw new NotFoundError('Transaction', id);
    await transactionsCollection.doc(id).update({ status, updatedAt: formatDate(new Date()) });
    await AuditLogService.log({
      actor: updatedBy,
      action: 'TRANSACTION_STATUS_UPDATED',
      resource: 'transactions',
      resourceId: id,
      after: { status },
    });
  }

  static async listTransactions(filters: Partial<Transaction> = {}, limit = 50): Promise<Transaction[]> {
    let query: FirebaseFirestore.Query = transactionsCollection;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) query = query.where(key, '==', value);
    });
    const snapshot = await query.limit(limit).get();
    return snapshot.docs.map(doc => doc.data() as Transaction);
  }
} 