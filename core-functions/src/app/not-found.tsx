'use client';

import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-8 text-muted-foreground">Sorry, the page you are looking for does not exist.</p>
      <Button onClick={() => window.location.href = '/'}>Go Home</Button>
    </div>
  );
} 