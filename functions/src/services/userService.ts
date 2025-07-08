import { admin } from '../admin';
import { 
  User, 
  UserRole, 
  UserStatus, 
  KYCStatus, 
  CreateUserRequest,
  KYCDocument,
  KYCDocumentStatus
} from '../types';
import { generateId, formatDate } from '../utils';
import { validateUser } from '../utils/validation';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError, 
  DatabaseError 
} from '../utils/errors';

const db = admin.firestore();
const usersCollection = db.collection('users');

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: CreateUserRequest, createdBy?: string): Promise<User> {
    // Validate input data
    const validation = validateUser(userData);
    if (!validation.isValid) {
      throw validation.errors[0];
    }

    const now = new Date();
    const userId = generateId();

    const user: User = {
      uid: userId,
      email: userData.email.toLowerCase(),
      phoneNumber: userData.phoneNumber,
      firstName: userData.firstName,
      lastName: userData.lastName,
      dateOfBirth: userData.dateOfBirth,
      nationality: userData.nationality,
      address: userData.address,
      role: userData.role || UserRole.USER,
      status: UserStatus.PENDING,
      kycStatus: KYCStatus.NOT_STARTED,
      kycDocuments: [],
      riskScore: undefined,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      metadata: userData.metadata || {}
    };

    try {
      // Check if user with email already exists
      const existingUser = await usersCollection
        .where('email', '==', user.email)
        .limit(1)
        .get();

      if (!existingUser.empty) {
        throw new ConflictError('User with this email already exists');
      }

      // Create user document
      await usersCollection.doc(userId).set({
        ...user,
        createdAt: formatDate(user.createdAt),
        updatedAt: formatDate(user.updatedAt)
      });

      // Create audit trail
      await this.createAuditEvent({
        userId: createdBy || 'system',
        action: 'USER_CREATED',
        resource: 'users',
        resourceId: userId,
        details: { userData: { ...userData, password: '[REDACTED]' } }
      });

      return user;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create user: ${error}`);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User> {
    try {
      const userDoc = await usersCollection.doc(userId).get();
      
      if (!userDoc.exists) {
        throw new NotFoundError('User', userId);
      }

      const userData = userDoc.data() as any;
      return {
        ...userData,
        createdAt: new Date(userData.createdAt),
        updatedAt: new Date(userData.updatedAt),
        lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt) : undefined
      } as User;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get user: ${error}`);
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const userQuery = await usersCollection
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (userQuery.empty) {
        return null;
      }

      const userDoc = userQuery.docs[0];
      const userData = userDoc.data() as any;
      
      return {
        ...userData,
        createdAt: new Date(userData.createdAt),
        updatedAt: new Date(userData.updatedAt),
        lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt) : undefined
      } as User;
    } catch (error) {
      throw new DatabaseError(`Failed to get user by email: ${error}`);
    }
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, updates: Partial<User>, updatedBy?: string): Promise<User> {
    try {
      const user = await this.getUserById(userId);
      
      const now = new Date();
      const updatedUser: User = {
        ...user,
        ...updates,
        updatedAt: now
      };

      // Validate updated data
      const validation = validateUser(updatedUser);
      if (!validation.isValid) {
        throw validation.errors[0];
      }

      await usersCollection.doc(userId).update({
        ...updates,
        updatedAt: formatDate(now)
      });

      // Create audit trail
      await this.createAuditEvent({
        userId: updatedBy || 'system',
        action: 'USER_UPDATED',
        resource: 'users',
        resourceId: userId,
        details: { updates }
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update user: ${error}`);
    }
  }

  /**
   * Update user status
   */
  static async updateUserStatus(userId: string, status: UserStatus, updatedBy?: string): Promise<User> {
    return this.updateUser(userId, { status }, updatedBy);
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, role: UserRole, updatedBy?: string): Promise<User> {
    return this.updateUser(userId, { role }, updatedBy);
  }

  /**
   * Update KYC status
   */
  static async updateKYCStatus(userId: string, kycStatus: KYCStatus, updatedBy?: string): Promise<User> {
    return this.updateUser(userId, { kycStatus }, updatedBy);
  }

  /**
   * Update risk score
   */
  static async updateRiskScore(userId: string, riskScore: number, updatedBy?: string): Promise<User> {
    return this.updateUser(userId, { riskScore }, updatedBy);
  }

  /**
   * Add KYC document
   */
  static async addKYCDocument(
    userId: string, 
    document: Omit<KYCDocument, 'id' | 'userId' | 'uploadedAt'>,
    uploadedBy?: string
  ): Promise<KYCDocument> {
    try {
      const user = await this.getUserById(userId);
      
      const kycDocument: KYCDocument = {
        id: generateId(),
        userId,
        ...document,
        uploadedAt: new Date()
      };

      const updatedKYCStatus = user.kycStatus === KYCStatus.NOT_STARTED 
        ? KYCStatus.PENDING 
        : user.kycStatus;

      const updatedDocuments = [...(user.kycDocuments || []), kycDocument];

      await this.updateUser(userId, {
        kycStatus: updatedKYCStatus,
        kycDocuments: updatedDocuments
      }, uploadedBy);

      // Create audit trail
      await this.createAuditEvent({
        userId: uploadedBy || 'system',
        action: 'KYC_DOCUMENT_ADDED',
        resource: 'users',
        resourceId: userId,
        details: { documentType: document.type, documentId: kycDocument.id }
      });

      return kycDocument;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to add KYC document: ${error}`);
    }
  }

  /**
   * Update KYC document status
   */
  static async updateKYCDocumentStatus(
    userId: string,
    documentId: string,
    status: KYCDocumentStatus,
    verifiedBy?: string,
    rejectionReason?: string
  ): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      const documents = user.kycDocuments || [];
      
      const documentIndex = documents.findIndex(doc => doc.id === documentId);
      if (documentIndex === -1) {
        throw new NotFoundError('KYC Document', documentId);
      }

      documents[documentIndex] = {
        ...documents[documentIndex],
        status,
        verifiedAt: status === KYCDocumentStatus.APPROVED ? new Date() : undefined,
        verifiedBy: status === KYCDocumentStatus.APPROVED ? verifiedBy : undefined,
        rejectionReason: status === KYCDocumentStatus.REJECTED ? rejectionReason : undefined
      };

      // Update overall KYC status based on document statuses
      let newKYCStatus = user.kycStatus;
      if (status === KYCDocumentStatus.REJECTED) {
        newKYCStatus = KYCStatus.REJECTED;
      } else if (status === KYCDocumentStatus.APPROVED) {
        const allApproved = documents.every(doc => doc.status === KYCDocumentStatus.APPROVED);
        if (allApproved) {
          newKYCStatus = KYCStatus.APPROVED;
        }
      }

      await this.updateUser(userId, {
        kycStatus: newKYCStatus,
        kycDocuments: documents
      }, verifiedBy);

      // Create audit trail
      await this.createAuditEvent({
        userId: verifiedBy || 'system',
        action: 'KYC_DOCUMENT_STATUS_UPDATED',
        resource: 'users',
        resourceId: userId,
        details: { documentId, status, rejectionReason }
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update KYC document status: ${error}`);
    }
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(userId: string, deletedBy?: string): Promise<void> {
    try {
      await this.updateUser(userId, { 
        isActive: false,
        status: UserStatus.BLOCKED
      }, deletedBy);

      // Create audit trail
      await this.createAuditEvent({
        userId: deletedBy || 'system',
        action: 'USER_DELETED',
        resource: 'users',
        resourceId: userId,
        details: {}
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete user: ${error}`);
    }
  }

  /**
   * List users with pagination and filters
   */
  static async listUsers(filters: {
    role?: UserRole;
    status?: UserStatus;
    kycStatus?: KYCStatus;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ users: User[]; total: number }> {
    try {
      let query = usersCollection.where('isActive', '==', true);

      if (filters.role) {
        query = query.where('role', '==', filters.role);
      }

      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      if (filters.kycStatus) {
        query = query.where('kycStatus', '==', filters.kycStatus);
      }

      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      const users: User[] = snapshot.docs.map(doc => {
        const userData = doc.data() as any;
        return {
          ...userData,
          createdAt: new Date(userData.createdAt),
          updatedAt: new Date(userData.updatedAt),
          lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt) : undefined
        } as User;
      });

      // Get total count (this is a simplified approach - in production, you might want to use a counter)
      const totalSnapshot = await query.count().get();
      const total = totalSnapshot.data().count;

      return { users, total };
    } catch (error) {
      throw new DatabaseError(`Failed to list users: ${error}`);
    }
  }

  /**
   * Search users
   */
  static async searchUsers(searchTerm: string, limit: number = 20): Promise<User[]> {
    try {
      // This is a simplified search - in production, you might want to use Algolia or similar
      const usersQuery = await usersCollection
        .where('isActive', '==', true)
        .get();

      const users = usersQuery.docs
        .map(doc => {
          const userData = doc.data() as any;
          return {
            ...userData,
            createdAt: new Date(userData.createdAt),
            updatedAt: new Date(userData.updatedAt),
            lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt) : undefined
          } as User;
        })
        .filter(user => 
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.phoneNumber && user.phoneNumber.includes(searchTerm))
        )
        .slice(0, limit);

      return users;
    } catch (error) {
      throw new DatabaseError(`Failed to search users: ${error}`);
    }
  }

  /**
   * Update last login time
   */
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      await usersCollection.doc(userId).update({
        lastLoginAt: formatDate(new Date())
      });
    } catch (error) {
      throw new DatabaseError(`Failed to update last login: ${error}`);
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
} 