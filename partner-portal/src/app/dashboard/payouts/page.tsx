// partner-portal/src/app/dashboard/payouts/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { firebaseApp } from '@/lib/firebase';
import { AnimatedPageWrapper } from '@/components/ui/AnimatedPageWrapper';

const functions = getFunctions(firebaseApp, 'asia-southeast1');
const uploadPayoutBatchFn = httpsCallable(functions, 'partner-uploadPayoutBatch');
const getPayoutLogsFn = httpsCallable(functions, 'partner-getPayoutLogs');
const generateUploadUrlFn = httpsCallable(functions, 'partner-generateUploadUrl');

type PayoutLog = {
    id: string;
    payoutId: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    channel: string;
    amount: number;
    currency: string;
    createdAt: { toDate: () => Date };
};

const PayoutUploader = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [uploadProgress, setUploadProgress] = useState(0);

    const mutation = useMutation({
        mutationFn: (data: { fileName: string, gcsFilePath: string, payouts: any[] }) => uploadPayoutBatchFn(data),
        onSuccess: (result: any) => {
            toast({ title: "Upload Successful", description: `Batch ${result.data.batchId} is now processing.` });
            queryClient.invalidateQueries({ queryKey: ['payoutLogs'] });
            setUploadProgress(0);
        },
        onError: (error: any) => {
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
            setUploadProgress(0);
        }
    });

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        let payouts: any[] = [];
        try {
            const text = await file.text();
            payouts = JSON.parse(text);
            if (!Array.isArray(payouts) || payouts.length === 0) {
                throw new Error("Invalid file format. Must be a non-empty JSON array of payouts.");
            }
        } catch (err: any) {
            toast({ title: "Invalid File", description: err.message, variant: "destructive" });
            return;
        }

        try {
            const generateUrlResult: any = await generateUploadUrlFn({
                fileName: file.name,
                fileType: file.type,
                uploadPath: 'payout-batches'
            });
            const { signedUrl, fileMetadata } = generateUrlResult.data;

            await axios.put(signedUrl, file, {
                headers: {'Content-Type': file.type || 'application/octet-stream'},
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                },
            });

            mutation.mutate({
                fileName: file.name,
                gcsFilePath: fileMetadata.fullPath,
                payouts: payouts
            });

        } catch (err: any) {
            toast({ title: "Upload Failed", description: err.message || "Failed to generate upload URL or upload file.", variant: "destructive" });
        }

    }, [mutation, toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/json': ['.json'] } });

    return (
        <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl">Upload Payout File</CardTitle>
                <CardDescription className="text-gray-300">Drop a JSON file with your payout instructions (up to 1000 entries).</CardDescription>
            </CardHeader>
            <CardContent>
                <div {...getRootProps()} className={`p-10 border-2 rounded-lg text-center cursor-pointer transition-colors duration-200
                    ${isDragActive ? 'border-primary bg-gray-700' : 'border-gray-600 bg-gray-900'}
                    hover:border-primary/70`}>
                    <input {...getInputProps()} />
                    <UploadCloud className="mx-auto h-12 w-12 text-primary mb-3" />
                    {mutation.isPending ?
                        <p className="text-gray-300">Processing batch...</p> :
                        isDragActive ?
                        <p className="text-primary">Drop the file here ...</p> :
                        <p className="text-gray-400">Drag & drop your file here, or click to select a file</p>
                    }
                    {mutation.isPending && uploadProgress > 0 && uploadProgress < 100 && (
                        <p className="text-xs text-primary mt-2">Uploading: {uploadProgress}%</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Accepted formats: JSON</p>
                </div>
                {mutation.isError && <p className="text-red-500 text-sm mt-2">Error: {(mutation.error as Error).message}</p>}
            </CardContent>
        </Card>
    );
};

const PayoutLogsTable = () => {
    const { data: logs, isLoading, error } = useQuery<PayoutLog[]>({
        queryKey: ['payoutLogs'],
        queryFn: async () => (await getPayoutLogsFn()).data as PayoutLog[],
        refetchInterval: 5000,
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
            <CardHeader><CardTitle className="text-xl">Real-time Payout Logs</CardTitle><CardDescription className="text-gray-300">Monitor the status of individual payouts.</CardDescription></CardHeader>
            <CardContent>
                 <div className="overflow-x-auto rounded-md border border-gray-700">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reference ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Channel</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {logs?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-gray-400">No payout logs found.</td>
                                </tr>
                            ) : (
                                logs?.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-700 transition-colors duration-150">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{format(log.createdAt.toDate(), 'PPpp')}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-primary-foreground">{log.payoutId}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{log.channel}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-right text-primary-foreground">{log.amount.toFixed(2)} {log.currency}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <Badge variant={statusVariant[log.status] || 'secondary'} className="min-w-[80px]">
                                                {log.status}
                                            </Badge>
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

export default function PartnerPayoutsPage() {
    return (
        <AnimatedPageWrapper>
            <h1 className="text-3xl font-bold mb-6 text-white">Payout Operations</h1>
            <PayoutUploader />
            <PayoutLogsTable />
        </AnimatedPageWrapper>
    );
}
