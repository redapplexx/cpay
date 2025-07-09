// frontend/app/admin/users/page.tsx
'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
<<<<<<< HEAD
import { Button } from '@/components/ui/button';
import { Loader2, UserX, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { firebaseApp } from '@/lib/firebase';

const functions = getFunctions(firebaseApp);
const listAllUsersFn = httpsCallable(functions, 'adminListUsers');
const setUserRoleFn = httpsCallable(functions, 'adminSetUserRole');

// Define a type for user with customClaims
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

  const { data: users, isLoading, error } = useQuery<UserWithClaims[]> ({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const result = await listAllUsersFn();
      return result.data as UserWithClaims[];
    },
    refetchInterval: 15000, // Refresh every 15 seconds
=======
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
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
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
<<<<<<< HEAD
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
=======
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-16 w-16 animate-spin" />
        </div>
      </AdminLayout>
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
    );
  }

  if (error) {
<<<<<<< HEAD
    toast({
        title: "User Management Error",
        description: `Failed to load users: ${(error as Error).message}`,
        variant: "destructive"
    });
    return <div className="flex flex-col items-center justify-center h-64 text-red-500">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p>Error loading user data.</p>
            <p className="text-sm text-gray-400">Please check console for details or contact support.</p>
        </div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-white">User Management</h1>
      <Card className="bg-gray-800 border border-gray-700 text-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Platform Users</CardTitle>
          <CardDescription className="text-gray-300">Manage user roles and status across the CPay platform.</CardDescription>
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{user.displayName || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-primary-foreground">{user.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={user.profile?.kycStatus === 'Verified' ? 'default' : 'secondary'} className="min-w-[80px]">
                            {user.profile?.kycStatus || 'Unverified'}
                        </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                        <Select 
                            onValueChange={(role) => setUserRole({ uid: user.uid, role: role as 'ADMIN' | 'USER' })} 
                            defaultValue={user.customClaims?.role || 'USER'}
                            disabled={isSettingRole} // Disable select while role is being set
                        >
                            <SelectTrigger className="w-[140px] bg-gray-900 border-gray-600 text-white hover:bg-gray-700">
                            <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700 text-white">
                            <SelectItem value="USER" className="hover:bg-gray-700">User</SelectItem>
                            <SelectItem value="ADMIN" className="hover:bg-gray-700">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400 hover:bg-gray-700">
                            <UserX className="mr-2 h-4 w-4" /> Suspend
                        </Button>
                        </td>
                    </tr>
                ))
                }
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
=======
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
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
  );
}
