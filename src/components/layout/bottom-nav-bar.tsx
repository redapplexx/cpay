'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, User, Bell, ArrowRightLeft, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/dashboard/history', label: 'Activity', icon: History },
    { href: 'FAB', label: 'FAB', icon: 'FAB' },
    { href: '/dashboard/notices', label: 'Notice', icon: Bell },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
];


export function BottomNavBar() {
    const pathname = usePathname();
    const servicePaths = ['/dashboard/services', '/dashboard/transfer', '/dashboard/receive', '/dashboard/pay', '/dashboard/pay-bills', '/dashboard/e-load', '/dashboard/cash-in-out', '/dashboard/remit'];
    const isFabActive = servicePaths.some(path => pathname.startsWith(path));

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-sm border-t md:hidden">
            <div className="grid grid-cols-5 h-full items-center">
                {navItems.map((item) => {
                    if (item.href === 'FAB') {
                        return <div key={item.href} />;
                    }
                    const Icon = item.icon as LucideIcon;
                    const isActive = (pathname === '/dashboard' && item.href === '/dashboard') || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link key={item.href} href={item.href} className={cn(
                            "flex flex-col items-center justify-center gap-1 text-xs font-medium w-full h-full",
                            isActive ? 'text-primary' : 'text-muted-foreground'
                        )}>
                            <Icon className="h-6 w-6" />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </div>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3">
                <Link 
                    href="/dashboard/services" 
                    className={cn(
                        "flex items-center justify-center w-16 h-16 rounded-full font-bold text-2xl shadow-lg transition-all",
                        isFabActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-slate-900 text-primary-foreground hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                    )}
                >
                    <ArrowRightLeft className="h-8 w-8" />
                </Link>
            </div>
        </div>
    );
}
