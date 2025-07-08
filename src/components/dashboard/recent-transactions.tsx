
'use client';

import {
  ArrowRight,
  Landmark,
  ShoppingCart,
  Users,
  Globe,
  ReceiptText,
  Signal,
  type LucideProps,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { type Transaction } from '@/ai/flows/get-transactions-flow';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';


const iconMap: { [key: string]: React.ComponentType<LucideProps> } = {
  Users,
  ShoppingCart,
  Landmark,
  Globe,
  ReceiptText,
  Signal,
};

const TransactionIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = iconMap[name];
  return IconComponent ? <IconComponent className={className} /> : null;
};

const currencySymbols = {
    PHP: '₱',
    KRW: '₩',
    USD: '$',
}

export function RecentTransactions({ isCarouselItem = false }: { isCarouselItem?: boolean }) {
  const { transactions, isLoading } = useAuth();
  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <Card className={cn(isCarouselItem && "h-full flex flex-col")}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-xl font-semibold tracking-tight">
          {isCarouselItem ? 'Latest Transactions' : 'Recent Activity'}
        </CardTitle>
         {!isCarouselItem && (
            <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/history">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
            </Button>
         )}
      </CardHeader>
      <CardContent className={cn("space-y-1", isCarouselItem && "flex-grow")}>
        {isLoading && !transactions && (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-grow space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </>
        )}
        {!isLoading && recentTransactions.map((t) => {
          const date = parseISO(t.date);
          return (
            <div key={t.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-2 rounded-md hover:bg-secondary">
            <Avatar className="h-10 w-10 border">
               <AvatarFallback className="bg-secondary text-secondary-foreground">
                  <TransactionIcon name={t.icon} className="h-5 w-5" />
               </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{t.party}</p>
              <p className="text-sm text-muted-foreground">{t.type}</p>
            </div>
            <div className="text-right">
              <p
                className={cn('font-semibold font-mono', 
                  t.direction === 'received' ? 'text-positive' : 'text-foreground'
                )}
              >
                {t.direction === 'sent' ? '-' : '+'} {currencySymbols[t.currency as keyof typeof currencySymbols]}
                {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</p>
            </div>
          </div>
          )
        })}
        {!isLoading && recentTransactions.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No transactions found.</p>
        )}
      </CardContent>
       {isCarouselItem && (
        <CardFooter>
            <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/history">View All History</Link>
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
