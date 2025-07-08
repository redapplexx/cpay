"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const admin_1 = require("../admin");
const types_1 = require("../types");
const utils_1 = require("../utils");
const validation_1 = require("../utils/validation");
const errors_1 = require("../utils/errors");
const userService_1 = require("./userService");
const db = admin_1.admin.firestore();
const walletsCollection = db.collection('wallets');
const ledgerCollection = db.collection('ledger');
class WalletService {
    /**
     * Create a new wallet
     */
    static async createWallet(walletData, createdBy) {
        // Validate input data
        const validation = (0, validation_1.validateWallet)(walletData);
        if (!validation.isValid) {
            throw validation.errors[0];
        }
        // Verify user exists
        try {
            await userService_1.UserService.getUserById(walletData.userId);
        }
        catch (error) {
            throw new errors_1.NotFoundError('User', walletData.userId);
        }
        // Check if wallet already exists for this user and currency
        const existingWallet = await walletsCollection
            .where('userId', '==', walletData.userId)
            .where('currency', '==', walletData.currency.toUpperCase())
            .limit(1)
            .get();
        if (!existingWallet.empty) {
            throw new errors_1.ConflictError(`Wallet already exists for user ${walletData.userId} with currency ${walletData.currency}`);
        }
        const now = new Date();
        const walletId = (0, utils_1.generateId)();
        const wallet = {
            id: walletId,
            userId: walletData.userId,
            currency: walletData.currency.toUpperCase(),
            balance: 0,
            availableBalance: 0,
            frozenBalance: 0,
            status: types_1.WalletStatus.ACTIVE,
            createdAt: now,
            updatedAt: now,
            metadata: walletData.metadata || {}
        };
        try {
            await walletsCollection.doc(walletId).set(Object.assign(Object.assign({}, wallet), { createdAt: (0, utils_1.formatDate)(wallet.createdAt), updatedAt: (0, utils_1.formatDate)(wallet.updatedAt) }));
            // Create audit trail
            await this.createAuditEvent({
                userId: createdBy || 'system',
                action: 'WALLET_CREATED',
                resource: 'wallets',
                resourceId: walletId,
                details: { walletData }
            });
            return wallet;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.ConflictError || error instanceof errors_1.NotFoundError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to create wallet: ${error}`);
        }
    }
    /**
     * Get wallet by ID
     */
    static async getWalletById(walletId) {
        try {
            const walletDoc = await walletsCollection.doc(walletId).get();
            if (!walletDoc.exists) {
                throw new errors_1.NotFoundError('Wallet', walletId);
            }
            const walletData = walletDoc.data();
            return Object.assign(Object.assign({}, walletData), { createdAt: new Date(walletData.createdAt), updatedAt: new Date(walletData.updatedAt), lastTransactionAt: walletData.lastTransactionAt ? new Date(walletData.lastTransactionAt) : undefined });
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to get wallet: ${error}`);
        }
    }
    /**
     * Get wallets by user ID
     */
    static async getWalletsByUserId(userId) {
        try {
            const walletsQuery = await walletsCollection
                .where('userId', '==', userId)
                .get();
            return walletsQuery.docs.map(doc => {
                const walletData = doc.data();
                return Object.assign(Object.assign({}, walletData), { createdAt: new Date(walletData.createdAt), updatedAt: new Date(walletData.updatedAt), lastTransactionAt: walletData.lastTransactionAt ? new Date(walletData.lastTransactionAt) : undefined });
            });
        }
        catch (error) {
            throw new errors_1.DatabaseError(`Failed to get wallets for user: ${error}`);
        }
    }
    /**
     * Get wallet by user ID and currency
     */
    static async getWalletByUserAndCurrency(userId, currency) {
        try {
            const walletQuery = await walletsCollection
                .where('userId', '==', userId)
                .where('currency', '==', currency.toUpperCase())
                .limit(1)
                .get();
            if (walletQuery.empty) {
                return null;
            }
            const walletData = walletQuery.docs[0].data();
            return Object.assign(Object.assign({}, walletData), { createdAt: new Date(walletData.createdAt), updatedAt: new Date(walletData.updatedAt), lastTransactionAt: walletData.lastTransactionAt ? new Date(walletData.lastTransactionAt) : undefined });
        }
        catch (error) {
            throw new errors_1.DatabaseError(`Failed to get wallet by user and currency: ${error}`);
        }
    }
    /**
     * Update wallet
     */
    static async updateWallet(walletId, updates, updatedBy) {
        try {
            const wallet = await this.getWalletById(walletId);
            const now = new Date();
            const updatedWallet = Object.assign(Object.assign(Object.assign({}, wallet), updates), { updatedAt: now });
            // Validate updated data
            const validation = (0, validation_1.validateWallet)(updatedWallet);
            if (!validation.isValid) {
                throw validation.errors[0];
            }
            await walletsCollection.doc(walletId).update(Object.assign(Object.assign({}, updates), { updatedAt: (0, utils_1.formatDate)(now) }));
            // Create audit trail
            await this.createAuditEvent({
                userId: updatedBy || 'system',
                action: 'WALLET_UPDATED',
                resource: 'wallets',
                resourceId: walletId,
                details: { updates }
            });
            return updatedWallet;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to update wallet: ${error}`);
        }
    }
    /**
     * Update wallet status
     */
    static async updateWalletStatus(walletId, status, updatedBy) {
        return this.updateWallet(walletId, { status }, updatedBy);
    }
    /**
     * Credit wallet (add funds)
     */
    static async creditWallet(walletId, amount, transactionId, description, reference, updatedBy) {
        try {
            const wallet = await this.getWalletById(walletId);
            if (wallet.status !== types_1.WalletStatus.ACTIVE) {
                throw new errors_1.WalletError(`Cannot credit wallet ${walletId} - status is ${wallet.status}`, walletId);
            }
            if (amount <= 0) {
                throw new errors_1.ValidationError('Credit amount must be positive', 'amount');
            }
            const now = new Date();
            const newBalance = (0, utils_1.roundToDecimals)(wallet.balance + amount);
            const newAvailableBalance = (0, utils_1.roundToDecimals)(wallet.availableBalance + amount);
            const updatedWallet = Object.assign(Object.assign({}, wallet), { balance: newBalance, availableBalance: newAvailableBalance, updatedAt: now, lastTransactionAt: now });
            // Update wallet
            await walletsCollection.doc(walletId).update({
                balance: newBalance,
                availableBalance: newAvailableBalance,
                updatedAt: (0, utils_1.formatDate)(now),
                lastTransactionAt: (0, utils_1.formatDate)(now)
            });
            // Create ledger entry
            await this.createLedgerEntry({
                walletId,
                transactionId,
                type: types_1.LedgerEntryType.CREDIT,
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
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.WalletError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to credit wallet: ${error}`);
        }
    }
    /**
     * Debit wallet (remove funds)
     */
    static async debitWallet(walletId, amount, transactionId, description, reference, updatedBy) {
        try {
            const wallet = await this.getWalletById(walletId);
            if (wallet.status !== types_1.WalletStatus.ACTIVE) {
                throw new errors_1.WalletError(`Cannot debit wallet ${walletId} - status is ${wallet.status}`, walletId);
            }
            if (amount <= 0) {
                throw new errors_1.ValidationError('Debit amount must be positive', 'amount');
            }
            if (wallet.availableBalance < amount) {
                throw new errors_1.InsufficientFundsError(walletId, amount, wallet.availableBalance);
            }
            const now = new Date();
            const newBalance = (0, utils_1.roundToDecimals)(wallet.balance - amount);
            const newAvailableBalance = (0, utils_1.roundToDecimals)(wallet.availableBalance - amount);
            const updatedWallet = Object.assign(Object.assign({}, wallet), { balance: newBalance, availableBalance: newAvailableBalance, updatedAt: now, lastTransactionAt: now });
            // Update wallet
            await walletsCollection.doc(walletId).update({
                balance: newBalance,
                availableBalance: newAvailableBalance,
                updatedAt: (0, utils_1.formatDate)(now),
                lastTransactionAt: (0, utils_1.formatDate)(now)
            });
            // Create ledger entry
            await this.createLedgerEntry({
                walletId,
                transactionId,
                type: types_1.LedgerEntryType.DEBIT,
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
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.WalletError || error instanceof errors_1.InsufficientFundsError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to debit wallet: ${error}`);
        }
    }
    /**
     * Freeze funds in wallet
     */
    static async freezeFunds(walletId, amount, reason, updatedBy) {
        try {
            const wallet = await this.getWalletById(walletId);
            if (wallet.status !== types_1.WalletStatus.ACTIVE) {
                throw new errors_1.WalletError(`Cannot freeze funds in wallet ${walletId} - status is ${wallet.status}`, walletId);
            }
            if (amount <= 0) {
                throw new errors_1.ValidationError('Freeze amount must be positive', 'amount');
            }
            if (wallet.availableBalance < amount) {
                throw new errors_1.InsufficientFundsError(walletId, amount, wallet.availableBalance);
            }
            const now = new Date();
            const newAvailableBalance = (0, utils_1.roundToDecimals)(wallet.availableBalance - amount);
            const newFrozenBalance = (0, utils_1.roundToDecimals)(wallet.frozenBalance + amount);
            const updatedWallet = Object.assign(Object.assign({}, wallet), { availableBalance: newAvailableBalance, frozenBalance: newFrozenBalance, updatedAt: now });
            // Update wallet
            await walletsCollection.doc(walletId).update({
                availableBalance: newAvailableBalance,
                frozenBalance: newFrozenBalance,
                updatedAt: (0, utils_1.formatDate)(now)
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
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.WalletError || error instanceof errors_1.InsufficientFundsError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to freeze funds: ${error}`);
        }
    }
    /**
     * Unfreeze funds in wallet
     */
    static async unfreezeFunds(walletId, amount, reason, updatedBy) {
        try {
            const wallet = await this.getWalletById(walletId);
            if (amount <= 0) {
                throw new errors_1.ValidationError('Unfreeze amount must be positive', 'amount');
            }
            if (wallet.frozenBalance < amount) {
                throw new errors_1.ValidationError(`Cannot unfreeze ${amount} - only ${wallet.frozenBalance} is frozen`, 'amount');
            }
            const now = new Date();
            const newAvailableBalance = (0, utils_1.roundToDecimals)(wallet.availableBalance + amount);
            const newFrozenBalance = (0, utils_1.roundToDecimals)(wallet.frozenBalance - amount);
            const updatedWallet = Object.assign(Object.assign({}, wallet), { availableBalance: newAvailableBalance, frozenBalance: newFrozenBalance, updatedAt: now });
            // Update wallet
            await walletsCollection.doc(walletId).update({
                availableBalance: newAvailableBalance,
                frozenBalance: newFrozenBalance,
                updatedAt: (0, utils_1.formatDate)(now)
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
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to unfreeze funds: ${error}`);
        }
    }
    /**
     * Get wallet balance
     */
    static async getWalletBalance(walletId) {
        try {
            const wallet = await this.getWalletById(walletId);
            return {
                balance: wallet.balance,
                availableBalance: wallet.availableBalance,
                frozenBalance: wallet.frozenBalance,
                currency: wallet.currency
            };
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to get wallet balance: ${error}`);
        }
    }
    /**
     * Get ledger entries for wallet
     */
    static async getLedgerEntries(walletId, limit = 50, offset = 0) {
        try {
            const entriesQuery = await ledgerCollection
                .where('walletId', '==', walletId)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .offset(offset)
                .get();
            const entries = entriesQuery.docs.map(doc => {
                const entryData = doc.data();
                return Object.assign(Object.assign({}, entryData), { createdAt: new Date(entryData.createdAt) });
            });
            // Get total count
            const totalSnapshot = await ledgerCollection
                .where('walletId', '==', walletId)
                .count()
                .get();
            const total = totalSnapshot.data().count;
            return { entries, total };
        }
        catch (error) {
            throw new errors_1.DatabaseError(`Failed to get ledger entries: ${error}`);
        }
    }
    /**
     * List wallets with filters
     */
    static async listWallets(filters = {}) {
        try {
            let query = walletsCollection;
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
            const wallets = snapshot.docs.map(doc => {
                const walletData = doc.data();
                return Object.assign(Object.assign({}, walletData), { createdAt: new Date(walletData.createdAt), updatedAt: new Date(walletData.updatedAt), lastTransactionAt: walletData.lastTransactionAt ? new Date(walletData.lastTransactionAt) : undefined });
            });
            // Get total count
            const totalSnapshot = await query.count().get();
            const total = totalSnapshot.data().count;
            return { wallets, total };
        }
        catch (error) {
            throw new errors_1.DatabaseError(`Failed to list wallets: ${error}`);
        }
    }
    /**
     * Create ledger entry (internal method)
     */
    static async createLedgerEntry(entryData) {
        try {
            const entry = Object.assign(Object.assign({ id: (0, utils_1.generateId)() }, entryData), { createdAt: new Date() });
            await ledgerCollection.add(Object.assign(Object.assign({}, entry), { createdAt: (0, utils_1.formatDate)(entry.createdAt) }));
        }
        catch (error) {
            console.error('Failed to create ledger entry:', error);
            // Don't throw error to avoid breaking main operations
        }
    }
    /**
     * Create audit event (internal method)
     */
    static async createAuditEvent(auditData) {
        try {
            const auditCollection = db.collection('audit_events');
            await auditCollection.add(Object.assign(Object.assign({ id: (0, utils_1.generateId)() }, auditData), { timestamp: (0, utils_1.formatDate)(new Date()) }));
        }
        catch (error) {
            // Don't throw error for audit failures to avoid breaking main operations
            console.error('Failed to create audit event:', error);
        }
    }
    /**
     * Alias for getWalletById for compatibility
     */
    static async getWallet(walletId) {
        return this.getWalletById(walletId);
    }
    /**
     * Alias for getWalletBalance for compatibility
     */
    static async getBalance(walletId) {
        return this.getWalletBalance(walletId);
    }
}
exports.WalletService = WalletService;
//# sourceMappingURL=walletService.js.map