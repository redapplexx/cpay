'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Copy, Check, Eye, EyeOff, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { app as firebaseApp } from '@/lib/firebase';

const functions = getFunctions(firebaseApp, 'asia-southeast1');
const getApiCredentialsFn = httpsCallable(functions, 'partner-getApiCredentials');
const regenerateApiKeyFn = httpsCallable(functions, 'partner-regenerateApiKey');
const updateWebhookConfigFn = httpsCallable(functions, 'partner-updateWebhookConfig');

type ApiCredentials = {
    apiKey: string;
    secretKey: string;
    webhookSecret: string;
    webhookConfig: {
        sandboxUrl: string;
        liveUrl: string;
    };
    environment: 'sandbox' | 'live';
    createdAt: { toDate: () => Date };
    lastUsed: { toDate: () => Date };
};

const ApiCredentialsSection = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [showSecrets, setShowSecrets] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const { data: credentials, isLoading } = useQuery<ApiCredentials>({
        queryKey: ['apiCredentials'],
        queryFn: async () => (await getApiCredentialsFn()).data as ApiCredentials,
    });

    const regenerateMutation = useMutation({
        mutationFn: () => regenerateApiKeyFn(),
        onSuccess: (result: any) => {
            toast({ title: "API Key Regenerated", description: "Your new API key has been generated successfully." });
            queryClient.invalidateQueries({ queryKey: ['apiCredentials'] });
        },
        onError: (error: any) => {
            toast({ title: "Regeneration Failed", description: error.message, variant: "destructive" });
        }
    });

    const copyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            toast({ title: "Copied", description: `${fieldName} copied to clipboard.` });
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            toast({ title: "Copy Failed", description: "Failed to copy to clipboard.", variant: "destructive" });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }

    return (
        <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl">API Credentials</CardTitle>
                        <CardDescription className="text-gray-300">Your API keys for integration with CPay services.</CardDescription>
                    </div>
                    <Button 
                        onClick={() => setShowSecrets(!showSecrets)}
                        variant="outline"
                        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                    >
                        {showSecrets ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                        {showSecrets ? 'Hide' : 'Show'} Secrets
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">API Key</Label>
                        <div className="flex gap-2">
                            <Input 
                                value={showSecrets ? credentials?.apiKey : '••••••••••••••••••••••••••••••••'} 
                                readOnly 
                                className="bg-gray-700 border-gray-600 text-white font-mono"
                            />
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => copyToClipboard(credentials?.apiKey || '', 'API Key')}
                                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                            >
                                {copiedField === 'API Key' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">Secret Key</Label>
                        <div className="flex gap-2">
                            <Input 
                                value={showSecrets ? credentials?.secretKey : '••••••••••••••••••••••••••••••••'} 
                                readOnly 
                                className="bg-gray-700 border-gray-600 text-white font-mono"
                            />
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => copyToClipboard(credentials?.secretKey || '', 'Secret Key')}
                                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                            >
                                {copiedField === 'Secret Key' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Webhook Secret</Label>
                    <div className="flex gap-2">
                        <Input 
                            value={showSecrets ? credentials?.webhookSecret : '••••••••••••••••••••••••••••••••'} 
                            readOnly 
                            className="bg-gray-700 border-gray-600 text-white font-mono"
                        />
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => copyToClipboard(credentials?.webhookSecret || '', 'Webhook Secret')}
                            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                            {copiedField === 'Webhook Secret' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2">
                        <Badge variant={credentials?.environment === 'live' ? 'destructive' : 'secondary'}>
                            {credentials?.environment?.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-400">
                            Environment
                        </span>
                    </div>
                    <div className="text-sm text-gray-400">
                        Created: {credentials?.createdAt ? new Date(credentials.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-400">
                        Last Used: {credentials?.lastUsed ? new Date(credentials.lastUsed.toDate()).toLocaleDateString() : 'Never'}
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                    <Button 
                        onClick={() => regenerateMutation.mutate()}
                        disabled={regenerateMutation.isPending}
                        variant="destructive"
                        className="w-full"
                    >
                        {regenerateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate API Key
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        Warning: This will invalidate your current API key. Update your integration immediately.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

const WebhookConfigSection = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [config, setConfig] = useState({ sandboxUrl: '', liveUrl: '' });

    const { isLoading: isLoadingConfig } = useQuery({
        queryKey: ['partnerConfig'],
        queryFn: async () => {
            const result = await getApiCredentialsFn();
            const webhookConf = (result.data as any)?.webhookConfig || {};
            setConfig({ sandboxUrl: webhookConf.sandboxUrl || '', liveUrl: webhookConf.liveUrl || '' });
            return result.data;
        },
    });

    const mutation = useMutation({
        mutationFn: (newConfig: { sandboxUrl: string; liveUrl: string }) => updateWebhookConfigFn(newConfig),
        onSuccess: () => {
            toast({ title: "Success", description: "Webhook configuration has been updated." });
            queryClient.invalidateQueries({ queryKey: ['partnerConfig'] });
        },
        onError: (error: any) => {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(config);
    };

    if (isLoadingConfig) {
        return <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }

    return (
        <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl">Webhook Configuration</CardTitle>
                <CardDescription className="text-gray-300">Configure webhook endpoints for receiving notifications.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="sandboxUrl" className="text-gray-300 text-sm">Sandbox Webhook URL</Label>
                        <Input 
                            id="sandboxUrl" 
                            type="url" 
                            placeholder="https://sandbox.partner.com/webhook" 
                            value={config.sandboxUrl} 
                            onChange={(e) => setConfig({ ...config, sandboxUrl: e.target.value })} 
                            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="liveUrl" className="text-gray-300 text-sm">Live Webhook URL</Label>
                        <Input 
                            id="liveUrl" 
                            type="url" 
                            placeholder="https://live.partner.com/webhook" 
                            value={config.liveUrl} 
                            onChange={(e) => setConfig({ ...config, liveUrl: e.target.value })} 
                            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-md transition-all duration-200" 
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Configuration
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default function PartnerApiSettingsPage() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-white">API Settings</h1>
            <div className="space-y-6">
                <ApiCredentialsSection />
                <WebhookConfigSection />
            </div>
        </div>
    );
} 