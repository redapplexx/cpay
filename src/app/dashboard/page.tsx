'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WalletManagement } from '@/components/dashboard/WalletManagement';
import { TransactionManagement } from '@/components/dashboard/TransactionManagement';
import { KYCManagement } from '@/components/dashboard/KYCManagement';
import { FirebaseFunctionsExample } from '@/components/examples/FirebaseFunctionsExample';
import { useTestConnection, useTestTransaction } from '@/hooks/useFirebaseFunctions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/components/auth/AuthProvider';
import { Logo } from '@/components/shared/Logo';

export default function DashboardPage() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const testConnection = useTestConnection();
  const testTransaction = useTestTransaction();

  const handleTestConnection = async () => {
    const result = await testConnection.execute({});
    if (result) {
      toast({
        title: 'Connection Test Successful',
        description: result.message,
      });
    }
  };

  const handleTestTransaction = async () => {
    const result = await testTransaction.execute({
      userId: 'test-user-' + Date.now(),
      amount: 500,
    });
    if (result) {
      toast({
        title: 'Transaction Test Successful',
        description: `${result.message} - Amount: ₱${result.amount}`,
      });
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with User Info */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo size="lg" />
            <div>
              <h1 className="text-3xl font-bold mb-2">CPay Fintech Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.displayName || user?.email}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Sign Out
          </Button>
        </div>

        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle>Firebase Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={handleTestConnection} 
                disabled={testConnection.loading}
              >
                {testConnection.loading ? (
                  <LoadingSpinner size="sm" text="Testing..." />
                ) : (
                  'Test Connection'
                )}
              </Button>
              <Button 
                onClick={handleTestTransaction} 
                disabled={testTransaction.loading}
                variant="outline"
              >
                {testTransaction.loading ? (
                  <LoadingSpinner size="sm" text="Testing..." />
                ) : (
                  'Test Transaction'
                )}
              </Button>
            </div>
            {testConnection.error && (
              <p className="text-red-600 text-sm">{testConnection.error.message}</p>
            )}
            {testTransaction.error && (
              <p className="text-red-600 text-sm">{testTransaction.error.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Firebase Functions Console */}
        <FirebaseFunctionsExample />

        {/* Main Components Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WalletManagement />
          <TransactionManagement />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <KYCManagement />
          
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Firebase Functions: Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Firestore Database: Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Firebase Storage: Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Authentication: Online</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">1. Test Connection</h4>
                <p>Click "Test Connection" to verify Firebase Functions are working.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Use Functions Console</h4>
                <p>Use the Firebase Functions Console above to test any function with custom data.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Create Wallet</h4>
                <p>Create a new wallet to test wallet management functions.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">4. Process Transactions</h4>
                <p>Use the wallet IDs to test transaction processing.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">5. Upload KYC Documents</h4>
                <p>Test document upload and KYC processing.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">6. Monitor Logs</h4>
                <p>Check Firebase Console → Functions → Logs for detailed execution logs.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
