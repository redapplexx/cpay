// frontend/app/admin/transactions/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const functions = getFunctions();
const listTransactionsFn = httpsCallable(functions, 'adminListTransactions');

// Define types for clarity
type Transaction = {
  id: string;
  status: 'Completed' | 'Pending' | 'Failed';
  type: string;
  amount: number;
  currency: string;
  date: { toDate: () => Date }; // Assuming Firestore Timestamp
  sender: { uid: string, name: string };
  receiver: { uid: string, name: string };
};

export default function AdminTransactionsPage() {
  const [filters, setFilters] = useState({ status: '' });
  const [searchTrigger, setSearchTrigger] = useState(0);

  const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
    queryKey: ['admin-transactions', searchTrigger], // Refetch when searchTrigger changes
    queryFn: async () => {
      const result = await listTransactionsFn(filters);
      return result.data as Transaction[];
    },
  });

  const handleSearch = () => {
    // Trigger a new fetch with the current filters
    setSearchTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Transaction Management</h1>
      
      <div className="flex items-center space-x-2 mb-4 p-4 bg-slate-50 rounded-lg">
        <Input 
          placeholder="Filter by Status (e.g., Completed)" 
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="max-w-xs"
        />
        {/* Add more filter inputs here for userId, date range etc. */}
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {isLoading && (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin" /></div>
      )}

      {error && (
          <div className="text-red-600">Error loading transactions: {(error as Error).message}</div>
      )}

      {!isLoading && !error && (
        <div className="bg-white shadow overflow-x-auto rounded-md">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions?.map((txn) => (
                <tr key={txn.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{txn.date ? format(txn.date.toDate(), 'PPpp') : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{txn.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{txn.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{txn.amount.toFixed(2)} {txn.currency}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={txn.status === 'Completed' ? 'default' : 'secondary'}>{txn.status}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{txn.sender?.name || txn.sender?.uid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{txn.receiver?.name || txn.receiver?.uid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
