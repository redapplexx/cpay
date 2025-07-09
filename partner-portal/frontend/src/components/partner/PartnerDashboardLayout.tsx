// partner-portal/frontend/src/components/partner/PartnerDashboardLayout.tsx
'use client';

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, KeyRound, DollarSign, Cloud, FileText, Settings, LogOut, Users, FileStack } from 'lucide-react';
import { signOut, getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth'; // Assuming a generic auth hook for user state

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react'; // Assuming Loader2 is used for Spinner

const auth = getAuth(firebaseApp);

interface PartnerDashboardLayoutProps {
  children: ReactNode;
}

// Define navItems outside the component to prevent re-creation on re-renders
const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'API Settings', href: '/dashboard/api-settings', icon: KeyRound },
  { name: 'Payouts', href: '/dashboard/payouts', icon: DollarSign },
  { name: 'Webhooks', href: '/dashboard/webhooks', icon: Cloud },
  { name: 'KYC/KYB', href: '/dashboard/kyc', icon: FileText },
  { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileStack },
];

// --- Helper Components for Premium UI --- //
// These would typically be in their own files (e.g., NavLink.tsx, Topbar.tsx, Sidebar.tsx, Spinner.tsx)
// but are included here for context and to show the styling.

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ElementType;
  isCollapsed: boolean;
  isActive: boolean;
}

const NavLink = ({ href, label, icon: Icon, isCollapsed, isActive }: NavLinkProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200
              ${isActive ? 'bg-primary/20 text-primary font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
              ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-0'}`} />
            <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
              {label}
            </span>
          </Link>
        </TooltipTrigger>
        {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
};

interface SidebarProps {
  isOpen: boolean;
  userRole: 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER'; // Specific partner roles
  pathname: string;
  onLogout: () => void;
}

const Sidebar = ({ isOpen, userRole, pathname, onLogout }: SidebarProps) => {
  const accessibleNavItems = navItems.filter(item => {
    // Simplified role check for demonstration
    if (userRole === 'OWNER' || userRole === 'ADMIN') return true; // Admins/Owners see all
    if (userRole === 'OPERATOR' && (item.name === 'Payouts' || item.name === 'Webhooks')) return true; // Operators see ops
    if (item.name === 'Dashboard' || item.name === 'Audit Logs') return true; // Viewers see these
    return false;
  });

  return (
    <aside className={`transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} bg-gray-950 border-r border-gray-800 flex flex-col fixed inset-y-0 z-50 lg:static lg:inset-x-0`}>
      <div className="flex items-center justify-center h-16 border-b border-gray-800 px-6">
        <Link href="/dashboard" className={`flex items-center gap-2 font-semibold text-lg text-primary ${!isOpen && 'hidden'}`}>
          <Cloud className="h-6 w-6" />
          <span>CPAY Partner</span>
        </Link>
        <Cloud className={`h-8 w-8 text-primary ${isOpen && 'hidden'}`} />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {accessibleNavItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.name}
            icon={item.icon}
            isCollapsed={!isOpen}
            isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
          />
        ))}
        <Separator className="my-4 bg-gray-700" />
        <Button variant="ghost" className={`w-full justify-start text-gray-400 hover:bg-gray-800 hover:text-white ${!isOpen ? 'justify-center' : ''}`} onClick={onLogout}>
          <LogOut className={`h-5 w-5 ${!isOpen ? '' : 'mr-2'}`} />
          <span className={`transition-opacity duration-200 ${!isOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
            Logout
          </span>
        </Button>
      </nav>
    </aside>
  );
};

interface TopbarProps {
  userName: string;
  partnerName: string;
  onToggleSidebar: () => void;
}

const Topbar = ({ userName, partnerName, onToggleSidebar }: TopbarProps) => {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950 px-6 lg:h-16 z-40">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden text-gray-400 hover:text-white" onClick={onToggleSidebar}>
          <Menu className="h-6 w-6" />
        </Button>
        <h2 className="text-lg font-semibold text-gray-200">{partnerName} Dashboard</h2>
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
           <span className="text-sm font-medium text-gray-300">{userName}</span>
        </div>
      </div>
    </header>
  );
};

interface BreadcrumbsProps { 
  // This would typically take a path array or dynamically generate from router
}

const Breadcrumbs = (props: BreadcrumbsProps) => {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(segment => segment);

  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '); // Basic formatting

    return (
      <React.Fragment key={href}>
        <Link href={href} className={`text-sm ${isLast ? 'text-primary' : 'text-gray-400 hover:text-white'}`}>
          {label}
        </Link>
        {!isLast && <span className="mx-2 text-gray-500">/</span>}
      </React.Fragment>
    );
  });

  return (
    <nav className="mb-6">
      {breadcrumbs.length > 0 ? (
        <ol className="flex items-center text-sm">
          <li>
            <Link href="/dashboard" className="text-gray-400 hover:text-white">Home</Link>
          </li>
          {breadcrumbs.map(crumb => <li key={crumb.key}>{crumb}</li>)}
        </ol>
      ) : (
        <span className="text-gray-400 text-sm">Home</span>
      )}
    </nav>
  );
};

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
}

const Spinner = ({ size = 'md' }: SpinnerProps) => {
    let className = "animate-spin text-primary";
    if (size === 'sm') className += " h-4 w-4";
    else if (size === 'md') className += " h-8 w-8";
    else if (size === 'lg') className += " h-16 w-16";
    return <Loader2 className={className} />;
};

export function PartnerDashboardLayout({ children }: PartnerDashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  
  // Assuming a useAuth hook that provides isAuthenticated and isLoading
  // This hook needs to be adapted to specifically check for partnerId and role claims
  const { user, isAuthenticated, isLoading } = useAuth(); // Adapt or create a partner-specific usePartnerAuth hook

  // State for mobile sidebar toggle
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Redirect unauthenticated users
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/partner-login'); // Redirect to partner login if not authenticated
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/partner-login');
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <Spinner size="lg" />
        <p className="ml-4 text-lg text-gray-400">Loading Partner Portal...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Or show a redirecting message until redirection happens
  }

  // Ensure user and user.customClaims are available for role check
  const userRole = (user?.customClaims as { role?: PartnerUser['role'] })?.role || 'VIEWER';

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex-col border-r border-gray-800 bg-gray-950 transition-transform duration-300 lg:static lg:flex ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar isOpen={true} userRole={userRole} pathname={pathname} onLogout={handleLogout} />
        {/* Overlay for mobile */}
        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <Topbar
          userName={user?.displayName || user?.email || 'Partner User'}
          partnerName={(user?.customClaims as { partnerName?: string })?.partnerName || 'Your Partner'}
          onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
