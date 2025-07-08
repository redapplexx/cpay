'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowRightLeft, History, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/user/dashboard', label: 'Home', icon: Home },
  { href: '/user/transfer', label: 'Send/Receive', icon: ArrowRightLeft },
  { href: '/user/activity', label: 'Activity', icon: History },
  { href: '/user/financial-advice', label: 'AI Advice', icon: Sparkles },
  { href: '/user/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div className="mx-auto grid h-20 max-w-lg grid-cols-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group inline-flex flex-col items-center justify-center px-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200',
                isActive && 'text-primary font-semibold',
              )}
            >
              <item.icon
                className={cn(
                  'h-6 w-6 mb-1 transition-transform duration-200 ease-in-out group-hover:scale-110',
                  isActive && 'scale-110 fill-primary/10',
                )}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
