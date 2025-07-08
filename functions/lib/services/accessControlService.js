"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControlService = void 0;
const admin_1 = require("../admin");
const auditLogService_1 = require("./auditLogService");
const db = admin_1.admin.firestore();
const accessControlCollection = db.collection('access_control');
class AccessControlService {
    static async getPermissionsByRole(role) {
        const snapshot = await accessControlCollection.where('role', '==', role).get();
        return snapshot.docs.map(doc => doc.data());
    }
    static async setPermission(permission, updatedBy) {
        const id = `${permission.role}_${permission.action}_${permission.resource}`;
        await accessControlCollection.doc(id).set(permission);
        await auditLogService_1.AuditLogService.log({
            actor: updatedBy,
            action: 'ACCESS_CONTROL_PERMISSION_SET',
            resource: 'access_control',
            resourceId: id,
            after: permission,
        });
    }
    static async checkPermission(role, action, resource) {
        var _a;
        const id = `${role}_${action}_${resource}`;
        const doc = await accessControlCollection.doc(id).get();
        if (doc.exists)
            return (_a = doc.data()) === null || _a === void 0 ? void 0 : _a.allowed;
        // fallback to default permission table
        const { checkAccess } = await Promise.resolve().then(() => __importStar(require('../utils/accessControl')));
        return checkAccess(role, action, resource);
    }
}
exports.AccessControlService = AccessControlService;
//# sourceMappingURL=accessControlService.js.map