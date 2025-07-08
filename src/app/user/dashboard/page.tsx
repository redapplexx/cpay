import Image from 'next/image';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, Plus, QrCode, Send, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserDashboardHeader } from './_components/UserDashboardHeader';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import FxTrendChart from '@/components/dashboard/FxTrendChart';

const quickActions = [
  { label: 'Send', icon: Send, color: 'bg-sky-blue', href: '/user/transfer' },
  { label: 'Cash-In', icon: ArrowDownLeft, color: 'bg-emerald-green', href: '#' },
  { label: 'Cash-Out', icon: ArrowUpRight, color: 'bg-soft-red', href: '#' },
  { label: 'QR Pay', icon: QrCode, color: 'bg-primary', href: '#' },
];

const transactions = [
  {
    type: 'Cash-In',
    source: '7-Eleven',
    amount: '+ ₱5,000.00',
    time: '10:45 AM',
    icon: Wallet,
    color: 'text-emerald-green',
  },
  {
    type: 'Sent',
    source: 'Jane Doe',
    amount: '- ₩15,000',
    time: '09:30 AM',
    icon: Send,
    color: 'text-soft-red',
  },
  {
    type: 'Received',
    source: 'John Smith',
    amount: '+ ₩50,000',
    time: 'Yesterday',
    icon: ArrowDownLeft,
    color: 'text-emerald-green',
  },
];

export default function UserDashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <UserDashboardHeader />

      <Card className="w-full shadow-elegant rounded-3xl bg-primary text-primary-foreground overflow-hidden">
        <CardContent className="p-6 relative">
          <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full -mt-8 -mr-8"></div>
          <div className="absolute bottom-0 left-0 h-24 w-24 bg-white/5 rounded-full -mb-12 -ml-12"></div>
          <p className="text-sm text-primary-foreground/70">Total Balance</p>
          <p className="text-4xl font-bold font-headline mt-1">₩1,234,567.89</p>
          <p className="text-sm text-primary-foreground/70 mt-1">≈ ₱50,123.45</p>
          <Button className="mt-4 rounded-xl bg-royal-gold text-primary hover:bg-royal-gold/90 font-bold">
            <Plus className="mr-2 h-4 w-4" />
            Add Money
          </Button>
        </CardContent>
      </Card>

      <section>
        <div className="grid grid-cols-4 gap-4 text-center">
          {quickActions.map((action) => (
            <Link
              href={action.href}
              key={action.label}
              className="flex flex-col items-center gap-2"
            >
              <Button size="icon" className={`h-16 w-16 rounded-2xl ${action.color} shadow-md`}>
                <action.icon className="h-7 w-7 text-white" />
              </Button>
              <p className="text-xs font-semibold">{action.label}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-headline text-primary">Recent Activity</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/user/activity" className="text-primary font-semibold">
              View All
            </Link>
          </Button>
        </div>
        <RecentActivityFeed />
      </section>

      <section>
        <h2 className="text-lg font-bold font-headline text-primary mb-4">FX Rate Trends</h2>
        <FxTrendChart />
      </section>
    </div>
  );
}
