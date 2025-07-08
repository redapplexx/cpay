import { AuthProvider } from '@/components/auth/AuthProvider';
import { QueryProvider } from '@/components/shared/QueryProvider';

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryProvider>
  );
} 