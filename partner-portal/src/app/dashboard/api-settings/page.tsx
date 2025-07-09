// partner-portal/src/app/dashboard/api-settings/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, AlertTriangle, Download, Copy } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { firebaseApp } from '@/lib/firebase';
import { AnimatedPageWrapper } from '@/components/ui/AnimatedPageWrapper';

const functions = getFunctions(firebaseApp, 'asia-southeast1'); // Specify region if needed
const getApiCredentialsFn = httpsCallable(functions, 'partner-getApiCredentials');
const regenerateKeyFn = httpsCallable(functions, 'partner-regenerateApiKey');
const setEnvironmentFn = httpsCallable(functions, 'partner-setPartnerEnvironment');

type ApiCredentialsData = {
  test: { merchantId: string; sha256Key: string; };
  production: { merchantId: string; sha256Key: string; };
  apiDocsUrl?: string;
  postmanCollectionUrl?: string;
  environment: 'SANDBOX' | 'LIVE';
};

export default function PartnerApiSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (error || !data) {
    return <div>Error loading API settings: {error ? (error as Error).message : 'Data is not available'}</div>;
  }
  
  const { environment, apiDocsUrl, postmanCollectionUrl, test, production } = data;

  return (
    <AnimatedPageWrapper>
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
                        disabled={envMutation.isPending}
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
                {apiDocsUrl && (
                    <Button asChild variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:text-white transition-colors duration-200">
                        <a href={apiDocsUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" /> Download API Docs
                        </a>
                    </Button>
                )}
                {postmanCollectionUrl && (
                    <Button asChild variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:text-white transition-colors duration-200">
                        <a href={postmanCollectionUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" /> Download Postman Collection
                        </a>
                    </Button>
                )}
                {!apiDocsUrl && !postmanCollectionUrl && (
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
                  <p className="font-mono text-lg text-primary-foreground select-all">{test.merchantId}</p>
                  <p className="text-sm text-gray-400 mt-4">SHA256 Key</p>
                  <p className="font-mono text-lg text-primary-foreground select-all">{test.sha256Key}</p>
                   <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive" className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold" disabled={regenMutation.isPending}>Regenerate Key</Button></AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                          <AlertDialogHeader><AlertDialogTitle className="text-xl text-white">Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription className="text-gray-300">Regenerating the SHA256 key will invalidate the current key immediately.
                            Ensure your integration uses the new key to avoid service interruptions.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRegenerate('test')} disabled={regenMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">Continue</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </CardContent>
          </Card>
          <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
              <CardHeader><CardTitle className="text-xl">Live Credentials</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-sm text-gray-400">Merchant ID</p>
                  <p className="font-mono text-lg text-primary-foreground select-all">{production.merchantId}</p>
                  <p className="text-sm text-gray-400 mt-4">SHA256 Key</p>
                  <p className="font-mono text-lg text-primary-foreground select-all">{production.sha256Key}</p>
                   <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive" className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold" disabled={regenMutation.isPending}>Regenerate Key</Button></AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                           <AlertDialogHeader><AlertDialogTitle className="text-xl text-white">DANGER: Regenerate LIVE Key?</AlertDialogTitle><AlertDialogDescription className="text-gray-300">This will break your live integration until you update the key. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                           <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRegenerate('production')} disabled={regenMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">I understand, regenerate live key</AlertDialogAction>
                           </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </CardContent>
          </Card>
      </div>
    </AnimatedPageWrapper>
  );
}
