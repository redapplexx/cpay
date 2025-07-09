
// /partner-portal/src/app/(dashboard)/onboarding/page.tsx
'use client';

import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { AnimatedPageWrapper } from '@/components/ui/AnimatedPageWrapper';

export default function OnboardingPage() {
  return (
    <AnimatedPageWrapper>
      <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-headline text-white">Partner Onboarding</h1>
          <p className="text-muted-foreground mt-2">Complete the following steps to activate your partner account.</p>
      </div>
      <OnboardingWizard />
    </AnimatedPageWrapper>
  );
}
