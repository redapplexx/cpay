import { FinancialAdviceForm } from '@/components/ai/FinancialAdviceForm';
import { Sparkles } from 'lucide-react';

export default function FinancialAdvicePage() {
  return (
    <div className="p-4 sm:p-6">
      <header className="mb-6 flex items-start gap-4">
        <div className="bg-primary/10 text-primary p-3 rounded-xl">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline text-primary">AI Financial Advisor</h1>
          <p className="text-muted-foreground max-w-2xl">
            Get personalized financial advice based on your transaction history and profile. The
            more accurate the data, the better the advice.
          </p>
        </div>
      </header>
      <FinancialAdviceForm />
    </div>
  );
}
