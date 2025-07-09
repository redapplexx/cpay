// frontend/components/admin/MainAdminLayout.tsx
'use client';

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Store, ReceiptText, Settings, LogOut, Bell, Menu } from 'lucide-react';
import { signOut, getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth'; // Assuming useAuth for user context

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const auth = getAuth(firebaseApp);

interface MainAdminLayoutProps {
  children: ReactNode;
}

// Navigation items for the main admin portal
const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard }, // Main admin dashboard
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Merchants', href: '/admin/merchants', icon: Store },
  { name: 'Transactions', href: '/admin/transactions', icon: ReceiptText },
  { name: 'Settings', href: '/admin/settings', icon: Settings }, // Placeholder for admin settings
];

export const MainAdminLayout = ({ children }: MainAdminLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth(); // Assuming this provides isAdmin check via custom claims

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Redirect unauthenticated or non-admin users
  React.useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.customClaims?.role !== 'ADMIN')) {
      // Redirect to main login page or an unauthorized access page
      router.push('/'); 
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out from Admin Portal.' });
      router.push('/'); // Redirect to main CPay login
    } catch (error: any) {
      console.error("Admin logout error:", error);
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg text-gray-400">Loading Admin Portal...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.customClaims?.role !== 'ADMIN') {
    return null; // Or show an unauthorized message/redirecting message
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex-col border-r border-gray-800 bg-gray-950 transition-transform duration-300 lg:static lg:flex ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-center border-b border-gray-800 px-6">
          <Link href="/admin" className={`flex items-center gap-2 font-semibold text-lg text-primary ${!isSidebarOpen && 'hidden'}`}>
            <Cloud className="h-6 w-6" />
            <span>CPAY Admin</span>
          </Link>
          <Cloud className={`h-8 w-8 text-primary ${isSidebarOpen && 'hidden'}`} />
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <TooltipProvider key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200
                        ${isActive ? 'bg-primary/20 text-primary font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                        ${!isSidebarOpen ? 'justify-center' : 'justify-start'}`}
                    >
                      <Icon className={`h-5 w-5 ${!isSidebarOpen ? '' : 'mr-2'}`} />
                      <span className={`transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                        {item.name}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  {!isSidebarOpen && <TooltipContent side="right">{item.name}</TooltipContent>}
                </Tooltip>
              </TooltipProvider>
            );
          })}
          <Separator className="my-4 bg-gray-700" />
          <Button variant="ghost" className={`w-full justify-start text-gray-400 hover:bg-gray-800 hover:text-white ${!isSidebarOpen ? 'justify-center' : ''}`} onClick={handleLogout}>
            <LogOut className={`h-5 w-5 ${!isSidebarOpen ? '' : 'mr-2'}`} />
            <span className={`transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
              Logout
            </span>
          </Button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950 px-6 lg:h-16 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(!isSidebarOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-200">CPAY Admin Dashboard</h2>
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
               <span className="text-sm font-medium text-gray-300">{user?.email || 'Admin User'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
