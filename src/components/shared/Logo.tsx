import Image from 'next/image';
import { cn } from '@/lib/utils';
import clsx from 'clsx';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizePx = size === 'sm' ? 32 : size === 'lg' ? 140 : 64;
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={clsx('bg-white rounded-xl flex items-center justify-center', {
        'p-1': size === 'sm',
        'p-2': size === 'md',
        'p-4': size === 'lg',
      })}>
      <Image
          src="/CPayWallet_blue.png"
        alt="CPay Logo"
          width={sizePx}
          height={sizePx}
        priority
      />
      </div>
      {showText && (
        <span className={cn('font-bold text-blue-600', textSizes[size])}>
          CPay
        </span>
      )}
    </div>
  );
}

export function LogoText({ size = 'md', className }: LogoProps) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <span className={cn('font-bold text-blue-600', textSizes[size], className)}>
      CPay
    </span>
  );
}
