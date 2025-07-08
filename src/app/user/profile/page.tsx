'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ShieldCheck,
  ChevronRight,
  Bell,
  Languages,
  Lock,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

const menuItems = [
  { icon: Bell, label: 'Notifications', href: '/user/notifications' },
  { icon: Languages, label: 'Language', href: '#' },
  { icon: Lock, label: 'Security', href: '#' },
  { icon: FileText, label: 'Compliance', href: '#' },
  { icon: HelpCircle, label: 'Help & Support', href: '#' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { profile } = useAuth();

  const handleLogout = async () => {
    if (!isFirebaseConfigured || !auth) {
      toast({
        variant: 'destructive',
        title: 'Firebase Not Configured',
        description: 'Cannot log out because Firebase is not set up.',
      });
      return;
    }
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout Error:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An error occurred while logging out. Please try again.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-4 pt-4">
        <Avatar className="h-20 w-20 border-4 border-primary/10">
          <AvatarImage src="https://placehold.co/100x100" alt="User" />
          <AvatarFallback>{profile?.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold font-headline text-primary">
            {profile?.fullName || 'New User'}
          </h1>
          <p className="text-muted-foreground">{profile?.email}</p>
        </div>
      </header>

      <Card className="shadow-elegant rounded-3xl">
        <CardHeader>
          <CardTitle>KYC Status</CardTitle>
          <CardDescription>
            Your verification level determines your transaction limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-green" />
            <Badge className="bg-emerald-green/20 text-emerald-green hover:bg-emerald-green/30">
              Verified
            </Badge>
          </div>
          <Button variant="outline" className="rounded-xl">
            Increase Limits
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-elegant rounded-3xl">
        <CardContent className="p-2">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-accent transition-colors"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 font-semibold">{item.label}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </a>
                {index < menuItems.length - 1 && <Separator />}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full rounded-xl" onClick={handleLogout}>
        Log Out
      </Button>
    </div>
  );
}
