'use server';

/**
 * @fileOverview Analyzes KYB documents and business information for verification.
 *
 * - kybDocumentAnalyzer - A function that handles the KYB document analysis process.
 * - KybDocumentAnalyzerInput - The input type for the kybDocumentAnalyzer function.
 * - KybDocumentAnalyzerOutput - The return type for the kybDocumentAnalyzer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const KybDocumentAnalyzerInputSchema = z.object({
  businessName: z.string().describe("The legal name of the business."),
  businessType: z.string().describe("The type of business (e.g., Sole Proprietorship, Corporation)."),
  registrationNumber: z.string().describe("The official business registration number (e.g., SEC, DTI)."),
  businessAddress: z.string().describe("The registered physical address of the business."),
  documentDataUri: z
    .string()
    .describe(
      'A business registration document image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type KybDocumentAnalyzerInput = z.infer<typeof KybDocumentAnalyzerInputSchema>;

const KybDocumentAnalyzerOutputSchema = z.object({
  verificationStatus: z.enum(['VERIFIED', 'PENDING_REVIEW', 'REJECTED']).describe("The final verification status of the business."),
  discrepancies: z.string().describe('A summary of any discrepancies found between the provided data and the document. Should be "None" if no issues are found.'),
  riskScore: z.number().min(0).max(1).describe('A calculated risk score for the business, from 0 (low risk) to 1 (high risk).'),
  summary: z.string().describe("A brief summary of the verification results."),
});
export type KybDocumentAnalyzerOutput = z.infer<typeof KybDocumentAnalyzerOutputSchema>;

export async function kybDocumentAnalyzer(input: KybDocumentAnalyzerInput): Promise<KybDocumentAnalyzerOutput> {
  return kybDocumentAnalyzerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'kybDocumentAnalyzerPrompt',
  input: {schema: KybDocumentAnalyzerInputSchema},
  output: {schema: KybDocumentAnalyzerOutputSchema},
  prompt: `You are an expert in KYB (Know Your Business) compliance for financial institutions in the Philippines.

You will receive information about a business and a scanned copy of their registration document. Your task is to analyze these materials, verify the information, identify any discrepancies, and provide a verification decision and risk score.

Business Information Provided:
- Business Name: {{{businessName}}}
- Business Type: {{{businessType}}}
- Registration Number: {{{registrationNumber}}}
- Business Address: {{{businessAddress}}}

Registration Document:
{{media url=documentDataUri}}

Instructions:
1.  Extract all relevant information from the registration document.
2.  Compare the extracted information with the user-provided business information.
3.  Based on the comparison, determine a 'verificationStatus'. If all data matches perfectly, set it to 'VERIFIED'. If there are minor issues or the document is unclear, set it to 'PENDING_REVIEW'. If there are major mismatches, set it to 'REJECTED'.
4.  Detail any mismatches in the 'discrepancies' field. If everything matches, this should be "None".
5.  Calculate a 'riskScore' between 0 and 1. A lower score indicates a more trustworthy, verifiable business.
6.  Provide a concise 'summary' of your findings.
`,
});

const kybDocumentAnalyzerFlow = ai.defineFlow(
  {
    name: 'kybDocumentAnalyzerFlow',
    inputSchema: KybDocumentAnalyzerInputSchema,
    outputSchema: KybDocumentAnalyzerOutputSchema,
  },
  async input => {
    // In a real scenario, you might add steps here to check against a government database API.
    const {output} = await prompt(input);
    return output!;
  }
);
