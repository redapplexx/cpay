'use client';

import { AppLogo } from '@/components/app-logo';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { BottomNavBar } from '@/components/layout/bottom-nav-bar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DesktopSidebar } from '@/components/layout/desktop-sidebar';
import { Header } from '@/components/layout/header';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
           <AppLogo />
           <p className="text-muted-foreground">Loading your dashboard...</p>
           <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  return (
     <SidebarProvider>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <DesktopSidebar />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
              <Header />
              <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="flex-1 p-4 sm:p-6 pb-24 md:pb-6"
              >
                {children}
              </motion.main>
            </div>
            <BottomNavBar />
        </div>
    </SidebarProvider>
  );
}
