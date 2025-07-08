'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/use-auth';
import { BalanceCard } from '@/components/dashboard/balance-card';
import { ActionButtons } from '@/components/dashboard/action-buttons';
import { Skeleton } from '@/components/ui/skeleton';

const SpendingChart = dynamic(() => import('@/components/dashboard/spending-chart').then(mod => mod.SpendingChart), {
  loading: () => <Skeleton className="h-[350px]" />,
  ssr: false,
});

const RecentTransactions = dynamic(() => import('@/components/dashboard/recent-transactions').then(mod => mod.RecentTransactions), {
  loading: () => <Skeleton className="h-[350px]" />,
});

const FinancialAdvisorCard = dynamic(() => import('@/components/dashboard/financial-advisor-card').then(mod => mod.FinancialAdvisorCard), {
  loading: () => <Skeleton className="h-[250px] lg:col-span-2" />,
});


export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.displayName}!</h1>
        <p className="text-muted-foreground">Here's a summary of your account.</p>
      </div>
      <BalanceCard />
      <ActionButtons />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SpendingChart />
        <RecentTransactions />
      </div>
      <FinancialAdvisorCard />
    </div>
  );
}
