'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetTransactionHistory, useMassPayout } from '@/hooks/useFirebaseFunctions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

export function TransactionManagement() {
  const { toast } = useToast();
  const [walletId, setWalletId] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutWalletId, setPayoutWalletId] = useState('');

  const getTransactionHistory = useGetTransactionHistory();
  const massPayout = useMassPayout();

  const handleGetTransactionHistory = async () => {
    if (!walletId) {
      toast({
        title: 'Error',
        description: 'Please enter a wallet ID',
        variant: 'destructive',
      });
      return;
    }

    const result = await getTransactionHistory.execute({ walletId, limit: 10 });
    if (result) {
      setTransactions(result);
      toast({
        title: 'Transaction History Retrieved',
        description: `Found ${result.length} transactions`,
      });
    }
  };

  const handleMassPayout = async () => {
    if (!payoutWalletId || !payoutAmount) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const result = await massPayout.execute({
      payouts: [
        {
          toWalletId: payoutWalletId,
          amount: parseFloat(payoutAmount),
          currency: 'PHP',
          description: 'Test mass payout',
        },
      ],
    });

    if (result) {
      toast({
        title: 'Mass Payout Processed',
        description: `Batch ID: ${result.batchId}, Processed: ${result.processedCount}`,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Get Transaction History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Transaction History</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Wallet ID"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
            />
            <Button 
              onClick={handleGetTransactionHistory} 
              disabled={getTransactionHistory.loading}
            >
              {getTransactionHistory.loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Get History'
              )}
            </Button>
          </div>
          {getTransactionHistory.error && (
            <p className="text-red-600 text-sm">{getTransactionHistory.error.message}</p>
          )}
        </div>

        {/* Display Transactions */}
        {transactions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Recent Transactions</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {transactions.map((tx, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{tx.type}</span>
                    <span className="text-green-600">₱{tx.amount}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {tx.description} • {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mass Payout */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Mass Payout Test</h3>
          <div className="grid grid-cols-1 gap-4">
            <Input
              placeholder="To Wallet ID"
              value={payoutWalletId}
              onChange={(e) => setPayoutWalletId(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Amount"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
            />
            <Button 
              onClick={handleMassPayout} 
              disabled={massPayout.loading}
              className="w-full"
            >
              {massPayout.loading ? (
                <LoadingSpinner size="sm" text="Processing..." />
              ) : (
                'Process Mass Payout'
              )}
            </Button>
          </div>
          {massPayout.error && (
            <p className="text-red-600 text-sm">{massPayout.error.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TransactionManagement; 