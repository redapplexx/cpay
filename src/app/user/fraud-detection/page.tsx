import { FraudDetectionForm } from '@/components/ai/FraudDetectionForm';
import { Shield } from 'lucide-react';

export default function FraudDetectionPage() {
  return (
    <div className="p-4 sm:p-6">
      <header className="mb-6 flex items-start gap-4">
        <div className="bg-primary/10 text-primary p-3 rounded-xl">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline text-primary">AI Fraud Detection</h1>
          <p className="text-muted-foreground max-w-2xl">
            This tool uses AI to analyze transaction patterns for anomalies. Input transaction and
            user data in JSON format to get a fraud risk assessment.
          </p>
        </div>
      </header>
      <FraudDetectionForm />
    </div>
  );
}
