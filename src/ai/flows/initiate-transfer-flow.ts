'use server';
/**
 * @fileOverview Simulates a P2P money transfer and records it in Firestore. Includes a fraud check.
 *
 * - initiateTransfer - A function that handles the transfer process.
 * - InitiateTransferInput - The input type for the initiateTransfer function.
 * - InitiateTransferOutput - The return type for the initiateTransfer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const InitiateTransferInputSchema = z.object({
  userId: z.string().describe("The ID of the user initiating the transfer."),
  recipientMobile: z.string().describe("The recipient's mobile number."),
  amount: z.number().min(1, 'Amount must be greater than 0.').describe('The amount to transfer.'),
  notes: z.string().optional().describe('Optional notes for the transaction.'),
});
export type InitiateTransferInput = z.infer<typeof InitiateTransferInputSchema>;

const InitiateTransferOutputSchema = z.object({
    transactionId: z.string().describe("The unique ID for the transaction."),
    status: z.enum(['SUCCESS', 'FAILED', 'PENDING', 'FLAGGED']).describe("The status of the transaction."),
    message: z.string().describe("A message describing the result of the transaction."),
});
export type InitiateTransferOutput = z.infer<typeof InitiateTransferOutputSchema>;

export async function initiateTransfer(input: InitiateTransferInput): Promise<InitiateTransferOutput> {
  return initiateTransferFlow(input);
}


// A simple tool to simulate a real-time fraud check.
const checkForFraudFlags = ai.defineTool(
    {
        name: 'checkForFraudFlags',
        description: 'Checks a transaction for common fraud indicators.',
        inputSchema: z.object({
            amount: z.number(),
            recipientMobile: z.string(),
        }),
        outputSchema: z.object({
            isHighRisk: z.boolean(),
            reason: z.string(),
        }),
    },
    async (input) => {
        // Rule 1: High amount
        if (input.amount > 50000) {
            return { isHighRisk: true, reason: 'Transaction amount exceeds the single transaction limit.' };
        }
        // Rule 2: Known suspicious recipient (for demo purposes)
        if (input.recipientMobile === '09876543210') {
            return { isHighRisk: true, reason: 'Recipient account has been flagged for suspicious activity.' };
        }
        return { isHighRisk: false, reason: 'No immediate fraud indicators found.' };
    }
);


// This flow simulates initiating a P2P transfer
const initiateTransferFlow = ai.defineFlow(
  {
    name: 'initiateTransferFlow',
    inputSchema: InitiateTransferInputSchema,
    outputSchema: InitiateTransferOutputSchema,
  },
  async (input) => {
    console.log('Initiating transfer:', input);
    
    // Step 1: Run the real-time fraud check
    const fraudCheck = await checkForFraudFlags({
        amount: input.amount,
        recipientMobile: input.recipientMobile,
    });

    if (fraudCheck.isHighRisk) {
        // Transaction is flagged, do not proceed and notify the user.
        return {
            transactionId: '',
            status: 'FLAGGED',
            message: `Transaction Under Review. Reason: ${fraudCheck.reason}`,
        };
    }

    // Step 2: If no fraud flags, proceed with the transfer
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newTransactionRef = await addDoc(collection(db, 'transactions'), {
        userId: input.userId,
        type: 'P2P Transfer',
        direction: 'sent',
        party: input.recipientMobile,
        amount: input.amount,
        currency: 'PHP',
        date: serverTimestamp(),
        icon: 'Users',
        status: 'Completed',
        notes: input.notes || null,
        ipAddress: '192.168.1.1', // Mock IP
    });


    return {
        transactionId: newTransactionRef.id,
        status: 'SUCCESS',
        message: `Successfully sent PHP ${input.amount.toFixed(2)} to ${input.recipientMobile}.`,
    };
  }
);