'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Home,
  History,
  Bell,
  User,
  Settings,
  LogOut,
  Sparkles,
  ArrowRightLeft,
  Building2
} from 'lucide-react';
import { AppLogo } from '@/components/app-logo';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';

const mainNav = [
  { href: '/dashboard', label: 'Home', icon: Home, exact: true },
  { href: '/dashboard/history', label: 'Activity', icon: History },
  { href: '/dashboard/services', label: 'Services', icon: ArrowRightLeft },
  { href: '/dashboard/business', label: 'My Business', icon: Building2 },
  { href: '/dashboard/ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { href: '/dashboard/notices', label: 'Notices', icon: Bell },
];

const bottomNav = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    if (href === '/dashboard') return false; // a more general link
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader>
        <AppLogo />
      </SidebarHeader>
      <SidebarContent className="p-0">
        <SidebarMenu className="flex-1">
          {mainNav.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={isActive(item.href, item.exact)}
                  tooltip={{ children: item.label }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarMenu>
            {bottomNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                    <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={{ children: item.label }}
                    >
                    <item.icon />
                    <span>{item.label}</span>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            ))}
             <SidebarMenuItem>
                <Link href="/dashboard/profile">
                    <SidebarMenuButton
                        isActive={isActive('/dashboard/profile')}
                        tooltip={{ children: "Profile" }}
                    >
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                            <AvatarFallback>{getInitials(user?.displayName || '')}</AvatarFallback>
                        </Avatar>
                        <span>{user?.displayName}</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="ghost" className="w-full justify-start gap-2 p-2" onClick={logout}>
           <LogOut className="h-4 w-4" />
           <span>Log Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
