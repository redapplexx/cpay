import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Clock } from 'lucide-react';

export const KycPendingCard = () => (
    <Card className="border-amber-500/50 bg-amber-500/10">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="bg-amber-500/10 p-3 rounded-full border border-amber-500/20">
                <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
                <CardTitle className="text-xl text-amber-900 dark:text-amber-300">Verification in Progress</CardTitle>
                <CardDescription className="text-amber-800 dark:text-amber-400">
                    Your documents are currently under review.
                </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                We are reviewing the documents you submitted. This usually takes 1-2 business days. We will notify you once the process is complete. Thank you for your patience.
            </p>
        </CardContent>
    </Card>
);
