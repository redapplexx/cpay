import { admin } from '../admin';
import { 
  Wallet, 
  WalletStatus, 
  CreateWalletRequest,
  LedgerEntry,
  LedgerEntryType
} from '../types';
import { generateId, formatDate, roundToDecimals } from '../utils';
import { validateWallet } from '../utils/validation';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError, 
  DatabaseError,
  InsufficientFundsError,
  WalletError
} from '../utils/errors';
import { UserService } from './userService';

const db = admin.firestore();
const walletsCollection = db.collection('wallets');
const ledgerCollection = db.collection('ledger');

export class WalletService {
  /**
   * Create a new wallet
   */
  static async createWallet(walletData: CreateWalletRequest, createdBy?: string): Promise<Wallet> {
    // Validate input data
    const validation = validateWallet(walletData);
    if (!validation.isValid) {
      throw validation.errors[0];
    }

    // Verify user exists
    try {
      await UserService.getUserById(walletData.userId);
    } catch (error) {
      throw new NotFoundError('User', walletData.userId);
    }

    // Check if wallet already exists for this user and currency
    const existingWallet = await walletsCollection
      .where('userId', '==', walletData.userId)
      .where('currency', '==', walletData.currency.toUpperCase())
      .limit(1)
      .get();

    if (!existingWallet.empty) {
      throw new ConflictError(`Wallet already exists for user ${walletData.userId} with currency ${walletData.currency}`);
    }

    const now = new Date();
    const walletId = generateId();

    const wallet: Wallet = {
      id: walletId,
      userId: walletData.userId,
      currency: walletData.currency.toUpperCase(),
      balance: 0,
      availableBalance: 0,
      frozenBalance: 0,
      status: WalletStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      metadata: walletData.metadata || {}
    };

    try {
      await walletsCollection.doc(walletId).set({
        ...wallet,
        createdAt: formatDate(wallet.createdAt),
        updatedAt: formatDate(wallet.updatedAt)
      });

      // Create audit trail
      await this.createAuditEvent({
        userId: createdBy || 'system',
        action: 'WALLET_CREATED',
        resource: 'wallets',
        resourceId: walletId,
        details: { walletData }
      });

      return wallet;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create wallet: ${error}`);
    }
  }

  /**
   * Get wallet by ID
   */
  static async getWalletById(walletId: string): Promise<Wallet> {
    try {
      const walletDoc = await walletsCollection.doc(walletId).get();
      
      if (!walletDoc.exists) {
        throw new NotFoundError('Wallet', walletId);
      }

      const walletData = walletDoc.data() as any;
      return {
        ...walletData,
        createdAt: new Date(walletData.createdAt),
        updatedAt: new Date(walletData.updatedAt),
        lastTransactionAt: walletData.lastTransactionAt ? new Date(walletData.lastTransactionAt) : undefined
      } as Wallet;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get wallet: ${error}`);
    }
  }

  /**
   * Get wallets by user ID
   */
  static async getWalletsByUserId(userId: string): Promise<Wallet[]> {
    try {
      const walletsQuery = await walletsCollection
        .where('userId', '==', userId)
        .get();

      return walletsQuery.docs.map(doc => {
        const walletData = doc.data() as any;
        return {
          ...walletData,
          createdAt: new Date(walletData.createdAt),
          updatedAt: new Date(walletData.updatedAt),
          lastTransactionAt: walletData.lastTransactionAt ? new Date(walletData.lastTransactionAt) : undefined
        } as Wallet;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to get wallets for user: ${error}`);
    }
  }

  /**
   * Get wallet by user ID and currency
   */
  static async getWalletByUserAndCurrency(userId: string, currency: string): Promise<Wallet | null> {
    try {
      const walletQuery = await walletsCollection
        .where('userId', '==', userId)
        .where('currency', '==', currency.toUpperCase())
        .limit(1)
        .get();

      if (walletQuery.empty) {
        return null;
      }

      const walletData = walletQuery.docs[0].data() as any;
      return {
        ...walletData,
        createdAt: new Date(walletData.createdAt),
        updatedAt: new Date(walletData.updatedAt),
        lastTransactionAt: walletData.lastTransactionAt ? new Date(walletData.lastTransactionAt) : undefined
      } as Wallet;
    } catch (error) {
      throw new DatabaseError(`Failed to get wallet by user and currency: ${error}`);
    }
  }

  /**
   * Update wallet
   */
  static async updateWallet(walletId: string, updates: Partial<Wallet>, updatedBy?: string): Promise<Wallet> {
    try {
      const wallet = await this.getWalletById(walletId);
      
      const now = new Date();
      const updatedWallet: Wallet = {
        ...wallet,
        ...updates,
        updatedAt: now
      };

      // Validate updated data
      const validation = validateWallet(updatedWallet);
      if (!validation.isValid) {
        throw validation.errors[0];
      }

      await walletsCollection.doc(walletId).update({
        ...updates,
        updatedAt: formatDate(now)
      });

      // Create audit trail
      await this.createAuditEvent({
        userId: updatedBy || 'system',
        action: 'WALLET_UPDATED',
        resource: 'wallets',
        resourceId: walletId,
        details: { updates }
      });

      return updatedWallet;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update wallet: ${error}`);
    }
  }

  /**
   * Update wallet status
   */
  static async updateWalletStatus(walletId: string, status: WalletStatus, updatedBy?: string): Promise<Wallet> {
    return this.updateWallet(walletId, { status }, updatedBy);
  }

  /**
   * Credit wallet (add funds)
   */
  static async creditWallet(
    walletId: string, 
    amount: number, 
    transactionId: string, 
    description: string,
    reference: string,
    updatedBy?: string
  ): Promise<Wallet> {
    try {
      const wallet = await this.getWalletById(walletId);
      
      if (wallet.status !== WalletStatus.ACTIVE) {
        throw new WalletError(`Cannot credit wallet ${walletId} - status is ${wallet.status}`, walletId);
      }

      if (amount <= 0) {
        throw new ValidationError('Credit amount must be positive', 'amount');
      }

      const now = new Date();
      const newBalance = roundToDecimals(wallet.balance + amount);
      const newAvailableBalance = roundToDecimals(wallet.availableBalance + amount);

      const updatedWallet: Wallet = {
        ...wallet,
        balance: newBalance,
        availableBalance: newAvailableBalance,
        updatedAt: now,
        lastTransactionAt: now
      };

      // Update wallet
      await walletsCollection.doc(walletId).update({
        balance: newBalance,
        availableBalance: newAvailableBalance,
        updatedAt: formatDate(now),
        lastTransactionAt: formatDate(now)
      });

      // Create ledger entry
      await this.createLedgerEntry({
        walletId,
        transactionId,
        type: LedgerEntryType.CREDIT,
        amount,
        balance: newBalance,
        description,
        reference
      });

      // Create audit trail
      await this.createAuditEvent({
        userId: updatedBy || 'system',
        action: 'WALLET_CREDITED',
        resource: 'wallets',
        resourceId: walletId,
        details: { amount, transactionId, newBalance }
      });

      return updatedWallet;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof WalletError) {
        throw error;
      }
      throw new DatabaseError(`Failed to credit wallet: ${error}`);
    }
  }

  /**
   * Debit wallet (remove funds)
   */
  static async debitWallet(
    walletId: string, 
    amount: number, 
    transactionId: string, 
    description: string,
    reference: string,
    updatedBy?: string
  ): Promise<Wallet> {
    try {
      const wallet = await this.getWalletById(walletId);
      
      if (wallet.status !== WalletStatus.ACTIVE) {
        throw new WalletError(`Cannot debit wallet ${walletId} - status is ${wallet.status}`, walletId);
      }

      if (amount <= 0) {
        throw new ValidationError('Debit amount must be positive', 'amount');
      }

      if (wallet.availableBalance < amount) {
        throw new InsufficientFundsError(walletId, amount, wallet.availableBalance);
      }

      const now = new Date();
      const newBalance = roundToDecimals(wallet.balance - amount);
      const newAvailableBalance = roundToDecimals(wallet.availableBalance - amount);

      const updatedWallet: Wallet = {
        ...wallet,
        balance: newBalance,
        availableBalance: newAvailableBalance,
        updatedAt: now,
        lastTransactionAt: now
      };

      // Update wallet
      await walletsCollection.doc(walletId).update({
        balance: newBalance,
        availableBalance: newAvailableBalance,
        updatedAt: formatDate(now),
        lastTransactionAt: formatDate(now)
      });

      // Create ledger entry
      await this.createLedgerEntry({
        walletId,
        transactionId,
        type: LedgerEntryType.DEBIT,
        amount,
        balance: newBalance,
        description,
        reference
      });

      // Create audit trail
      await this.createAuditEvent({
        userId: updatedBy || 'system',
        action: 'WALLET_DEBITED',
        resource: 'wallets',
        resourceId: walletId,
        details: { amount, transactionId, newBalance }
      });

      return updatedWallet;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof WalletError || error instanceof InsufficientFundsError) {
        throw error;
      }
      throw new DatabaseError(`Failed to debit wallet: ${error}`);
    }
  }

  /**
   * Freeze funds in wallet
   */
  static async freezeFunds(
    walletId: string, 
    amount: number, 
    reason: string,
    updatedBy?: string
  ): Promise<Wallet> {
    try {
      const wallet = await this.getWalletById(walletId);
      
      if (wallet.status !== WalletStatus.ACTIVE) {
        throw new WalletError(`Cannot freeze funds in wallet ${walletId} - status is ${wallet.status}`, walletId);
      }

      if (amount <= 0) {
        throw new ValidationError('Freeze amount must be positive', 'amount');
      }

      if (wallet.availableBalance < amount) {
        throw new InsufficientFundsError(walletId, amount, wallet.availableBalance);
      }

      const now = new Date();
      const newAvailableBalance = roundToDecimals(wallet.availableBalance - amount);
      const newFrozenBalance = roundToDecimals(wallet.frozenBalance + amount);

      const updatedWallet: Wallet = {
        ...wallet,
        availableBalance: newAvailableBalance,
        frozenBalance: newFrozenBalance,
        updatedAt: now
      };

      // Update wallet
      await walletsCollection.doc(walletId).update({
        availableBalance: newAvailableBalance,
        frozenBalance: newFrozenBalance,
        updatedAt: formatDate(now)
      });

      // Create audit trail
      await this.createAuditEvent({
        userId: updatedBy || 'system',
        action: 'FUNDS_FROZEN',
        resource: 'wallets',
        resourceId: walletId,
        details: { amount, reason, newAvailableBalance, newFrozenBalance }
      });

      return updatedWallet;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof WalletError || error instanceof InsufficientFundsError) {
        throw error;
      }
      throw new DatabaseError(`Failed to freeze funds: ${error}`);
    }
  }

  /**
   * Unfreeze funds in wallet
   */
  static async unfreezeFunds(
    walletId: string, 
    amount: number, 
    reason: string,
    updatedBy?: string
  ): Promise<Wallet> {
    try {
      const wallet = await this.getWalletById(walletId);
      
      if (amount <= 0) {
        throw new ValidationError('Unfreeze amount must be positive', 'amount');
      }

      if (wallet.frozenBalance < amount) {
        throw new ValidationError(`Cannot unfreeze ${amount} - only ${wallet.frozenBalance} is frozen`, 'amount');
      }

      const now = new Date();
      const newAvailableBalance = roundToDecimals(wallet.availableBalance + amount);
      const newFrozenBalance = roundToDecimals(wallet.frozenBalance - amount);

      const updatedWallet: Wallet = {
        ...wallet,
        availableBalance: newAvailableBalance,
        frozenBalance: newFrozenBalance,
        updatedAt: now
      };

      // Update wallet
      await walletsCollection.doc(walletId).update({
        availableBalance: newAvailableBalance,
        frozenBalance: newFrozenBalance,
        updatedAt: formatDate(now)
      });

      // Create audit trail
      await this.createAuditEvent({
        userId: updatedBy || 'system',
        action: 'FUNDS_UNFROZEN',
        resource: 'wallets',
        resourceId: walletId,
        details: { amount, reason, newAvailableBalance, newFrozenBalance }
      });

      return updatedWallet;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to unfreeze funds: ${error}`);
    }
  }

  /**
   * Get wallet balance
   */
  static async getWalletBalance(walletId: string): Promise<{
    balance: number;
    availableBalance: number;
    frozenBalance: number;
    currency: string;
  }> {
    try {
      const wallet = await this.getWalletById(walletId);
      return {
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        frozenBalance: wallet.frozenBalance,
        currency: wallet.currency
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get wallet balance: ${error}`);
    }
  }

  /**
   * Get ledger entries for wallet
   */
  static async getLedgerEntries(
    walletId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<{ entries: LedgerEntry[]; total: number }> {
    try {
      const entriesQuery = await ledgerCollection
        .where('walletId', '==', walletId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      const entries: LedgerEntry[] = entriesQuery.docs.map(doc => {
        const entryData = doc.data() as any;
        return {
          ...entryData,
          createdAt: new Date(entryData.createdAt)
        } as LedgerEntry;
      });

      // Get total count
      const totalSnapshot = await ledgerCollection
        .where('walletId', '==', walletId)
        .count()
        .get();
      const total = totalSnapshot.data().count;

      return { entries, total };
    } catch (error) {
      throw new DatabaseError(`Failed to get ledger entries: ${error}`);
    }
  }

  /**
   * List wallets with filters
   */
  static async listWallets(filters: {
    userId?: string;
    currency?: string;
    status?: WalletStatus;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ wallets: Wallet[]; total: number }> {
    try {
      let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = walletsCollection;

      if (filters.userId) {
        query = query.where('userId', '==', filters.userId);
      }

      if (filters.currency) {
        query = query.where('currency', '==', filters.currency.toUpperCase());
      }

      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      const wallets: Wallet[] = snapshot.docs.map(doc => {
        const walletData = doc.data() as any;
        return {
          ...walletData,
          createdAt: new Date(walletData.createdAt),
          updatedAt: new Date(walletData.updatedAt),
          lastTransactionAt: walletData.lastTransactionAt ? new Date(walletData.lastTransactionAt) : undefined
        } as Wallet;
      });

      // Get total count
      const totalSnapshot = await query.count().get();
      const total = totalSnapshot.data().count;

      return { wallets, total };
    } catch (error) {
      throw new DatabaseError(`Failed to list wallets: ${error}`);
    }
  }

  /**
   * Create ledger entry (internal method)
   */
  private static async createLedgerEntry(entryData: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<void> {
    try {
      const entry: LedgerEntry = {
        id: generateId(),
        ...entryData,
        createdAt: new Date()
      };

      await ledgerCollection.add({
        ...entry,
        createdAt: formatDate(entry.createdAt)
      });
    } catch (error) {
      console.error('Failed to create ledger entry:', error);
      // Don't throw error to avoid breaking main operations
    }
  }

  /**
   * Create audit event (internal method)
   */
  private static async createAuditEvent(auditData: {
    userId?: string;
    action: string;
    resource: string;
    resourceId: string;
    details: Record<string, any>;
  }): Promise<void> {
    try {
      const auditCollection = db.collection('audit_events');
      await auditCollection.add({
        id: generateId(),
        ...auditData,
        timestamp: formatDate(new Date())
      });
    } catch (error) {
      // Don't throw error for audit failures to avoid breaking main operations
      console.error('Failed to create audit event:', error);
    }
  }

  /**
   * Alias for getWalletById for compatibility
   */
  static async getWallet(walletId: string) {
    return this.getWalletById(walletId);
  }

  /**
   * Alias for getWalletBalance for compatibility
   */
  static async getBalance(walletId: string) {
    return this.getWalletBalance(walletId);
  }
} 