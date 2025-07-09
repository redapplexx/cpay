import { Send, ArrowDownToLine, ArrowUpFromLine, QrCode } from 'lucide-react';
import Link from 'next/link';

const actions = [
  { label: 'Send', href: '/dashboard/transfer', icon: Send, color: 'bg-blue-500' },
  { label: 'Cash-In', href: '/dashboard/cash-in-out?tab=cash-in', icon: ArrowDownToLine, color: 'bg-green-500' },
  { label: 'Cash-Out', href: '/dashboard/cash-in-out?tab=cash-out', icon: ArrowUpFromLine, color: 'bg-red-500' },
  { label: 'QR Pay', href: '/dashboard/pay', icon: QrCode, color: 'bg-slate-800' },
];

const ActionButton = ({ action }: { action: typeof actions[0] }) => (
    <Link href={action.href} className="flex flex-col items-center justify-center gap-2">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white ${action.color}`}>
        <action.icon className="h-6 w-6" />
      </div>
      <span className="text-sm font-medium text-foreground">{action.label}</span>
    </Link>
);


export function ActionButtons() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {actions.map((action) => (
        <ActionButton key={action.label} action={action} />
      ))}
    </div>
  );
}
