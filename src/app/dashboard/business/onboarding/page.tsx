
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MerchantOnboardingForm } from '@/components/dashboard/merchant-onboarding-form';

export default function MerchantOnboardingPage() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Merchant Registration</CardTitle>
        <CardDescription>
          Follow the steps to register your business. Our AI will analyze your
          documents to securely verify your business identity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MerchantOnboardingForm />
      </CardContent>
    </Card>
  );
}
