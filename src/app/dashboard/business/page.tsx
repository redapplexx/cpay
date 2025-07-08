'use client';

import { MerchantOnboardingPromptCard } from '@/components/dashboard/merchant-onboarding-prompt-card';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

// This would be the merchant's dashboard, showing sales, payouts, etc.
const MerchantDashboard = () => (
    <div>
        <h1 className="text-3xl font-bold tracking-tighter">
            Merchant Dashboard
        </h1>
        <p className="text-muted-foreground">This is where merchant-specific data would be displayed.</p>
        {/* Placeholder for charts, transaction lists, etc. */}
    </div>
);


export default function BusinessPage() {
  const { userAccount, isLoading } = useAuth();
  
  if (isLoading || !userAccount) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-48 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
        {userAccount.profile.isMerchant ? <MerchantDashboard /> : <MerchantOnboardingPromptCard />}
    </div>
  );
}
