import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, onSnapshot, Timestamp, writeBatch, runTransaction } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

// Types for admin data
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'superadmin';
  status: 'active' | 'suspended' | 'pending';
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  tenantId?: string;
  phoneNumber?: string;
  country?: string;
}

export interface AdminWallet {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  status: 'active' | 'frozen' | 'closed';
  createdAt: Timestamp;
  lastTransactionAt?: Timestamp;
  tenantId?: string;
}

export interface AdminTransaction {
  id: string;
  fromWalletId?: string;
  toWalletId: string;
  amount: number;
  currency: string;
  type: 'transfer' | 'payout' | 'cash_in' | 'cash_out' | 'fee';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  tenantId?: string;
  fee?: number;
  fxRate?: number;
}

export interface AdminKYC {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  documentType: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill';
  documentUrl?: string;
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  rejectionReason?: string;
  tenantId?: string;
}

export interface AdminPayout {
  id: string;
  batchId?: string;
  toWalletId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  failureReason?: string;
  tenantId?: string;
}

export interface AdminAMLFlag {
  id: string;
  userId?: string;
  transactionId?: string;
  type: 'suspicious_activity' | 'large_transaction' | 'unusual_pattern' | 'sanctions_match';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  description: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
  resolvedBy?: string;
  tenantId?: string;
}

export interface AdminAuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Timestamp;
  tenantId?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalWallets: number;
  totalTransactions: number;
  totalVolume: number;
  activeUsers: number;
  pendingKYC: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  uptime: number;
  revenue: number;
  pendingPayouts: number;
  openAMLFlags: number;
}

export interface AdminFilters {
  search?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tenantId?: string;
  limit?: number;
}

class AdminService {
  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get real-time counts from Firestore
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const walletsSnapshot = await getDocs(collection(db, 'wallets'));
      const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
      const kycSnapshot = await getDocs(query(collection(db, 'kyc'), where('status', '==', 'pending')));
      const payoutsSnapshot = await getDocs(query(collection(db, 'payouts'), where('status', '==', 'pending')));
      const amlSnapshot = await getDocs(query(collection(db, 'aml_flags'), where('status', '==', 'open')));

      // Calculate total volume from transactions
      let totalVolume = 0;
      transactionsSnapshot.forEach(doc => {
        const transaction = doc.data() as AdminTransaction;
        if (transaction.status === 'completed') {
          totalVolume += transaction.amount;
        }
      });

      // Calculate active users (users with login in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsersQuery = query(
        collection(db, 'users'),
        where('lastLoginAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
      );
      const activeUsersSnapshot = await getDocs(activeUsersQuery);

