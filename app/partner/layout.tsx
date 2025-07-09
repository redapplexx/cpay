'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Webhook, 
  DollarSign, 
  UserCheck, 
  FileText, 
  Settings,
  LogOut,
  Building2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { app as firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const auth = getAuth(firebaseApp);

const navigation = [
  { name: 'Dashboard', href: '/partner/dashboard', icon: LayoutDashboard },
  { name: 'Webhooks', href: '/partner/dashboard/webhooks', icon: Webhook },
  { name: 'Payouts', href: '/partner/dashboard/payouts', icon: DollarSign },
  { name: 'KYC Management', href: '/partner/dashboard/kyc', icon: UserCheck },
  { name: 'Audit Logs', href: '/partner/dashboard/audit-logs', icon: FileText },
  { name: 'API Settings', href: '/partner/dashboard/api-settings', icon: Settings },
];

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Signed Out', description: 'You have been successfully signed out.' });
    } catch (error) {
      toast({ title: 'Sign Out Failed', description: 'An error occurred while signing out.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-white">CPay Partner Portal</h1>
              <p className="text-sm text-gray-400">Integration Dashboard</p>
            </div>
          </div>
          <Button 
            onClick={handleSignOut}
            variant="outline" 
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen">
          <div className="p-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
} 