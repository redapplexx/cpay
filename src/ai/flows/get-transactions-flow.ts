'use server';
/**
 * @fileOverview Retrieves a user's transaction history from Firestore.
 *
 * - getTransactions - A function that returns a list of transactions.
 * - GetTransactionsInput - The input for the getTransactions function.
 * - Transaction - The type for a single transaction.
 * - GetTransactionsOutput - The return type for the getTransactions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';


const TransactionSchema = z.object({
    id: z.string(),
    type: z.string().describe("The type of transaction (e.g., 'P2P Transfer', 'Cash In')."),
    direction: z.enum(['sent', 'received']).describe("The direction of the transaction."),
    party: z.string().describe("The other party in the transaction."),
    amount: z.number().describe("The transaction amount."),
    currency: z.enum(['PHP', 'KRW', 'USD']).describe("The currency of the transaction."),
    date: z.string().describe("The ISO 8601 date string of when the transaction occurred."),
    icon: z.enum(['Users', 'ShoppingCart', 'Landmark', 'Globe', 'ReceiptText', 'Signal']).describe("The icon identifier for the transaction type."),
    status: z.enum(['Completed', 'Pending', 'Failed']).describe("The status of the transaction."),
    ipAddress: z.string().optional().describe("The IP address used for the transaction."),
    fxDetails: z.object({
        rate: z.number(),
        sourceAmount: z.number(),
        targetAmount: z.number(),
        sourceCurrency: z.string(),
        targetCurrency: z.string(),
    }).optional().describe("Foreign exchange details, if applicable."),
});
export type Transaction = z.infer<typeof TransactionSchema>;

const GetTransactionsInputSchema = z.object({
    userId: z.string().describe("The ID of the user whose transactions are being fetched."),
});
export type GetTransactionsInput = z.infer<typeof GetTransactionsInputSchema>;


const GetTransactionsOutputSchema = z.array(TransactionSchema);
export type GetTransactionsOutput = z.infer<typeof GetTransactionsOutputSchema>;


export async function getTransactions(input: GetTransactionsInput): Promise<GetTransactionsOutput> {
  return getTransactionsFlow(input);
}

const getTransactionsFlow = ai.defineFlow(
  {
    name: 'getTransactionsFlow',
    inputSchema: GetTransactionsInputSchema,
    outputSchema: GetTransactionsOutputSchema,
  },
  async (input) => {
    if (!input.userId) {
        return [];
    }

    const transactionsRef = collection(db, 'transactions');
    const q = query(
        transactionsRef, 
        where("userId", "==", input.userId),
        orderBy("date", "desc"),
        limit(20) // Limit to the last 20 transactions for performance
    );

    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firestore Timestamp to ISO string
        const date = (data.date as Timestamp)?.toDate().toISOString() || new Date().toISOString();
        
        // Ensure all required fields are present with defaults
        transactions.push({
            id: doc.id,
            type: data.type || 'Unknown',
            direction: data.direction || 'sent',
            party: data.party || 'Unknown Party',
            amount: data.amount || 0,
            currency: data.currency || 'PHP',
            date: date,
            icon: data.icon || 'Users',
            status: data.status || 'Completed',
            ipAddress: data.ipAddress,
            fxDetails: data.fxDetails,
        });
    });

    return transactions;
  }
);
