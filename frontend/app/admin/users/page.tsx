// frontend/app/admin/users/page.tsx
'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Loader2, UserX, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const functions = getFunctions();
const listAllUsersFn = httpsCallable(functions, 'adminListUsers');
const setUserRoleFn = httpsCallable(functions, 'adminSetUserRole'); // We will create this next

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const result = await listAllUsersFn();
      return result.data as any[]; // Define a proper type for user list
    },
  });

  const { mutate: setUserRole, isLoading: isSettingRole } = useMutation({
    mutationFn: (data: { uid: string; role: 'ADMIN' | 'USER' }) => setUserRoleFn(data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'User role updated.' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-16 w-16 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return <AdminLayout><div>Error loading users: {(error as Error).message}</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <div className="bg-white shadow overflow-hidden rounded-md">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KYC Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.map((user) => (
              <tr key={user.uid}>
                <td className="px-6 py-4 whitespace-nowrap">{user.displayName || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={user.profile?.kycStatus === 'Verified' ? 'default' : 'secondary'}>
                    {user.profile?.kycStatus || 'Unverified'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <Badge variant={user.customClaims?.role === 'ADMIN' ? 'destructive' : 'outline'}>
                    {user.customClaims?.role || 'USER'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isSettingRole}
                    onClick={() => setUserRole({ uid: user.uid, role: user.customClaims?.role === 'ADMIN' ? 'USER' : 'ADMIN' })}>
                      <ShieldCheck className="mr-2 h-4 w-4" /> Toggle Admin
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
