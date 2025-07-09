
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import Link from 'next/link';

export const MerchantOnboardingPromptCard = () => (
    <Card className="border-primary/50 bg-accent max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
                <CardTitle className="text-xl">Become a CPay Merchant</CardTitle>
                <CardDescription>
                    Register your business to accept payments, track sales, and grow your customer base.
                </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
             <Button asChild className="w-full sm:w-auto">
                <Link href="/dashboard/business/onboarding">
                    Register My Business
                </Link>
            </Button>
        </CardContent>
    </Card>
);

