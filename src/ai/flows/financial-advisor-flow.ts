'use server';
/**
 * @fileOverview Fetches pre-computed AI-driven financial advice from Firestore.
 *
 * - getFinancialAdvice - A function that returns the latest financial summary.
 * - FinancialAdviceInput - The input type for the getFinancialAdvice function.
 * - FinancialAdviceOutput - The return type for the getFinancialAdvice function (or null).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';


const FinancialAdviceInputSchema = z.object({
  userId: z.string().describe("The user's ID."),
});
export type FinancialAdviceInput = z.infer<typeof FinancialAdviceInputSchema>;

const FinancialAdviceOutputSchema = z.object({
  summary: z.string().describe("A one-sentence summary of the user's spending behavior for the period."),
  topCategory: z.string().describe("The spending category with the highest total amount."),
  advice: z.string().describe("A short, actionable piece of financial advice for the user based on their spending."),
  generatedAt: z.string().optional().describe("The ISO date string of when the advice was generated."),
});
export type FinancialAdviceOutput = z.infer<typeof FinancialAdviceOutputSchema>;

export async function getFinancialAdvice(input: FinancialAdviceInput): Promise<FinancialAdviceOutput | null> {
  return getFinancialAdviceFlow(input);
}

const getFinancialAdviceFlow = ai.defineFlow(
  {
    name: 'getFinancialAdviceFlow',
    inputSchema: FinancialAdviceInputSchema,
    outputSchema: z.nullable(FinancialAdviceOutputSchema),
  },
  async (input) => {
    const insightsRef = collection(db, 'users', input.userId, 'ai_insights');
    const q = query(insightsRef, orderBy("generatedAt", "desc"), limit(1));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const latestInsightDoc = querySnapshot.docs[0];
    const data = latestInsightDoc.data();
    
    return {
        summary: data.summary,
        topCategory: data.topCategory,
        advice: data.advice,
        generatedAt: (data.generatedAt as Timestamp)?.toDate().toISOString(),
    };
  }
);
