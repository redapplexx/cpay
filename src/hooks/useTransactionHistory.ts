// File: src/hooks/useTransactionHistory.ts

import { useInfiniteQuery } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Define the structure of the data returned from the Cloud Function
interface TransactionHistoryResponse {
  status: 'success';
  transactions: Transaction[]; // Using the Transaction type defined in TransactionHistoryList
  lastDocId: string | null;
  hasMore: boolean;
}

// Get a reference to the Cloud Function
const functions = getFunctions();
const getTransactionHistoryFn = httpsCallable<
  { limit: number; startAfterDocId?: string | null },
  TransactionHistoryResponse
>(functions, 'getTransactionHistory');


// The custom hook
export const useTransactionHistory = (limit: number) => {
  return useInfiniteQuery({
    queryKey: ['transactionHistory'], // Unique key for this query
    queryFn: async ({ pageParam = null }) => {
      // pageParam will be the lastDocId for pagination
      const result = await getTransactionHistoryFn({ limit, startAfterDocId: pageParam });
      return result.data;
    },
    getNextPageParam: (lastPage) => {
      // Return the lastDocId to be used as the next pageParam
      // If hasMore is false or lastDocId is null, return undefined to stop fetching
      return lastPage.hasMore ? lastPage.lastDocId : undefined;
    },
  });
};