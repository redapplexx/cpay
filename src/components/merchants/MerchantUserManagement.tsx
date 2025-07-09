'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link'; // Assuming a KYC completion page exists

// Assume these types are defined elsewhere and imported
// interface Merchant { ... authorizedUsers: { uid: string; role: string; }[] ... }
// interface UserProfile { ... kycStatus: 'Verified' | 'Pending' | 'Unverified'; ... }

// Define the structure of an authorized user with their profile info
interface AuthorizedUser {
  uid: string;
  role: string;
  profile?: {
    fullName?: string;
    kycStatus: 'Verified' | 'Pending' | 'Unverified';
  };
}

// Define the schema for inviting a user
const inviteUserSchema = z.object({
  identifier: z.string().min(1, 'Mobile number or email is required.'),
  role: z.enum(['maker', 'approver', 'admin'], { required_error: 'Role is required.' }),
});
type InviteUserForm = z.infer<typeof inviteUserSchema>;

// Placeholder callable functions (need actual backend implementation)
const functions = getFunctions();
const getMerchantAuthorizedUsers = httpsCallable<
  { merchantId: string },
  AuthorizedUser[] // Assuming the backend returns a list of authorized users with their profile/KYC status
>(functions, 'getMerchantAuthorizedUsers');

const inviteUserToMerchant = httpsCallable<
  InviteUserForm & { merchantId: string },
  { status: 'success'; message: string }
>(functions, 'inviteUserToMerchant');

// Add other mutations for removing/editing roles if needed

interface MerchantUserManagementProps {
    merchantId: string; // The ID of the merchant being managed
}

export function MerchantUserManagement({ merchantId }: MerchantUserManagementProps) {
  const { user } = useAuth(); // Get current authenticated user
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // Fetch authorized users for the merchant
  const { data: authorizedUsers, isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ['merchantAuthorizedUsers', merchantId],
    queryFn: async () => {
      const result = await getMerchantAuthorizedUsers({ merchantId });
      // Mocking data structure as backend function is placeholder
      const mockUsers: AuthorizedUser[] = [
          { uid: 'user123', role: 'admin', profile: { fullName: 'Alice Admin', kycStatus: 'Verified' } },
          { uid: 'user456', role: 'maker', profile: { fullName: 'Bob Maker', kycStatus: 'Pending' } },
          { uid: 'user789', role: 'approver', profile: { fullName: 'Charlie Approver', kycStatus: 'Unverified' } },
      ];
       // In a real app, you'd return result.data
       return mockUsers;
    },
     enabled: !!merchantId, // Only run if merchantId is available
  });

  // Mutation for inviting a new user
  const { mutate: inviteUser, isLoading: isInviting, error: inviteError } = useMutation({
    mutationFn: (data: InviteUserForm) => inviteUserToMerchant({ ...data, merchantId }),
    onSuccess: (response) => {
      toast({
        title: 'Invitation Sent',
        description: response.message,
      });
      setIsInviteDialogOpen(false);
      // Optionally invalidate queries to refetch user list
      queryClient.invalidateQueries({ queryKey: ['merchantAuthorizedUsers', merchantId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Invitation Failed',
        description: error.message || 'An error occurred while sending invitation.',
        variant: 'destructive',
      });
    },
  });

  const inviteForm = useForm<InviteUserForm>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { identifier: '', role: 'maker' },
  });

  const handleInviteSubmit = (values: InviteUserForm) => {
    inviteUser(values);
  };

  if (isLoadingUsers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Merchant Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-20" />
                </div>
            ))}
        </CardContent>
      </Card>
    );
  }

  if (usersError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Merchant Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error loading users: {(usersError as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Merchant Users</CardTitle>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Invite User</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={inviteForm.handleSubmit(handleInviteSubmit)} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="identifier" className="text-right">
                  Mobile/Email
                </Label>
                <Input
                  id="identifier"
                  placeholder="Mobile number or email"
                  className="col-span-3"
                  {...inviteForm.register('identifier')}
                />
                {inviteForm.formState.errors.identifier && (
                    <p className="col-span-4 text-right text-sm text-red-600">{inviteForm.formState.errors.identifier.message}</p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select onValueChange={inviteForm.setValue} defaultValue={inviteForm.getValues('role')}>
                  <SelectTrigger id="role" className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maker">Maker</SelectItem>
                    <SelectItem value="approver">Approver</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                 {inviteForm.formState.errors.role && (
                    <p className="col-span-4 text-right text-sm text-red-600">{inviteForm.formState.errors.role.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isInviting}>
                {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invitation
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {authorizedUsers && authorizedUsers.length > 0 ? (
          <ul className="space-y-4">
            {authorizedUsers.map((user) => (
              <li key={user.uid} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-semibold">{user.profile?.fullName || user.uid}</p>
                  <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                </div>
                <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.profile?.kycStatus === 'Verified' ? 'bg-green-100 text-green-800' :
                        user.profile?.kycStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {user.profile?.kycStatus || 'Status Unknown'}
                    </span>
                    {user.profile?.kycStatus !== 'Verified' && (
                        <Link href="/dashboard/kyc" className="ml-2 text-blue-600 hover:underline text-sm">
                            Complete KYC
                        </Link>
                    )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No authorized users found for this merchant.</p>
        )}
      </CardContent>
    </Card>
  );
}