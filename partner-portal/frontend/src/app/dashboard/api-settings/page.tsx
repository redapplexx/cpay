// partner-portal/frontend/src/app/dashboard/api-settings/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
<<<<<<< HEAD

import { PartnerDashboardLayout } from '@/components/partner/PartnerDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, AlertTriangle, Download, Copy } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { firebaseApp } from '@/lib/firebase';

const functions = getFunctions(firebaseApp);
const getApiCredentialsFn = httpsCallable(functions, 'getApiCredentials');
const regenerateKeyFn = httpsCallable(functions, 'regenerateApiKey');
const setEnvironmentFn = httpsCallable(functions, 'setPartnerEnvironment');

type ApiCredentialsData = {
=======
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
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
  test: { merchantId: string; sha256Key: string; };
  production: { merchantId: string; sha256Key: string; };
  apiDocsUrl?: string;
  postmanCollectionUrl?: string;
<<<<<<< HEAD
  environment: 'SANDBOX' | 'LIVE';
};

export default function PartnerApiSettingsPage() {
  const queryClient = useQueryClient();
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<ApiCredentialsData>({
    queryKey: ['partnerApiCredentials'],
    queryFn: async () => (await getApiCredentialsFn()).data as ApiCredentialsData,
  });

  const regenMutation = useMutation({
    mutationFn: (env: 'test' | 'production') => regenerateKeyFn({ env }),
    onSuccess: (result: any) => {
      setNewKeyValue(result.data.newKey);
      toast({ title: "API Key Regenerated", description: "Your new key is now active. Please update your integration." });
      queryClient.invalidateQueries({ queryKey: ['partnerApiCredentials'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const envMutation = useMutation({
    mutationFn: (environment: 'SANDBOX' | 'LIVE') => setEnvironmentFn({ environment }),
    onSuccess: (_, environment) => {
        toast({ title: "Environment Changed", description: `Switched to ${environment} environment.` });
        queryClient.invalidateQueries({ queryKey: ['partnerApiCredentials'] });
    },
    onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
  
  const handleRegenerate = (env: 'test' | 'production') => {
    setNewKeyValue(null); // Clear previous new key
    regenMutation.mutate(env);
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "API Key copied to clipboard." });
  };

  if (isLoading) {
    return <PartnerDashboardLayout><div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div></PartnerDashboardLayout>;
=======
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
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
  }

  if (error) {
    return <PartnerDashboardLayout><div>Error loading API settings: {(error as Error).message}</div></PartnerDashboardLayout>;
  }

  const { apiCredentials, environment } = data!;

  return (
    <PartnerDashboardLayout>
<<<<<<< HEAD
      <h1 className="text-3xl font-bold mb-6 text-white">API & Environment Settings</h1>

      {newKeyValue && (
        <Card className="mb-6 border border-green-500 bg-gray-800 text-white shadow-lg">
            <CardHeader>
                <CardTitle className="text-green-400 text-xl">New API Key Generated</CardTitle>
                <CardDescription className="text-gray-300">Please copy this key now. It will not be shown again.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center space-x-2">
                <code className="p-3 bg-gray-900 rounded font-mono text-sm break-all flex-1 select-all">{newKeyValue}</code>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(newKeyValue)} className="text-gray-400 hover:text-white"><Copy className="h-5 w-5" /></Button>
            </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl">Environment</CardTitle>
                <CardDescription className="text-gray-300">Toggle between Sandbox for testing and Live for real transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between space-x-4">
                    <Label htmlFor="environment-toggle" className="text-gray-200">Sandbox / Live</Label>
                    <Switch 
                        id="environment-toggle"
                        checked={environment === 'LIVE'}
                        onCheckedChange={(isChecked) => envMutation.mutate(isChecked ? 'LIVE' : 'SANDBOX')}
                        disabled={envMutation.isLoading}
                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-600"
                    />
                </div>
            </CardContent>
            {environment === 'LIVE' && (
                <CardFooter className="text-sm text-yellow-500 flex items-center border-t border-gray-700 pt-4 mt-4">
                    <AlertTriangle className="h-4 w-4 mr-2"/> You are currently operating in the LIVE environment. Use with caution.
                </CardFooter>
            )}
        </Card>

        <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl">API Documentation</CardTitle>
                <CardDescription className="text-gray-300">Get the resources you need to integrate successfully.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-3">
                {apiCredentials.apiDocsUrl && (
                    <Button asChild variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:text-white transition-colors duration-200">
                        <a href={apiCredentials.apiDocsUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" /> Download API Docs
                        </a>
                    </Button>
                )}
                {apiCredentials.postmanCollectionUrl && (
                    <Button asChild variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:text-white transition-colors duration-200">
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
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
              <CardHeader><CardTitle className="text-xl">Sandbox Credentials</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-sm text-gray-400">Merchant ID</p>
                  <p className="font-mono text-lg text-primary-foreground select-all">{apiCredentials.test.merchantId}</p>
                  <p className="text-sm text-gray-400 mt-4">SHA256 Key</p>
                  <p className="font-mono text-lg text-primary-foreground select-all">{apiCredentials.test.sha256Key}</p>
                   <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive" className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold" disabled={regenMutation.isLoading}>Regenerate Key</Button></AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                          <AlertDialogHeader><AlertDialogTitle className="text-xl text-white">Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription className="text-gray-300">Regenerating the SHA256 key will invalidate the current key immediately.
                            Ensure your integration uses the new key to avoid service interruptions.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRegenerate('test')} disabled={regenMutation.isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">Continue</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </CardContent>
          </Card>
          <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
              <CardHeader><CardTitle className="text-xl">Live Credentials</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-sm text-gray-400">Merchant ID</p>
                  <p className="font-mono text-lg text-primary-foreground select-all">{apiCredentials.production.merchantId}</p>
                  <p className="text-sm text-gray-400 mt-4">SHA256 Key</p>
                  <p className="font-mono text-lg text-primary-foreground select-all">{apiCredentials.production.sha256Key}</p>
                   <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive" className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold" disabled={regenMutation.isLoading}>Regenerate Key</Button></AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                           <AlertDialogHeader><AlertDialogTitle className="text-xl text-white">DANGER: Regenerate LIVE Key?</AlertDialogTitle><AlertDialogDescription className="text-gray-300">This will break your live integration until you update the key. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                           <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRegenerate('production')} disabled={regenMutation.isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">I understand, regenerate live key</AlertDialogAction>
                           </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </CardContent>
          </Card>
      </div>
=======
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
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
    </PartnerDashboardLayout>
  );
}
