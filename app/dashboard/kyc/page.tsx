'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function KYCPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>KYC Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">To unlock all features, please complete your Know Your Customer (KYC) verification.</p>
          <Button variant="default" disabled>Start KYC (Coming Soon)</Button>
        </CardContent>
      </Card>
    </div>
  );
} 