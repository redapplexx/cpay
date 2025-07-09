// partner-portal/frontend/src/app/dashboard/webhooks/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';

import { PartnerDashboardLayout } from '@/components/partner/PartnerDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, CheckCircle, XCircle, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { firebaseApp } from '@/lib/firebase';

const functions = getFunctions(firebaseApp);
const updateWebhookConfigFn = httpsCallable(functions, 'updateWebhookConfig');
const getWebhookLogsFn = httpsCallable(functions, 'getWebhookLogs');
const resendWebhookFn = httpsCallable(functions, 'resendWebhook');
const getPartnerConfigFn = httpsCallable(functions, 'getApiCredentials'); // Reusing this to get partner's webhook config

type WebhookLog = {
    id: string;
    deliveryStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
    eventType: string;
    endpointUrl: string;
    responseStatusCode?: number;
    lastAttemptAt: { toDate: () => Date };
};

const WebhookConfigForm = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [config, setConfig] = useState({ sandboxUrl: '', liveUrl: '' });

    // Fetch initial config
    const { isLoading: isLoadingConfig } = useQuery({
        queryKey: ['partnerConfig'],
        queryFn: async () => {
            const result = await getPartnerConfigFn();
            const webhookConf = (result.data as any)?.webhookConfig || {};
            setConfig({ sandboxUrl: webhookConf.sandboxUrl || '', liveUrl: webhookConf.liveUrl || '' });
            return result.data;
        },
    });

    const mutation = useMutation({
        mutationFn: (newConfig: { sandboxUrl: string; liveUrl: string }) => updateWebhookConfigFn(newConfig),
        onSuccess: () => {
            toast({ title: "Success", description: "Webhook URLs have been updated." });
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
            <CardHeader><CardTitle className="text-xl">Webhook Configuration</CardTitle><CardDescription className="text-gray-300">Set the endpoints where CPAY will send event notifications.</CardDescription></CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="sandboxUrl" className="text-gray-300 text-sm">Sandbox URL</Label>
                        <Input id="sandboxUrl" type="url" placeholder="https://sandbox.partner.com/webhook" value={config.sandboxUrl} onChange={(e) => setConfig({ ...config, sandboxUrl: e.target.value })} className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="liveUrl" className="text-gray-300 text-sm">Live URL</Label>
                        <Input id="liveUrl" type="url" placeholder="https://live.partner.com/webhook" value={config.liveUrl} onChange={(e) => setConfig({ ...config, liveUrl: e.target.value })} className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200" />
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-md transition-all duration-200" disabled={mutation.isLoading}>
                        {mutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Configuration
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

const WebhookLogsTable = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: logs, isLoading, error } = useQuery<WebhookLog[]>({
        queryKey: ['webhookLogs'],
        queryFn: async () => (await getWebhookLogsFn()).data as WebhookLog[],
    });
    
    const resendMutation = useMutation({
        mutationFn: (logId: string) => resendWebhookFn({ logId }),
        onSuccess: (result: any) => {
            toast({ title: "Webhook Resent", description: result.data.message });
            queryClient.invalidateQueries({queryKey: ['webhookLogs']});
        },
        onError: (error: any) => {
            toast({ title: "Resend Failed", description: error.message, variant: "destructive" });
        }
    });

    const statusVariant = {
        PENDING: 'secondary',
        SUCCESS: 'default',
        FAILED: 'destructive',
    } as const;

    if (isLoading) return <div className="flex justify-center mt-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (error) return <div className="text-red-500 mt-6">Error loading logs: {(error as Error).message}</div>;

    return (
        <Card className="mt-6 bg-gray-800 border border-gray-700 text-white shadow-lg">
            <CardHeader><CardTitle className="text-xl">Webhook Delivery Logs</CardTitle><CardDescription className="text-gray-300">Monitor the status of your webhook deliveries.</CardDescription></CardHeader>
            <CardContent>
                 <div className="overflow-x-auto rounded-md border border-gray-700">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Event Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Endpoint URL</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {logs?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-gray-400">No webhook delivery logs found.</td>
                                </tr>
                            ) : (
                                logs?.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-700 transition-colors duration-150">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{format(log.lastAttemptAt.toDate(), 'PPpp')}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <Badge variant={statusVariant[log.deliveryStatus] || 'secondary'} className="min-w-[80px]">
                                                {log.deliveryStatus} {log.responseStatusCode && `(${log.responseStatusCode})`}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-primary-foreground">{log.eventType}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-mono break-all">{log.endpointUrl}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            {log.deliveryStatus === 'FAILED' && (
                                                <Button size="sm" variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:text-white" onClick={() => resendMutation.mutate(log.id)} disabled={resendMutation.isLoading}>
                                                    <Send className="mr-2 h-3 w-3" /> Resend
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default function PartnerWebhooksPage() {
    return (
        <PartnerDashboardLayout>
            <h1 className="text-3xl font-bold mb-6 text-white">Webhook Management</h1>
            <WebhookConfigForm />
            <WebhookLogsTable />
        </PartnerDashboardLayout>
    );
}
