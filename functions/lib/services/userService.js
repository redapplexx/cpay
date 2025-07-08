"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const admin_1 = require("../admin");
const types_1 = require("../types");
const utils_1 = require("../utils");
const validation_1 = require("../utils/validation");
const errors_1 = require("../utils/errors");
const db = admin_1.admin.firestore();
const usersCollection = db.collection('users');
class UserService {
    /**
     * Create a new user
     */
    static async createUser(userData, createdBy) {
        // Validate input data
        const validation = (0, validation_1.validateUser)(userData);
        if (!validation.isValid) {
            throw validation.errors[0];
        }
        const now = new Date();
        const userId = (0, utils_1.generateId)();
        const user = {
            uid: userId,
            email: userData.email.toLowerCase(),
            phoneNumber: userData.phoneNumber,
            firstName: userData.firstName,
            lastName: userData.lastName,
            dateOfBirth: userData.dateOfBirth,
            nationality: userData.nationality,
            address: userData.address,
            role: userData.role || types_1.UserRole.USER,
            status: types_1.UserStatus.PENDING,
            kycStatus: types_1.KYCStatus.NOT_STARTED,
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
                throw new errors_1.ConflictError('User with this email already exists');
            }
            // Create user document
            await usersCollection.doc(userId).set(Object.assign(Object.assign({}, user), { createdAt: (0, utils_1.formatDate)(user.createdAt), updatedAt: (0, utils_1.formatDate)(user.updatedAt) }));
            // Create audit trail
            await this.createAuditEvent({
                userId: createdBy || 'system',
                action: 'USER_CREATED',
                resource: 'users',
                resourceId: userId,
                details: { userData: Object.assign(Object.assign({}, userData), { password: '[REDACTED]' }) }
            });
            return user;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.ConflictError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to create user: ${error}`);
        }
    }
    /**
     * Get user by ID
     */
    static async getUserById(userId) {
        try {
            const userDoc = await usersCollection.doc(userId).get();
            if (!userDoc.exists) {
                throw new errors_1.NotFoundError('User', userId);
            }
            const userData = userDoc.data();
            return Object.assign(Object.assign({}, userData), { createdAt: new Date(userData.createdAt), updatedAt: new Date(userData.updatedAt), lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt) : undefined });
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to get user: ${error}`);
        }
    }
    /**
     * Get user by email
     */
    static async getUserByEmail(email) {
        try {
            const userQuery = await usersCollection
                .where('email', '==', email.toLowerCase())
                .limit(1)
                .get();
            if (userQuery.empty) {
                return null;
            }
            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();
            return Object.assign(Object.assign({}, userData), { createdAt: new Date(userData.createdAt), updatedAt: new Date(userData.updatedAt), lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt) : undefined });
        }
        catch (error) {
            throw new errors_1.DatabaseError(`Failed to get user by email: ${error}`);
        }
    }
    /**
     * Update user
     */
    static async updateUser(userId, updates, updatedBy) {
        try {
            const user = await this.getUserById(userId);
            const now = new Date();
            const updatedUser = Object.assign(Object.assign(Object.assign({}, user), updates), { updatedAt: now });
            // Validate updated data
            const validation = (0, validation_1.validateUser)(updatedUser);
            if (!validation.isValid) {
                throw validation.errors[0];
            }
            await usersCollection.doc(userId).update(Object.assign(Object.assign({}, updates), { updatedAt: (0, utils_1.formatDate)(now) }));
            // Create audit trail
            await this.createAuditEvent({
                userId: updatedBy || 'system',
                action: 'USER_UPDATED',
                resource: 'users',
                resourceId: userId,
                details: { updates }
            });
            return updatedUser;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to update user: ${error}`);
        }
    }
    /**
     * Update user status
     */
    static async updateUserStatus(userId, status, updatedBy) {
        return this.updateUser(userId, { status }, updatedBy);
    }
    /**
     * Update user role
     */
    static async updateUserRole(userId, role, updatedBy) {
        return this.updateUser(userId, { role }, updatedBy);
    }
    /**
     * Update KYC status
     */
    static async updateKYCStatus(userId, kycStatus, updatedBy) {
        return this.updateUser(userId, { kycStatus }, updatedBy);
    }
    /**
     * Update risk score
     */
    static async updateRiskScore(userId, riskScore, updatedBy) {
        return this.updateUser(userId, { riskScore }, updatedBy);
    }
    /**
     * Add KYC document
     */
    static async addKYCDocument(userId, document, uploadedBy) {
        try {
            const user = await this.getUserById(userId);
            const kycDocument = Object.assign(Object.assign({ id: (0, utils_1.generateId)(), userId }, document), { uploadedAt: new Date() });
            const updatedKYCStatus = user.kycStatus === types_1.KYCStatus.NOT_STARTED
                ? types_1.KYCStatus.PENDING
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
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to add KYC document: ${error}`);
        }
    }
    /**
     * Update KYC document status
     */
    static async updateKYCDocumentStatus(userId, documentId, status, verifiedBy, rejectionReason) {
        try {
            const user = await this.getUserById(userId);
            const documents = user.kycDocuments || [];
            const documentIndex = documents.findIndex(doc => doc.id === documentId);
            if (documentIndex === -1) {
                throw new errors_1.NotFoundError('KYC Document', documentId);
            }
            documents[documentIndex] = Object.assign(Object.assign({}, documents[documentIndex]), { status, verifiedAt: status === types_1.KYCDocumentStatus.APPROVED ? new Date() : undefined, verifiedBy: status === types_1.KYCDocumentStatus.APPROVED ? verifiedBy : undefined, rejectionReason: status === types_1.KYCDocumentStatus.REJECTED ? rejectionReason : undefined });
            // Update overall KYC status based on document statuses
            let newKYCStatus = user.kycStatus;
            if (status === types_1.KYCDocumentStatus.REJECTED) {
                newKYCStatus = types_1.KYCStatus.REJECTED;
            }
            else if (status === types_1.KYCDocumentStatus.APPROVED) {
                const allApproved = documents.every(doc => doc.status === types_1.KYCDocumentStatus.APPROVED);
                if (allApproved) {
                    newKYCStatus = types_1.KYCStatus.APPROVED;
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
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to update KYC document status: ${error}`);
        }
    }
    /**
     * Delete user (soft delete)
     */
    static async deleteUser(userId, deletedBy) {
        try {
            await this.updateUser(userId, {
                isActive: false,
                status: types_1.UserStatus.BLOCKED
            }, deletedBy);
            // Create audit trail
            await this.createAuditEvent({
                userId: deletedBy || 'system',
                action: 'USER_DELETED',
                resource: 'users',
                resourceId: userId,
                details: {}
            });
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to delete user: ${error}`);
        }
    }
    /**
     * List users with pagination and filters
     */
    static async listUsers(filters = {}) {
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
            const users = snapshot.docs.map(doc => {
                const userData = doc.data();
                return Object.assign(Object.assign({}, userData), { createdAt: new Date(userData.createdAt), updatedAt: new Date(userData.updatedAt), lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt) : undefined });
            });
            // Get total count (this is a simplified approach - in production, you might want to use a counter)
            const totalSnapshot = await query.count().get();
            const total = totalSnapshot.data().count;
            return { users, total };
        }
        catch (error) {
            throw new errors_1.DatabaseError(`Failed to list users: ${error}`);
        }
    }
    /**
     * Search users
     */
    static async searchUsers(searchTerm, limit = 20) {
        try {
            // This is a simplified search - in production, you might want to use Algolia or similar
            const usersQuery = await usersCollection
                .where('isActive', '==', true)
                .get();
            const users = usersQuery.docs
                .map(doc => {
                const userData = doc.data();
                return Object.assign(Object.assign({}, userData), { createdAt: new Date(userData.createdAt), updatedAt: new Date(userData.updatedAt), lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt) : undefined });
            })
                .filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.phoneNumber && user.phoneNumber.includes(searchTerm)))
                .slice(0, limit);
            return users;
        }
        catch (error) {
            throw new errors_1.DatabaseError(`Failed to search users: ${error}`);
        }
    }
    /**
     * Update last login time
     */
    static async updateLastLogin(userId) {
        try {
            await usersCollection.doc(userId).update({
                lastLoginAt: (0, utils_1.formatDate)(new Date())
            });
        }
        catch (error) {
            throw new errors_1.DatabaseError(`Failed to update last login: ${error}`);
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
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map