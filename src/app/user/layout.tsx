'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { QueryProvider } from '@/components/shared/QueryProvider';

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <UserDashboardLayoutContent>{children}</UserDashboardLayoutContent>
      </AuthProvider>
    </QueryProvider>
  );
}

function UserDashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-secondary/30">
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
