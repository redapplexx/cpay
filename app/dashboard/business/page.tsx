'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BusinessDashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Business Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">Business dashboard features will be available soon.</p>
          <Button variant="default" disabled>Coming Soon</Button>
        </CardContent>
      </Card>
    </div>
  );
} 