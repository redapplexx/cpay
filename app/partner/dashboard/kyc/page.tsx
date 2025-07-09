'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { app as firebaseApp } from '@/lib/firebase';

const functions = getFunctions(firebaseApp, 'asia-southeast1');
const searchKycRecordsFn = httpsCallable(functions, 'partner-searchKycRecords');
const getKycDetailsFn = httpsCallable(functions, 'partner-getKycDetails');
const approveKycFn = httpsCallable(functions, 'partner-approveKyc');
const rejectKycFn = httpsCallable(functions, 'partner-rejectKyc');

type KycRecord = {
    id: string;
    userId: string;
    userEmail: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedAt: { toDate: () => Date };
    documents: {
        idType: string;
        idNumber: string;
        selfieUrl: string;
        idFrontUrl: string;
        idBackUrl: string;
    };
};

const KycSearchForm = ({ onSearch }: { onSearch: (query: string) => void }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            onSearch(searchQuery.trim());
        }
    };

    return (
        <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl">Search KYC Records</CardTitle>
                <CardDescription className="text-gray-300">Search by user ID, email, or ID number.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder="Enter user ID, email, or ID number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <Button type="submit" className="bg-primary hover:bg-primary/90">
                        <Search className="mr-2 h-4 w-4" />
                        Search
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

const KycDetailsModal = ({ record, onClose, onAction }: { 
    record: KycRecord | null; 
    onClose: () => void; 
    onAction: (action: 'approve' | 'reject') => void;
}) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const approveMutation = useMutation({
        mutationFn: () => approveKycFn({ kycId: record?.id }),
        onSuccess: () => {
            toast({ title: "KYC Approved", description: "User KYC has been approved successfully." });
            queryClient.invalidateQueries({ queryKey: ['kycRecords'] });
            onClose();
        },
        onError: (error: any) => {
            toast({ title: "Approval Failed", description: error.message, variant: "destructive" });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: (reason: string) => rejectKycFn({ kycId: record?.id, reason }),
        onSuccess: () => {
            toast({ title: "KYC Rejected", description: "User KYC has been rejected." });
            queryClient.invalidateQueries({ queryKey: ['kycRecords'] });
            onClose();
        },
        onError: (error: any) => {
            toast({ title: "Rejection Failed", description: error.message, variant: "destructive" });
        }
    });

    if (!record) return null;

    const statusVariant = {
        PENDING: 'secondary',
        APPROVED: 'default',
        REJECTED: 'destructive',
    } as const;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">KYC Details</h3>
                    <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
                        ✕
                    </Button>
                </div>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-300 text-sm">User ID</Label>
                            <p className="text-white font-mono">{record.userId}</p>
                        </div>
                        <div>
                            <Label className="text-gray-300 text-sm">Email</Label>
                            <p className="text-white">{record.userEmail}</p>
                        </div>
                        <div>
                            <Label className="text-gray-300 text-sm">Status</Label>
                            <Badge variant={statusVariant[record.status]} className="mt-1">
                                {record.status}
                            </Badge>
                        </div>
                        <div>
                            <Label className="text-gray-300 text-sm">Submitted</Label>
                            <p className="text-white">{format(record.submittedAt.toDate(), 'PPpp')}</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="font-semibold text-white mb-2">Document Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-gray-300 text-sm">ID Type</Label>
                                <p className="text-white">{record.documents.idType}</p>
                            </div>
                            <div>
                                <Label className="text-gray-300 text-sm">ID Number</Label>
                                <p className="text-white font-mono">{record.documents.idNumber}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="font-semibold text-white mb-2">Document Images</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label className="text-gray-300 text-sm">Selfie</Label>
                                <img src={record.documents.selfieUrl} alt="Selfie" className="w-full h-32 object-cover rounded border border-gray-600" />
                            </div>
                            <div>
                                <Label className="text-gray-300 text-sm">ID Front</Label>
                                <img src={record.documents.idFrontUrl} alt="ID Front" className="w-full h-32 object-cover rounded border border-gray-600" />
                            </div>
                            <div>
                                <Label className="text-gray-300 text-sm">ID Back</Label>
                                <img src={record.documents.idBackUrl} alt="ID Back" className="w-full h-32 object-cover rounded border border-gray-600" />
                            </div>
                        </div>
                    </div>

                    {record.status === 'PENDING' && (
                        <div className="border-t border-gray-700 pt-4">
                            <h4 className="font-semibold text-white mb-2">Actions</h4>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => approveMutation.mutate()} 
                                    disabled={approveMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button 
                                    onClick={() => rejectMutation.mutate("Document verification failed")} 
                                    disabled={rejectMutation.isPending}
                                    variant="destructive"
                                >
                                    {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const KycRecordsTable = ({ records }: { records: KycRecord[] }) => {
    const [selectedRecord, setSelectedRecord] = useState<KycRecord | null>(null);

    const statusVariant = {
        PENDING: 'secondary',
        APPROVED: 'default',
        REJECTED: 'destructive',
    } as const;

    return (
        <>
            <Card className="mt-6 bg-gray-800 border border-gray-700 text-white shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl">KYC Records</CardTitle>
                    <CardDescription className="text-gray-300">Review and manage KYC submissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border border-gray-700">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Submitted</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-4 text-gray-400">No KYC records found.</td>
                                    </tr>
                                ) : (
                                    records.map(record => (
                                        <tr key={record.id} className="hover:bg-gray-700 transition-colors duration-150">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-primary-foreground">{record.userId}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{record.userEmail}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                <Badge variant={statusVariant[record.status]} className="min-w-[80px]">
                                                    {record.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{format(record.submittedAt.toDate(), 'PPpp')}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:text-white"
                                                    onClick={() => setSelectedRecord(record)}
                                                >
                                                    <Eye className="mr-2 h-3 w-3" /> View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {selectedRecord && (
                <KycDetailsModal 
                    record={selectedRecord} 
                    onClose={() => setSelectedRecord(null)}
                    onAction={(action) => {
                        // Action handled in modal
                    }}
                />
            )}
        </>
    );
};

export default function PartnerKycPage() {
    const [searchResults, setSearchResults] = useState<KycRecord[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (query: string) => {
        try {
            const result = await searchKycRecordsFn({ query });
            setSearchResults(result.data as KycRecord[]);
            setHasSearched(true);
        } catch (error: any) {
            console.error('Search failed:', error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-white">KYC Management</h1>
            <KycSearchForm onSearch={handleSearch} />
            {hasSearched && <KycRecordsTable records={searchResults} />}
        </div>
    );
} 