'use client';

import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const { user } = useAuth();
  
  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <SidebarTrigger className="sm:hidden" />
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/dashboard/notices">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
            </Link>
        </Button>
        <Link href="/dashboard/profile">
            <Avatar className="h-9 w-9 border hidden sm:flex">
                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                <AvatarFallback>{getInitials(user?.displayName || '')}</AvatarFallback>
            </Avatar>
            <span className="sr-only">User Profile</span>
        </Link>
    </header>
  );
}
