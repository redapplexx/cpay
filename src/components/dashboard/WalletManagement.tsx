'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateWallet, useGetWalletBalance, useProcessTransaction } from '@/hooks/useFirebaseFunctions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

export function WalletManagement() {
  const { toast } = useToast();
  const [walletId, setWalletId] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [toWalletId, setToWalletId] = useState('');

  const createWallet = useCreateWallet();
  const getBalance = useGetWalletBalance();
  const processTransaction = useProcessTransaction();

  const handleCreateWallet = async () => {
    const userId = 'test-user-' + Date.now();
    const result = await createWallet.execute({
      userId,
      currency: 'PHP',
      initialBalance: 1000,
    });

    if (result) {
      setWalletId(result.walletId);
      toast({
        title: 'Wallet Created',
        description: `Wallet ID: ${result.walletId}`,
      });
    }
  };

  const handleGetBalance = async () => {
    if (!walletId) {
      toast({
        title: 'Error',
        description: 'Please enter a wallet ID',
        variant: 'destructive',
      });
      return;
    }

    const result = await getBalance.execute({ walletId });
    if (result) {
      setBalance(result.balance);
      toast({
        title: 'Balance Retrieved',
        description: `${result.balance} ${result.currency}`,
      });
    }
  };

  const handleProcessTransaction = async () => {
    if (!walletId || !toWalletId || !transactionAmount) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const result = await processTransaction.execute({
      fromWalletId: walletId,
      toWalletId,
      amount: parseFloat(transactionAmount),
      currency: 'PHP',
      type: 'transfer',
      description: 'Test transaction',
    });

    if (result) {
      toast({
        title: 'Transaction Processed',
        description: `Transaction ID: ${result.transactionId}`,
      });
      // Refresh balance
      handleGetBalance();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Wallet */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Create Wallet</h3>
          <Button 
            onClick={handleCreateWallet} 
            disabled={createWallet.loading}
            className="w-full"
          >
            {createWallet.loading ? (
              <LoadingSpinner size="sm" text="Creating..." />
            ) : (
              'Create New Wallet'
            )}
          </Button>
          {createWallet.error && (
            <p className="text-red-600 text-sm">{createWallet.error.message}</p>
          )}
        </div>

        {/* Get Balance */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Check Balance</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Wallet ID"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
            />
            <Button 
              onClick={handleGetBalance} 
              disabled={getBalance.loading}
            >
              {getBalance.loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Get Balance'
              )}
            </Button>
          </div>
          {balance !== null && (
            <p className="text-green-600 font-semibold">Balance: ₱{balance}</p>
          )}
          {getBalance.error && (
            <p className="text-red-600 text-sm">{getBalance.error.message}</p>
          )}
        </div>

        {/* Process Transaction */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Process Transaction</h3>
          <div className="grid grid-cols-1 gap-4">
            <Input
              placeholder="From Wallet ID"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
            />
            <Input
              placeholder="To Wallet ID"
              value={toWalletId}
              onChange={(e) => setToWalletId(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Amount"
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
            />
            <Button 
              onClick={handleProcessTransaction} 
              disabled={processTransaction.loading}
              className="w-full"
            >
              {processTransaction.loading ? (
                <LoadingSpinner size="sm" text="Processing..." />
              ) : (
                'Process Transaction'
              )}
            </Button>
          </div>
          {processTransaction.error && (
            <p className="text-red-600 text-sm">{processTransaction.error.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default WalletManagement; 