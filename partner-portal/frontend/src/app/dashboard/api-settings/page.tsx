// partner-portal/frontend/src/app/dashboard/api-settings/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

import { PartnerDashboardLayout } from '@/components/partner/PartnerDashboardLayout'; // Assuming a dashboard layout
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Initialize Firebase Auth
import { firebaseApp } from '@/lib/firebase'; 
const auth = getAuth(firebaseApp);

const functions = getFunctions(firebaseApp);
const getApiCredentialsFn = httpsCallable(functions, 'getPartnerApiCredentials');
const regenerateKeyFn = httpsCallable(functions, 'regeneratePartnerSha256Key');
const setEnvironmentFn = httpsCallable(functions, 'setPartnerEnvironment');

type ApiCredentials = {
  test: { merchantId: string; sha256Key: string; };
  production: { merchantId: string; sha256Key: string; };
  apiDocsUrl?: string;
  postmanCollectionUrl?: string;
};

type Environment = 'SANDBOX' | 'LIVE';

export default function PartnerApiSettingsPage() {
  const queryClient = useQueryClient();
  const [showNewKey, setShowNewKey] = useState<{ env: 'test' | 'production'; key: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['partnerApiCredentials'],
    queryFn: async () => {
      const result = await getApiCredentialsFn();
      return result.data as { apiCredentials: ApiCredentials; environment: Environment };
    },
  });

  const { mutate: regenerateKey, isLoading: isRegenerating } = useMutation({
    mutationFn: (env: 'test' | 'production') => regenerateKeyFn({ env }),
    onSuccess: (result, env) => {
      const newKey = (result.data as any).newKey; // Backend returns the new key
      setShowNewKey({ env, key: newKey });
      toast({ title: 'Key Regenerated', description: `New ${env} SHA256 key generated successfully.` });
      queryClient.invalidateQueries({ queryKey: ['partnerApiCredentials'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const { mutate: setEnvironment, isLoading: isSettingEnvironment } = useMutation({
    mutationFn: (env: Environment) => setEnvironmentFn({ environment: env }),
    onSuccess: (_, env) => {
      toast({ title: 'Environment Changed', description: `Switched to ${env} environment.` });
      queryClient.invalidateQueries({ queryKey: ['partnerApiCredentials'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return <PartnerDashboardLayout><div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin" /></div></PartnerDashboardLayout>;
  }

  if (error) {
    return <PartnerDashboardLayout><div>Error loading API settings: {(error as Error).message}</div></PartnerDashboardLayout>;
  }

  const { apiCredentials, environment } = data!;

  return (
    <PartnerDashboardLayout>
      <h1 className="text-2xl font-bold mb-4">API Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Environment Settings</CardTitle>
          <CardDescription>Toggle between Sandbox and Live environments.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          <Label htmlFor="environment-toggle">Sandbox</Label>
          <Switch
            id="environment-toggle"
            checked={environment === 'LIVE'}
            onCheckedChange={(checked) => setEnvironment(checked ? 'LIVE' : 'SANDBOX')}
            disabled={isSettingEnvironment}
          />
          <Label htmlFor="environment-toggle">Live</Label>
          {isSettingEnvironment && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardContent>
        {environment === 'LIVE' && (
            <CardFooter className="text-sm text-red-500 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2"/> You are currently operating in LIVE environment. Use with caution.
            </CardFooter>
        )}
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>Your unique Merchant IDs and SHA256 Keys for API authentication.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Environment Credentials */}
          <div className="border rounded-md p-4 bg-gray-50">
            <h3 className="font-semibold text-lg mb-2">Sandbox Credentials</h3>
            <p><strong>Merchant ID:</strong> {apiCredentials.test.merchantId}</p>
            <p className="flex items-center"><strong>SHA256 Key:</strong> {showNewKey?.env === 'test' ? showNewKey.key : apiCredentials.test.sha256Key}
            {showNewKey?.env === 'test' && <span className="text-xs text-green-600 ml-2">(New)</span>}
            </p>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-2" disabled={isRegenerating}> 
                        <RefreshCw className="mr-2 h-3 w-3" /> Regenerate Test Key
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Regenerating the SHA256 key will invalidate the current key immediately.
                            Ensure your integration uses the new key to avoid service interruptions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => regenerateKey('test')} disabled={isRegenerating}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Production Environment Credentials */}
          <div className="border rounded-md p-4 bg-gray-50">
            <h3 className="font-semibold text-lg mb-2">Live Credentials</h3>
            <p><strong>Merchant ID:</strong> {apiCredentials.production.merchantId}</p>
            <p className="flex items-center"><strong>SHA256 Key:</strong> {showNewKey?.env === 'production' ? showNewKey.key : apiCredentials.production.sha256Key}
            {showNewKey?.env === 'production' && <span className="text-xs text-green-600 ml-2">(New)</span>}
            </p>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-2" disabled={isRegenerating}> 
                        <RefreshCw className="mr-2 h-3 w-3" /> Regenerate Live Key
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Regenerating the SHA256 key for PRODUCTION will invalidate the current key immediately.
                            This will affect live payouts and must be coordinated with your integration team.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => regenerateKey('production')} disabled={isRegenerating}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>Download our comprehensive API documents and Postman collections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {apiCredentials.apiDocsUrl && (
            <Button asChild variant="outline">
              <a href={apiCredentials.apiDocsUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" /> Download API Docs
              </a>
            </Button>
          )}
          {apiCredentials.postmanCollectionUrl && (
            <Button asChild variant="outline">
              <a href={apiCredentials.postmanCollectionUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" /> Download Postman Collection
              </a>
            </Button>
          )}
          {!apiCredentials.apiDocsUrl && !apiCredentials.postmanCollectionUrl && (
            <p className="text-muted-foreground text-sm">No documentation links available yet.</p>
          )}
        </CardContent>
      </Card>
    </PartnerDashboardLayout>
  );
}
