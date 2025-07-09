import * as React from 'react';

export function AppLogo({ priority = false }: { priority?: boolean }) {
  return (
    <div className="font-bold text-lg text-primary font-headline">
      CPAY Partner
    </div>
  );
}
