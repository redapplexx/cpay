// frontend/app/admin/page.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Loader2, DollarSign, Users, Store, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { app } from '@/lib/firebase';

const functions = getFunctions(app);
const getAdminDashboardStatsFn = httpsCallable(functions, 'adminGetDashboardStats'); // We created this earlier

interface AdminDashboardStats {
  totalUsers: number;
  pendingMerchants: number;
  totalTransactionVolume: number;
  totalTransactions: number;
}

export default function AdminDashboardPage() {
  const { toast } = useToast();

  const { data: stats, isLoading, error } = useQuery<AdminDashboardStats>({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const result = await getAdminDashboardStatsFn();
      return result.data as AdminDashboardStats;
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
        title: "Admin Dashboard Error",
        description: `Failed to load dashboard data: ${(error as Error).message}`,
        variant: "destructive"
    });
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p>Error loading dashboard data.</p>
          <p className="text-sm text-gray-400">Please check console for details or contact support.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-white">CPAY Admin Overview</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

        <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-lg opacity-20"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
            <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="z-10">
            <div className="text-3xl font-bold text-primary-foreground">{stats?.totalUsers.toLocaleString() || '0'}</div>
            <p className="text-xs text-gray-400 mt-1">registered users</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent rounded-lg opacity-20"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
            <CardTitle className="text-sm font-medium text-gray-300">Pending Merchants</CardTitle>
            <Store className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent className="z-10">
            <div className="text-3xl font-bold text-primary-foreground">{stats?.pendingMerchants.toLocaleString() || '0'}</div>
            <p className="text-xs text-gray-400 mt-1">awaiting review</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-lg opacity-20"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
            <CardTitle className="text-sm font-medium text-gray-300">Total Txn Volume (PHP)</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent className="z-10">
            <div className="text-3xl font-bold text-primary-foreground">₱{stats?.totalTransactionVolume.toLocaleString('en-PH', { minimumFractionDigits: 2 }) || '0.00'}</div>
            <p className="text-xs text-gray-400 mt-1">across all completed transactions</p>
          </CardContent>
        </Card>

         <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-lg opacity-20"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
            <CardTitle className="text-sm font-medium text-gray-300">Total Transactions</CardTitle>
            <ReceiptText className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent className="z-10">
            <div className="text-3xl font-bold text-primary-foreground">{stats?.totalTransactions.toLocaleString() || '0'}</div>
            <p className="text-xs text-gray-400 mt-1">all types, all statuses</p>
          </CardContent>
        </Card>

      </div>

      {/* Placeholder for more detailed charts or recent admin actions */}
      {/* <Card className="mt-6 bg-gray-800 border border-gray-700 text-white shadow-lg">
          <CardHeader><CardTitle>Recent Admin Actions</CardTitle></CardHeader>
          <CardContent>
              <p className="text-gray-400">List of recent actions will go here.</p>
          </CardContent>
      </Card> */}

    </div>
  );
}
