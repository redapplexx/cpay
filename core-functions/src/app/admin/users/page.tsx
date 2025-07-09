'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Loader2, UserX, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { app } from '@/lib/firebase';

const functions = getFunctions(app);
const listAllUsersFn = httpsCallable(functions, 'adminListUsers');
const setUserRoleFn = httpsCallable(functions, 'adminSetUserRole');

interface UserWithClaims {
    uid: string;
    email: string;
    displayName?: string;
    profile?: { kycStatus: string };
    customClaims?: { role: 'ADMIN' | 'USER' };
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading, error } = useQuery<UserWithClaims[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const result = await listAllUsersFn();
      return result.data as UserWithClaims[];
    },
    refetchInterval: 15000,
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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    toast({
      title: "User Management Error",
      description: `Failed to load users: ${(error as Error).message}`,
      variant: "destructive"
    });
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p>Error loading user data.</p>
        <p className="text-sm text-gray-400">Please check console for details or contact support.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">User Management</h1>
      <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Platform Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">KYC Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-400">No users found.</td>
                  </tr>
                ) : (
                  users?.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-700 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {user.displayName || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-primary-foreground">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={user.profile?.kycStatus === 'Verified' ? 'default' : 'secondary'} className="min-w-[80px]">
                          {user.profile?.kycStatus || 'Unverified'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserRole({ uid: user.uid, role: user.customClaims?.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                          disabled={isSettingRole}
                          className="w-[140px] bg-gray-900 border-gray-600 text-white hover:bg-gray-700"
                        >
                          {user.customClaims?.role || 'USER'}
                        </Button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400 hover:bg-gray-700">
                          <UserX className="mr-2 h-4 w-4" /> Suspend
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
    </div>
  );
} 