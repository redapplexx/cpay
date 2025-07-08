"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionTable = void 0;
exports.checkAccess = checkAccess;
// Default permission table
exports.permissionTable = [
    // Admin: all access
    { role: 'admin', action: '*', resource: '*', allowed: true },
    // User: self actions
    { role: 'user', action: 'read', resource: 'users', allowed: true },
    { role: 'user', action: 'update', resource: 'users', allowed: true },
    { role: 'user', action: 'create', resource: 'transactions', allowed: true },
    { role: 'user', action: 'read', resource: 'wallets', allowed: true },
    { role: 'user', action: 'read', resource: 'ledgers', allowed: true },
    { role: 'user', action: 'read', resource: 'kyc_records', allowed: true },
    // Merchant: payouts, transactions
    { role: 'merchant', action: 'create', resource: 'payouts', allowed: true },
    { role: 'merchant', action: 'read', resource: 'payouts', allowed: true },
    { role: 'merchant', action: 'create', resource: 'transactions', allowed: true },
    { role: 'merchant', action: 'read', resource: 'wallets', allowed: true },
    // Regulator: audit, AML, KYC
    { role: 'regulator', action: 'read', resource: 'audit_logs', allowed: true },
    { role: 'regulator', action: 'read', resource: 'aml_flags', allowed: true },
    { role: 'regulator', action: 'read', resource: 'kyc_records', allowed: true },
    // Compliance: KYC, AML
    { role: 'compliance', action: 'read', resource: 'kyc_records', allowed: true },
    { role: 'compliance', action: 'update', resource: 'kyc_records', allowed: true },
    { role: 'compliance', action: 'read', resource: 'aml_flags', allowed: true },
    { role: 'compliance', action: 'update', resource: 'aml_flags', allowed: true },
];
function checkAccess(role, action, resource) {
    // Check for exact match
    if (exports.permissionTable.some(p => p.role === role && (p.action === action || p.action === '*') && (p.resource === resource || p.resource === '*') && p.allowed)) {
        return true;
    }
    // Deny by default
    return false;
}
//# sourceMappingURL=accessControl.js.map