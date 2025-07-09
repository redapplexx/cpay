<<<<<<< HEAD
// src/app/dashboard/page.tsx
=======
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/use-auth';
import { BalanceCard } from '@/components/dashboard/balance-card';
import { ActionButtons } from '@/components/dashboard/action-buttons';
import { Skeleton } from '@/components/ui/skeleton';
<<<<<<< HEAD
import { AlertCircle, Clock, DollarSign, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { AnimatedPageWrapper } from '@/components/ui/AnimatedPageWrapper'; // Ensure this path is correct

// Dynamic imports with premium skeleton loaders
const SpendingChart = dynamic(() => import('@/components/dashboard/spending-chart').then(mod => mod.SpendingChart), {
  loading: () => <Skeleton className="h-[300px] w-full bg-gray-700 rounded-lg" />,
=======

const SpendingChart = dynamic(() => import('@/components/dashboard/spending-chart').then(mod => mod.SpendingChart), {
  loading: () => <Skeleton className="h-[350px]" />,
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
  ssr: false,
});

const RecentTransactions = dynamic(() => import('@/components/dashboard/recent-transactions').then(mod => mod.RecentTransactions), {
<<<<<<< HEAD
  loading: () => <Skeleton className="h-[300px] w-full bg-gray-700 rounded-lg" />,
});

const FinancialAdvisorCard = dynamic(() => import('@/components/dashboard/financial-advisor-card').then(mod => mod.FinancialAdvisorCard), {
  loading: () => <Skeleton className="h-[200px] w-full lg:col-span-2 bg-gray-700 rounded-lg" />,
});

// Placeholder for fetching main app dashboard stats
// In a real scenario, you'd have a backend function like getDashboardOverviewStats
interface MainDashboardStats {
  totalBalancePHP: number;
  totalTransactionsCount: number;
  pendingTransactionsCount: number;
  // Add more stats as needed
  lastUpdateTimestamp: { toDate: () => Date };
}

// Mock function for demonstration. Replace with actual backend call.
const getDashboardOverviewStats = async (): Promise<MainDashboardStats> => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
  return {
    totalBalancePHP: 50123.45,
    totalTransactionsCount: 128,
    pendingTransactionsCount: 3,
    lastUpdateTimestamp: { toDate: () => new Date() },
  };
};

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  // Fetch general dashboard overview stats
  const { data: stats, isLoading: isLoadingStats, error: statsError } = useQuery<MainDashboardStats>({
    queryKey: ['mainDashboardOverview'],
    queryFn: getDashboardOverviewStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isAuthLoading || isLoadingStats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg text-gray-400">Loading your dashboard...</p>
      </div>
    );
  }

  if (statsError) {
    toast({
      title: "Dashboard Load Error",
      description: `Failed to load overview data: ${(statsError as Error).message}`,
      variant: "destructive"
    });
  }

  return (
    <AnimatedPageWrapper>
      <div className="space-y-6 lg:space-y-8 p-4 lg:p-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back, {user?.displayName || 'User'}!</h1>
          <p className="text-gray-400 text-lg">Here's a summary of your account.</p>
        </div>

        <BalanceCard /> {/* This card will handle its own loading states and multi-currency */}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-lg opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-sm font-medium text-gray-300">Available Balance</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="z-10">
              <div className="text-3xl font-bold text-primary-foreground">₱{stats?.totalBalancePHP.toLocaleString('en-PH', { minimumFractionDigits: 2 }) || '0.00'}</div>
              <p className="text-xs text-gray-400 mt-1">PHP Wallet</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent rounded-lg opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-sm font-medium text-gray-300">Total Transactions</CardTitle>
              <TrendingUp className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent className="z-10">
              <div className="text-3xl font-bold text-primary-foreground">{stats?.totalTransactionsCount.toLocaleString() || '0'}</div>
              <p className="text-xs text-gray-400 mt-1">all types, all time</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-lg opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-sm font-medium text-gray-300">Pending Actions</CardTitle>
              <Clock className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent className="z-10">
              <div className="text-3xl font-bold text-primary-foreground">{stats?.pendingTransactionsCount.toLocaleString() || '0'}</div>
              <p className="text-xs text-gray-400 mt-1">awaiting confirmation</p>
            </CardContent>
          </Card>
        </div>

        <ActionButtons />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SpendingChart />
          <RecentTransactions />
        </div>

        <FinancialAdvisorCard />
      </div>
    </AnimatedPageWrapper>
=======
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
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
  );
}
