'use server';
/**
 * @fileOverview An AI assistant that can answer questions about a user's transaction history and perform actions.
 *
 * - askAiAssistant - A function that handles user queries about their finances.
 * - AskAiAssistantInput - The input type for the askAiAssistant function.
 * - AskAiAssistantOutput - The return type for the askAiAssistant function.
 */

import {ai} from '@/ai/genkit';
import {getTransactions} from '@/ai/flows/get-transactions-flow';
import {initiateTransfer, InitiateTransferInputSchema} from '@/ai/flows/initiate-transfer-flow';
import {z} from 'genkit';

const AskAiAssistantInputSchema = z.object({
  userId: z.string().describe("The user's ID."),
  query: z.string().describe("The user's question about their finances."),
});
export type AskAiAssistantInput = z.infer<typeof AskAiAssistantInputSchema>;

const AskAiAssistantOutputSchema = z
  .string()
  .describe("The AI assistant's helpful response, which may include the result of a performed action.");
export type AskAiAssistantOutput = z.infer<typeof AskAiAssistantOutputSchema>;

export async function askAiAssistant(
  input: AskAiAssistantInput
): Promise<AskAiAssistantOutput> {
  return askAiAssistantFlow(input);
}

// Define a tool that the AI can use to send money.
const sendMoneyTool = ai.defineTool(
    {
        name: 'sendMoney',
        description: 'Initiates a P2P (peer-to-peer) money transfer to another CPay user using their mobile number. Use this tool for requests like "send", "transfer", or "pay" someone.',
        inputSchema: InitiateTransferInputSchema,
        outputSchema: z.string().describe('A confirmation message describing the result of the transfer, which should be relayed to the user.'),
    },
    async (input) => {
        const result = await initiateTransfer(input);
        return result.message;
    }
);


const askAiAssistantFlow = ai.defineFlow(
  {
    name: 'askAiAssistantFlow',
    inputSchema: AskAiAssistantInputSchema,
    outputSchema: AskAiAssistantOutputSchema,
  },
  async (input) => {
    const transactions = await getTransactions({userId: input.userId});
    const transactionsString = transactions.length > 0 ? JSON.stringify(transactions, null, 2) : "No transactions available.";

    const {text} = await ai.generate({
      prompt: `You are a friendly and helpful financial assistant for an app called CPay.
        Your goal is to answer the user's questions based *only* on the transaction data provided below, or perform actions for them using the available tools.
        - When asked to perform an action like sending money, you MUST use the provided 'sendMoney' tool.
        - When using a tool, you must pass the user's ID: "${input.userId}". The user's query will not contain their own ID.
        - Do not make up information. If you cannot answer the question from the data or perform the action, say so politely.
        - Keep your answers concise and easy to understand.
        - Refer to the user in the second person (e.g., "You spent...").
        - After a tool is used successfully, confirm the action to the user based on the tool's output.
        
        Today's date is ${new Date().toDateString()}.

        Transaction History (JSON format):
        ${transactionsString}

        User's Question:
        "${input.query}"
        `,
        tools: [sendMoneyTool],
        model: 'googleai/gemini-2.0-flash',
    });

    return text;
  }
);