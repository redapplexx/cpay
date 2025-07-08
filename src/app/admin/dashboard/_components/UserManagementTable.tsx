'use client';

import { useEffect, useState, useTransition } from 'react';
import { getAllUsers, updateUserStatus } from '@/lib/firestore';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { ShieldCheck } from 'lucide-react';

export function UserManagementTable() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const handleStatusChange = (uid: string, currentStatus: 'active' | 'suspended' | 'inactive') => {
    if (currentStatus === 'inactive') {
      toast({
        variant: 'destructive',
        title: 'Invalid Status',
        description: 'Cannot toggle status for inactive users.',
      });
      return;
    }
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    startTransition(async () => {
      try {
        await updateUserStatus(uid, newStatus);
        setUsers((prevUsers) =>
          prevUsers.map((user) => (user.uid === uid ? { ...user, status: newStatus } : user)),
        );
        toast({
          title: 'User Status Updated',
          description: `User has been set to ${newStatus}.`,
        });
      } catch (error: unknown) {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: error instanceof Error ? error.message : 'Could not update user status.',
        });
      }
    });
  };

  const handlePromoteToAdmin = (uid: string, fullName: string) => {
    startTransition(async () => {
      if (!functions) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Firebase Functions not configured.',
        });
        return;
      }
      const promoteToAdmin = httpsCallable(functions, 'promoteToAdmin');
      try {
        setUsers((prevUsers) =>
          prevUsers.map((user) => (user.uid === uid ? { ...user, role: 'admin' } : user)),
        );
        toast({
          title: 'Promotion Successful',
          description: `${fullName} has been promoted to admin.`,
        });
      } catch (error: unknown) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Promotion Failed',
          description: error instanceof Error ? error.message : 'Could not promote user.',
        });
      }
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-5 w-20" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-5 w-16" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-5 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-5 w-20" />
                </TableHead>
                <TableHead className="text-right">
                  <Skeleton className="h-5 w-24 ml-auto" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-7 w-24 ml-auto rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.createdAt ? format(user.createdAt.toDate(), 'PPP') : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === 'active' ? 'default' : 'outline'}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {user.role !== 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePromoteToAdmin(user.uid, user.fullName)}
                        disabled={isPending}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Promote
                      </Button>
                    )}
                    <Switch
                      checked={user.status === 'active'}
                      onCheckedChange={() =>
                        handleStatusChange(user.uid, user.status as 'active' | 'suspended')
                      }
                      disabled={isPending}
                      aria-label={`Toggle user status for ${user.fullName}`}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