      return {
        totalUsers: usersSnapshot.size,
        totalWallets: walletsSnapshot.size,
        totalTransactions: transactionsSnapshot.size,
        totalVolume,
        activeUsers: activeUsersSnapshot.size,
        pendingKYC: kycSnapshot.size,
        systemHealth: 'healthy', // This would come from monitoring service
        uptime: 99.9, // This would come from monitoring service
        revenue: totalVolume * 0.02, // Assuming 2% fee
        pendingPayouts: payoutsSnapshot.size,
        openAMLFlags: amlSnapshot.size
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // User Management
  async getUsers(filters: AdminFilters = {}): Promise<AdminUser[]> {
    try {
      let q = collection(db, 'users');
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.tenantId) {
        q = query(q, where('tenantId', '==', filters.tenantId));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      const users: AdminUser[] = [];
      
      snapshot.forEach(doc => {
        users.push({
          id: doc.id,
          ...doc.data()
        } as AdminUser);
      });

      // Apply search filter if provided
      if (filters.search) {
        return users.filter(user => 
          user.email.toLowerCase().includes(filters.search!.toLowerCase()) ||
          user.firstName.toLowerCase().includes(filters.search!.toLowerCase()) ||
          user.lastName.toLowerCase().includes(filters.search!.toLowerCase())
        );
      }

      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Wallet Management
  async getWallets(filters: AdminFilters = {}): Promise<AdminWallet[]> {
    try {
      let q = collection(db, 'wallets');
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.tenantId) {
        q = query(q, where('tenantId', '==', filters.tenantId));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      const wallets: AdminWallet[] = [];
      
      snapshot.forEach(doc => {
        wallets.push({
          id: doc.id,
          ...doc.data()
        } as AdminWallet);
      });

      return wallets;
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw error;
    }
  }

  // Transaction Management
  async getTransactions(filters: AdminFilters = {}): Promise<AdminTransaction[]> {
    try {
      let q = collection(db, 'transactions');
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.tenantId) {
        q = query(q, where('tenantId', '==', filters.tenantId));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      const transactions: AdminTransaction[] = [];
      
      snapshot.forEach(doc => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        } as AdminTransaction);
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  // KYC Management
  async getKYCRecords(filters: AdminFilters = {}): Promise<AdminKYC[]> {
    try {
      let q = collection(db, 'kyc');
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.tenantId) {
        q = query(q, where('tenantId', '==', filters.tenantId));
      }
      
      q = query(q, orderBy('submittedAt', 'desc'));
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      const kycRecords: AdminKYC[] = [];
      
      snapshot.forEach(doc => {
        kycRecords.push({
          id: doc.id,
          ...doc.data()
        } as AdminKYC);
      });

      return kycRecords;
    } catch (error) {
      console.error('Error fetching KYC records:', error);
      throw error;
    }
  }

  // Payout Management
  async getPayouts(filters: AdminFilters = {}): Promise<AdminPayout[]> {
    try {
      let q = collection(db, 'payouts');
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.tenantId) {
        q = query(q, where('tenantId', '==', filters.tenantId));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      const payouts: AdminPayout[] = [];
      
      snapshot.forEach(doc => {
        payouts.push({
          id: doc.id,
          ...doc.data()
        } as AdminPayout);
      });

      return payouts;
    } catch (error) {
      console.error('Error fetching payouts:', error);
      throw error;
    }
  }

  // AML Management
  async getAMLFlags(filters: AdminFilters = {}): Promise<AdminAMLFlag[]> {
    try {
      let q = collection(db, 'aml_flags');
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.tenantId) {
        q = query(q, where('tenantId', '==', filters.tenantId));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      const amlFlags: AdminAMLFlag[] = [];
      
      snapshot.forEach(doc => {
        amlFlags.push({
          id: doc.id,
          ...doc.data()
        } as AdminAMLFlag);
      });

      return amlFlags;
    } catch (error) {
      console.error('Error fetching AML flags:', error);
      throw error;
    }
  }

  // Audit Logs
  async getAuditLogs(filters: AdminFilters = {}): Promise<AdminAuditLog[]> {
    try {
      let q = collection(db, 'audit_logs');
      
      if (filters.tenantId) {
        q = query(q, where('tenantId', '==', filters.tenantId));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      const auditLogs: AdminAuditLog[] = [];
      
      snapshot.forEach(doc => {
        auditLogs.push({
          id: doc.id,
          ...doc.data()
        } as AdminAuditLog);
      });

      return auditLogs;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  // Real-time listeners
  subscribeToUsers(callback: (users: AdminUser[]) => void) {
    return onSnapshot(collection(db, 'users'), (snapshot) => {
      const users: AdminUser[] = [];
      snapshot.forEach(doc => {
        users.push({
          id: doc.id,
          ...doc.data()
        } as AdminUser);
      });
      callback(users);
    });
  }

  subscribeToTransactions(callback: (transactions: AdminTransaction[]) => void) {
    return onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const transactions: AdminTransaction[] = [];
      snapshot.forEach(doc => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        } as AdminTransaction);
      });
      callback(transactions);
    });
  }

  subscribeToAMLFlags(callback: (flags: AdminAMLFlag[]) => void) {
    return onSnapshot(collection(db, 'aml_flags'), (snapshot) => {
      const flags: AdminAMLFlag[] = [];
      snapshot.forEach(doc => {
        flags.push({
          id: doc.id,
          ...doc.data()
        } as AdminAMLFlag);
      });
      callback(flags);
    });
  }
}

export const adminService = new AdminService();
