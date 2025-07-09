import * as React from 'react';
import Image from 'next/image';

export function AppLogo({ priority = false }: { priority?: boolean }) {
  return (
    <Image
      src="/CPay_Wallet_blue.png"
      alt="CPay Logo"
      width={100}
      height={28}
      className="h-7 w-auto"
      priority={priority}
    />
  );
}
