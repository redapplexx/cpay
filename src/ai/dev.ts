'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/kyc-document-analyzer.ts';
import '@/ai/flows/fx-quote-flow.ts';
import '@/ai/flows/initiate-transfer-flow.ts';
import '@/ai/flows/get-transactions-flow.ts';
import '@/ai/flows/initiate-remittance-flow.ts';
import '@/ai/flows/cash-out-flow.ts';
import '@/ai/flows/pay-bill-flow.ts';
import '@/ai/flows/e-load-flow.ts';
import '@/ai/flows/initiate-payment-flow.ts';
import '@/ai/flows/kyb-document-analyzer.ts';
import '@/ai/flows/ask-ai-assistant-flow.ts';
import '@/ai/flows/financial-advisor-flow.ts';
import '@/ai/flows/generate-financial-advice-flow.ts';
