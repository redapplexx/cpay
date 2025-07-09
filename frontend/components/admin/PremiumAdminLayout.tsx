// frontend/components/admin/PremiumAdminLayout.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, BarChart2 } from 'lucide-react';
import { AppLogo } from '@/components/app-logo'; // Assuming this component exists
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', icon: Home, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'User Management' },
  { href: '/admin/merchants', icon: Briefcase, label: 'Merchant Management' },
  { href: '/admin/transactions', icon: BarChart2, label: 'Transactions' },
];

export function PremiumAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full flex bg-gray-50 dark:bg-gray-900">
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200 dark:border-gray-800">
          <AppLogo />
        </div>
        <nav className="flex-grow px-4 py-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium',
                      isActive
                        ? 'bg-electric-blue text-black'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
