// frontend/app/admin/merchants/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
<<<<<<< HEAD
=======
import { AdminLayout } from '@/components/admin/AdminLayout';
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const functions = getFunctions();
const listMerchantsFn = httpsCallable(functions, 'adminListMerchants');
const updateStatusFn = httpsCallable(functions, 'adminUpdateMerchantStatus');

// Define types for clarity
type Merchant = {
  id: string;
  status: 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED';
  businessProfile: {
    registeredName: string;
    tradeName?: string;
    tin: string;
  };
  // Add other fields as needed for display
};

type UpdateStatusPayload = {
  merchantId: string;
  status: 'ACTIVE' | 'REJECTED';
  rejectionReason?: string;
};

export default function AdminMerchantsPage() {
  const queryClient = useQueryClient();
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  const { data: merchants, isLoading, error } = useQuery({
    queryKey: ['admin-merchants'],
    queryFn: async (): Promise<Merchant[]> => {
      const result = await listMerchantsFn();
      return result.data as Merchant[];
    },
  });

  const { mutate: updateStatus, isLoading: isUpdating } = useMutation({
    mutationFn: (payload: UpdateStatusPayload) => updateStatusFn(payload),
    onSuccess: (_, variables) => {
      toast({ title: 'Success', description: `Merchant ${variables.status.toLowerCase()}.` });
      queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
      setSelectedMerchant(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleUpdateStatus = (status: 'ACTIVE' | 'REJECTED') => {
    if (!selectedMerchant) return;
    // For rejections, you could add a textarea for the reason.
    // For simplicity here, we'll just pass a generic reason.
    const payload: UpdateStatusPayload = { merchantId: selectedMerchant.id, status };
    if (status === 'REJECTED') {
        payload.rejectionReason = 'Information did not match submitted documents.';
    }
    updateStatus(payload);
  };

  if (isLoading) {
    return (
<<<<<<< HEAD
      <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin" /></div>
=======
      <AdminLayout>
        <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin" /></div>
      </AdminLayout>
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
    );
  }

  if (error) {
<<<<<<< HEAD
    return <div>Error loading merchants: {(error as Error).message}</div>;
  }

  return (
    <div>
=======
    return <AdminLayout><div>Error loading merchants: {(error as Error).message}</div></AdminLayout>;
  }

  return (
    <AdminLayout>
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
      <h1 className="text-2xl font-bold mb-4">Merchant Management</h1>
      <div className="bg-white shadow overflow-hidden rounded-md">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TIN</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {merchants?.map((merchant) => (
              <tr key={merchant.id}>
                <td className="px-6 py-4">{merchant.businessProfile.registeredName}</td>
                <td className="px-6 py-4">{merchant.businessProfile.tin}</td>
                <td className="px-6 py-4">
                  <Badge variant={merchant.status === 'ACTIVE' ? 'default' : (merchant.status === 'PENDING_REVIEW' ? 'secondary' : 'destructive')}>
                    {merchant.status}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedMerchant(merchant)}>Review</Button>
                  </DialogTrigger>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedMerchant} onOpenChange={(isOpen) => !isOpen && setSelectedMerchant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Merchant Application</DialogTitle>
          </DialogHeader>
          {selectedMerchant && (
            <div>
              <h3 className="font-bold">{selectedMerchant.businessProfile.registeredName}</h3>
              <p>TIN: {selectedMerchant.businessProfile.tin}</p>
              {/* You would display all merchant details and documents here for review */}
              <div className="mt-6 flex justify-end space-x-4">
                <Button variant="destructive" onClick={() => handleUpdateStatus('REJECTED')} disabled={isUpdating}>
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button variant="default" onClick={() => handleUpdateStatus('ACTIVE')} disabled={isUpdating}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
<<<<<<< HEAD
    </div>
=======
    </AdminLayout>
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
  );
}
