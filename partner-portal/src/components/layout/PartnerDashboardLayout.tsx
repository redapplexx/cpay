// partner-portal/src/components/layout/PartnerDashboardLayout.tsx
'use client';

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, KeyRound, DollarSign, Cloud, FileText, Settings, LogOut, Users, FileStack, Menu, Bell, UserCircle } from 'lucide-react';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { AppLogo } from '../app-logo';

interface PartnerDashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN', 'OPERATOR', 'VIEWER'] },
  { name: 'API Settings', href: '/dashboard/api-settings', icon: KeyRound, roles: ['OWNER', 'ADMIN'] },
  { name: 'Payouts', href: '/dashboard/payouts', icon: DollarSign, roles: ['OWNER', 'ADMIN', 'OPERATOR'] },
  { name: 'Webhooks', href: '/dashboard/webhooks', icon: Cloud, roles: ['OWNER', 'ADMIN'] },
  { name: 'KYC/KYB', href: '/dashboard/kyc', icon: FileText, roles: ['OWNER', 'ADMIN', 'OPERATOR'] },
  { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileStack, roles: ['OWNER', 'ADMIN'] },
];

export function PartnerDashboardLayout({ children }: PartnerDashboardLayoutProps) {
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, partner, partnerUser, isLoading, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg text-gray-400">Loading Partner Portal...</p>
      </div>
    );
  }

  if (!user || !partner || !partnerUser) {
    return null;
  }

  const userRole = partnerUser.role;
  const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-800 bg-gray-950 transition-transform duration-300 lg:static lg:flex ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-center border-b border-gray-800 px-6">
          <AppLogo />
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {accessibleNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <TooltipProvider key={item.href} delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 ${isActive ? 'bg-primary/20 text-primary font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
        <div className="mt-auto p-4">
            <Separator className="my-2 bg-gray-700" />
            <Button variant="ghost" className="w-full justify-start text-gray-400 hover:bg-gray-800 hover:text-white" onClick={logout}>
                <LogOut className="h-5 w-5 mr-2" />
                <span>Logout</span>
            </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950 px-6 lg:h-16 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(!isSidebarOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-200 hidden sm:block">{partner.name} Dashboard</h2>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white relative">
              <Bell className="h-6 w-6" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
              </span>
            </Button>
            <div className="flex items-center gap-2">
               <UserCircle className="h-8 w-8 text-gray-500" />
               <span className="text-sm font-medium text-gray-300 hidden md:inline">{user.email}</span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
