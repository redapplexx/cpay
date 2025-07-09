// partner-portal/src/app/dashboard/page.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Loader2, DollarSign, Users, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { firebaseApp } from '@/lib/firebase';
import { AnimatedPageWrapper } from '@/components/ui/AnimatedPageWrapper';

const functions = getFunctions(firebaseApp, 'asia-southeast1');
const getDashboardStatsFn = httpsCallable(functions, 'partner-getPartnerDashboardStats');

interface DashboardStats {
  totalPayoutVolume: number;
  totalPayouts: number;
  activeMerchants: number;
  last7DaysPayouts: number;
  lastUpdateTimestamp: { toDate: () => Date }; // Assuming this is returned
}

export default function PartnerDashboardPage() {
  const { toast } = useToast();

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['partnerDashboardStats'],
    queryFn: async () => {
      const result = await getDashboardStatsFn();
      return result.data as DashboardStats;
    },
    refetchInterval: 60000, // Refresh stats every minute
  });

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  if (error) {
    toast({
        title: "Dashboard Error",
        description: `Failed to load dashboard data: ${(error as Error).message}`,
        variant: "destructive"
    });
    return (
        <div className="flex flex-col items-center justify-center h-64 text-red-500">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p>Error loading dashboard data.</p>
            <p className="text-sm text-gray-400">Please try refreshing the page or contact support.</p>
        </div>
    );
  }

  return (
      <AnimatedPageWrapper>
        <h1 className="text-3xl font-bold mb-6 text-white">Dashboard Overview</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-lg opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-sm font-medium text-gray-300">Total Payout Volume</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="z-10">
              <div className="text-3xl font-bold text-primary-foreground">₱{stats?.totalPayoutVolume.toLocaleString('en-PH', { minimumFractionDigits: 2 }) || '0.00'}</div>
              <p className="text-xs text-gray-400 mt-1">across all time</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent rounded-lg opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-sm font-medium text-gray-300">Total Payouts</CardTitle>
              <TrendingUp className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent className="z-10">
              <div className="text-3xl font-bold text-primary-foreground">{stats?.totalPayouts.toLocaleString() || '0'}</div>
              <p className="text-xs text-gray-400 mt-1">completed payouts</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-lg opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-sm font-medium text-gray-300">Active Merchants</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent className="z-10">
              <div className="text-3xl font-bold text-primary-foreground">{stats?.activeMerchants.toLocaleString() || '0'}</div>
              <p className="text-xs text-gray-400 mt-1">currently onboarded</p>
            </CardContent>
          </Card>

           <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-lg opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
              <CardTitle className="text-sm font-medium text-gray-300">Last 7 Days</CardTitle>
              <Clock className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent className="z-10">
              <div className="text-3xl font-bold text-primary-foreground">₱{stats?.last7DaysPayouts.toLocaleString('en-PH', { minimumFractionDigits: 2 }) || '0.00'}</div>
              <p className="text-xs text-gray-400 mt-1">payouts this week</p>
            </CardContent>
          </Card>

        </div>

        {stats?.lastUpdateTimestamp && (
            <p className="text-right text-xs text-gray-500 mt-4">
                Last updated: {format(stats.lastUpdateTimestamp.toDate(), 'PPpp')}
            </p>
        )}
      </AnimatedPageWrapper>
  );
}
