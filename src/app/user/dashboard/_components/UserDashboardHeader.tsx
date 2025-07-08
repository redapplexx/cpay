'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function UserDashboardHeader() {
  const { profile } = useAuth();

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 border-2 border-primary/10">
          <AvatarImage src="https://placehold.co/100x100" alt="User" />
          <AvatarFallback>
            {profile?.fullName?.charAt(0).toUpperCase() ||
              profile?.email?.charAt(0).toUpperCase() ||
              'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-lg font-bold font-headline text-primary">
            {profile?.fullName || 'New User'}
          </h1>
        </div>
      </div>
      <Button asChild variant="ghost" size="icon" className="rounded-full">
        <Link href="/user/notifications">
          <Bell className="h-6 w-6" />
          <span className="sr-only">Notifications</span>
        </Link>
      </Button>
    </header>
  );
}
