import Link from 'next/link';

export function AdminSidebar() {
  return (
    <nav className="w-64 bg-white border-r h-full fixed">
      <div className="p-4 font-bold text-lg">Admin Panel</div>
      <ul className="space-y-2">
        <li><Link href="/admin/dashboard">Dashboard</Link></li>
        <li><Link href="/admin/users">Users</Link></li>
        <li><Link href="/admin/transactions">Transactions</Link></li>
        <li><Link href="/admin/kyc">KYC</Link></li>
        <li><Link href="/admin/notifications">Notifications</Link></li>
        <li><Link href="/admin/audit">Audit Logs</Link></li>
        <li><Link href="/admin/settings">Settings</Link></li>
      </ul>
    </nav>
  );
} 