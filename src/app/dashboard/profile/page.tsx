
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { KycPromptCard } from '@/components/dashboard/kyc-prompt-card';
import { KycPendingCard } from '@/components/dashboard/kyc-pending-card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const profileSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters.'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

type KycStatus = 'Verified' | 'Pending' | 'Unverified';

const KycStatusBadge = ({ status }: { status: KycStatus }) => {
  const statusMap = {
    Verified: {
      label: 'Verified',
      icon: CheckCircle,
      className: 'bg-green-600 hover:bg-green-600/90 text-primary-foreground',
    },
    Pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-amber-500 hover:bg-amber-500/90 text-primary-foreground',
    },
    Unverified: {
      label: 'Unverified',
      icon: AlertCircle,
      className: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
    },
  };
  const currentStatus = statusMap[status];
  return (
    <Badge className={cn(currentStatus.className, 'border-transparent')}>
      <currentStatus.icon className="mr-1.5 h-3.5 w-3.5" />
      {currentStatus.label}
    </Badge>
  );
};

const ProfileSkeleton = () => (
    <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="grid gap-2 w-full">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-6 w-1/4 mt-1" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full" />
            </div>
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-36" />
        </CardFooter>
    </Card>
)


export default function ProfilePage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const { user, userAccount, isLoading } = useAuth();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.displayName || '',
    },
  });
  
  useEffect(() => {
    if (user) {
        form.reset({ name: user.displayName || '' });
    }
  }, [user, form]);

  const onSubmit = async (values: ProfileFormData) => {
    if (!auth.currentUser) {
        toast({ variant: 'destructive', title: 'Not Authenticated' });
        return;
    }
    setIsSaving(true);
    
    try {
        await updateProfile(auth.currentUser, { displayName: values.name });
        // Also update in Firestore
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, { profile: { fullName: values.name } }, { merge: true });

        toast({
            title: 'Profile Updated',
            description: 'Your account information has been successfully saved.',
        });
        form.reset(values); // Reset form with new values to clear dirty state
    } catch (error) {
        console.error("Profile update error:", error);
        toast({ variant: 'destructive', title: 'Update Failed' });
    } finally {
        setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  const renderContent = () => {
    if (isLoading || !user || !userAccount) {
        return <ProfileSkeleton />
    }
    
    const { kycStatus, fullName, address } = userAccount.profile;
  
    if (kycStatus !== 'Verified') {
      return (
          <div className="space-y-4">
              <Card>
                  <CardHeader>
                      <CardTitle>My Profile</CardTitle>
                      <CardDescription>Your personal account details.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border">
                              <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                              <AvatarFallback>{getInitials(user.displayName || '')}</AvatarFallback>
                          </Avatar>
                          <div>
                               <h2 className="text-xl font-bold font-headline">{user.displayName}</h2>
                               <div className="flex items-center gap-2 pt-2">
                                  <span className="text-sm font-medium">KYC Status:</span>
                                  <KycStatusBadge status={kycStatus} />
                              </div>
                          </div>
                      </div>
                  </CardContent>
              </Card>
              {kycStatus === 'Unverified' && <KycPromptCard />}
              {kycStatus === 'Pending' && <KycPendingCard />}
          </div>
      );
    }
  
  
    return (
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>
                View and manage your personal details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 border">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                    <AvatarFallback>{getInitials(user.displayName || '')}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1.5">
                      <h2 className="text-2xl font-bold font-headline">{form.watch('name')}</h2>
                      <p className="text-sm text-muted-foreground">{user.phoneNumber || 'No phone number'}</p>
                       <div className="flex items-center gap-2 pt-1">
                          <span className="text-sm font-medium">KYC Status:</span>
                          <KycStatusBadge status={kycStatus} />
                      </div>
                  </div>
                </div>
  
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input value={user.email || 'No email associated'} readOnly disabled />
                  </FormControl>
                   <FormDescription>
                      Email cannot be changed for anonymous accounts.
                  </FormDescription>
                </FormItem>
              </div>
  
              <FormItem>
                <FormLabel>Registered Address</FormLabel>
                <FormControl>
                  <Input value={address || 'No address on file. Complete KYC.'} readOnly disabled />
                </FormControl>
                <FormDescription>
                  Your address is linked to your KYC verification and cannot be changed here.
                </FormDescription>
              </FormItem>
            </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    );
  }

  return <div className="max-w-3xl mx-auto">{renderContent()}</div>;
}
