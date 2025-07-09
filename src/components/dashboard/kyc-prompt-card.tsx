import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserCheck } from 'lucide-react';
import Link from 'next/link';

export const KycPromptCard = () => (
    <Card className="border-primary/50 bg-accent">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle className="text-xl">Complete Your Verification</CardTitle>
                <CardDescription>
                    Unlock higher transaction limits and access all features.
                </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
             <Button asChild className="w-full sm:w-auto">
                <Link href="/dashboard/kyc">
                    Get Verified Now
                </Link>
            </Button>
        </CardContent>
    </Card>
);
