import { KycForm } from '@/components/dashboard/kyc-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function KycPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Verification</CardTitle>
          <CardDescription>
            Follow the steps to submit your information. Our AI will analyze your
            documents to securely verify your identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KycForm />
        </CardContent>
      </Card>
    </div>
  );
}
