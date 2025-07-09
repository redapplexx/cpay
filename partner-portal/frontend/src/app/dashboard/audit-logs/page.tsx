// partner-portal/frontend/src/app/dashboard/audit-logs/page.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';

import { PartnerDashboardLayout } from '@/components/partner/PartnerDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { firebaseApp } from '@/lib/firebase';
import { AnimatedPageWrapper } from '@/components/ui/AnimatedPageWrapper';

const functions = getFunctions(firebaseApp);
const getAuditLogsFn = httpsCallable(functions, 'getAuditLogs');

type AuditLog = {
    id: string;
    timestamp: { toDate: () => Date };
    userId: string;
    userEmail: string;
    action: string;
    details?: Record<string, any>;
};

export default function PartnerAuditLogsPage() {
    const { toast } = useToast();

    const { data: logs, isLoading, error } = useQuery<AuditLog[]>({
        queryKey: ['auditLogs'],
        queryFn: async () => {
            const result = await getAuditLogsFn();
            return result.data as AuditLog[];
        },
        refetchInterval: 15000, // Refresh logs every 15 seconds
    });

    if (isLoading) return <PartnerDashboardLayout><div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></PartnerDashboardLayout>;
    if (error) return <PartnerDashboardLayout><div className="text-red-500">Error loading audit logs: {(error as Error).message}</div></PartnerDashboardLayout>;

    return (
        <PartnerDashboardLayout>
            <AnimatedPageWrapper>
                <h1 className="text-3xl font-bold mb-6 text-white">Audit & Activity Logs</h1>
                <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl">Recent Partner Activity</CardTitle>
                        <CardDescription className="text-gray-300">A chronological record of actions performed on this portal by your team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-md border border-gray-700">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {logs?.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4 text-gray-400">No audit logs found.</td>
                                        </tr>
                                    ) : (
                                        logs?.map(log => (
                                            <tr key={log.id} className="hover:bg-gray-700 transition-colors duration-150">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{format(log.timestamp.toDate(), 'PPpp')}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-primary-foreground">{log.userEmail || log.userId}</td>
                                                <td className="px-4 py-3 whitespace-nowrap"><Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">{log.action}</Badge></td>
                                                <td className="px-4 py-3 text-sm font-mono text-gray-400 break-all">{log.details ? JSON.stringify(log.details, null, 2) : 'N/A'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </AnimatedPageWrapper>
        </PartnerDashboardLayout>
    );
}
