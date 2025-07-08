type Role = 'admin' | 'user' | 'merchant' | 'regulator' | 'compliance';
type Action = string;
type Resource = string;

interface Permission {
  role: Role;
  action: Action;
  resource: Resource;
  allowed: boolean;
}

// Default permission table
export const permissionTable: Permission[] = [
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

export function checkAccess(role: Role, action: Action, resource: Resource): boolean {
  // Check for exact match
  if (permissionTable.some(p => p.role === role && (p.action === action || p.action === '*') && (p.resource === resource || p.resource === '*') && p.allowed)) {
    return true;
  }
  // Deny by default
  return false;
} 