// src/app/onboarding/phase2/page.tsx
'use client';

import { Phase2KYCForm } from '@/components/onboarding/Phase2KYCForm';
import { AuthWrapper } from '@/components/layout/AuthWrapper'; // Assuming you have a layout wrapper

export default function Phase2OnboardingPage() {
  return (
    <AuthWrapper>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-4">Complete Your Profile</h1>
        <p className="text-muted-foreground mb-8">
          Please provide the following information to unlock all features.
        </p>
        <Phase2KYCForm />
      </div>
    </AuthWrapper>
  );
}
