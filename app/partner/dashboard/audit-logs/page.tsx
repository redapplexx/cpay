'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { app as firebaseApp } from '@/lib/firebase';

const functions = getFunctions(firebaseApp, 'asia-southeast1');
const getAuditLogsFn = httpsCallable(functions, 'partner-getAuditLogs');

type AuditLog = {
    id: string;
    action: string;
    resource: string;
    userId: string;
    userEmail: string;
    timestamp: { toDate: () => Date };
    details: Record<string, any>;
};

export default function PartnerAuditLogsPage() {
    const { toast } = useToast();

    const { data: logs, isLoading, error } = useQuery<AuditLog[]>({
        queryKey: ['auditLogs'],
        queryFn: async () => (await getAuditLogsFn()).data as AuditLog[],
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        toast({
            title: "Audit Logs Error",
            description: `Failed to load audit logs: ${(error as Error).message}`,
            variant: "destructive"
        });
        return (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
                <p>Error loading audit logs.</p>
                <p className="text-sm text-gray-400">Please try refreshing the page or contact support.</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-white">Audit Logs</h1>
            
            <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl">Activity Log</CardTitle>
                    <CardDescription className="text-gray-300">Monitor all partner portal activities and API usage.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border border-gray-700">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timestamp</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Resource</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {logs?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-4 text-gray-400">No audit logs found.</td>
                                    </tr>
                                ) : (
                                    logs?.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-700 transition-colors duration-150">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                                {format(log.timestamp.toDate(), 'PPpp')}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                <Badge variant="outline" className="text-primary-foreground">
                                                    {log.action}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                                {log.resource}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                                {log.userEmail}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-300">
                                                <details className="cursor-pointer">
                                                    <summary className="text-primary-foreground hover:text-primary">
                                                        View Details
                                                    </summary>
                                                    <pre className="mt-2 text-xs bg-gray-900 p-2 rounded border border-gray-600 overflow-x-auto">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </details>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 