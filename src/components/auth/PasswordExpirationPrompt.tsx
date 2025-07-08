'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const functions = getFunctions();
const checkPasswordExpirationFn = httpsCallable<{}><{ expired: boolean }>(functions, 'checkPasswordExpiration');

export function PasswordExpirationPrompt() {
  // Manage deferred state locally for demonstration.
  // In a real app, this might be stored on the backend per user.
  const [deferred, setDeferred] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['passwordExpiration'],
    queryFn: async () => {
      const result = await checkPasswordExpirationFn();
      return result.data;
    },
    // Only fetch if not deferred
    enabled: !deferred,
    // Refetch periodically to check again if deferred
    refetchInterval: deferred ? 24 * 60 * 60 * 1000 : false, // Check daily if deferred
  });

  // Don't show the prompt if loading, error, deferred, or not expired
  if (isLoading || isError || deferred || !data?.expired) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-yellow-600 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Password Expiring
          </CardTitle>
          <CardDescription>
            Your password is old and should be updated for security.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            For your account security, please update your password. You can do this now or defer for later.
          </p>
          <div className="flex space-x-4">
            {/* Link to your actual password change page */}
            <Link href="/settings/change-password" className="w-full">
              <Button className="w-full">Change Password</Button>
            </Link>
            <Button variant="outline" onClick={() => setDeferred(true)}>
              Defer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}