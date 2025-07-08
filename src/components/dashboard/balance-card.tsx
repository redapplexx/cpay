
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, X, Landmark, ShoppingCart, Users, Globe, ReceiptText, Signal, type LucideProps, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Transaction } from '@/ai/flows/get-transactions-flow';
import { getFxQuote } from '@/ai/flows/fx-quote-flow';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';

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

const MiniTransactionList = () => {
    const { transactions, isLoading } = useAuth();
    const recentTransactions = transactions?.slice(0, 3) || [];

    if (isLoading && !transactions) {
        return (
            <div className="space-y-1">
                {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                    <Skeleton className="h-10 w-10 rounded-full bg-slate-700" />
                    <div className="flex-grow space-y-1">
                    <Skeleton className="h-4 w-3/4 bg-slate-700" />
                    <Skeleton className="h-3 w-1/4 bg-slate-700" />
                    </div>
                    <Skeleton className="h-4 w-20 bg-slate-700" />
                </div>
                ))}
            </div>
        );
    }
    
    return (
        <div className="space-y-1 text-white">
            <h3 className="font-semibold text-lg text-slate-200 mb-2 px-2">Recent Activity</h3>
            {recentTransactions.length > 0 ? recentTransactions.map((t) => {
                const date = parseISO(t.date);
                return (
                    <div key={t.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-2 rounded-md hover:bg-white/5">
                        <Avatar className="h-10 w-10 border border-slate-600">
                        <AvatarFallback className="bg-slate-700 text-slate-300">
                            <TransactionIcon name={t.icon} className="h-5 w-5" />
                        </AvatarFallback>
                        </Avatar>
                        <div>
                        <p className="font-semibold text-slate-100">{t.party}</p>
                        <p className="text-sm text-slate-400">{t.type}</p>
                        </div>
                        <div className="text-right">
                        <p
                            className={cn('font-semibold font-mono', 
                            t.direction === 'received' ? 'text-green-400' : 'text-slate-100'
                            )}
                        >
                            {t.direction === 'sent' ? '-' : '+'} {currencySymbols[t.currency as keyof typeof currencySymbols]}
                            {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-400">{formatDistanceToNow(date, { addSuffix: true })}</p>
                        </div>
                    </div>
                )
            }) : (
                <div className="text-center py-4 text-slate-400">
                    <p>No recent transactions.</p>
                </div>
            )}
        </div>
    )
}

const BalanceSkeleton = () => (
    <Card className="bg-slate-900 text-white overflow-hidden">
        <CardContent className="p-6">
            <p className="text-sm text-slate-300">Total Balance</p>
            <Skeleton className="h-[48px] w-3/4 my-1 bg-slate-700" />
            <Skeleton className="h-[20px] w-1/2 bg-slate-700" />
            <Skeleton className="h-10 w-full mt-4 bg-amber-400/50" />
        </CardContent>
    </Card>
);

export function BalanceCard() {
  const { userAccount, isLoading } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<string | null>(null);

  const krwBalance = userAccount?.wallets?.KRW?.balance;

  useEffect(() => {
    if (krwBalance) {
      const fetchConversion = async () => {
        try {
          const quote = await getFxQuote({ amount: krwBalance, from: 'KRW' });
          const formatted = new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
          }).format(quote.targetAmount);
          setConvertedAmount(formatted);
        } catch (error) {
          console.error("Failed to get FX quote", error);
          setConvertedAmount(null);
        }
      };
      fetchConversion();
    }
  }, [krwBalance]);

  const formatBalance = (amount: number, currency: 'KRW' | 'PHP') => {
    return new Intl.NumberFormat(currency === 'KRW' ? 'ko-KR' : 'en-ph', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'PHP' ? 2 : 0,
      minimumFractionDigits: currency === 'PHP' ? 2 : 0,
    }).format(amount);
  };
  
  if (isLoading || !userAccount?.wallets || !krwBalance) {
    return <BalanceSkeleton />;
  }

  return (
     <motion.div layout="position" transition={{ duration: 0.35, ease: "easeInOut" }}>
        <Card
            className={cn(
                "bg-slate-900 text-white overflow-hidden relative",
                !isExpanded && "cursor-pointer"
            )}
            role={!isExpanded ? "button" : "region"}
            tabIndex={!isExpanded ? 0 : -1}
            onClick={() => !isExpanded && setIsExpanded(true)}
            onKeyDown={(e) => {
                if (!isExpanded && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    setIsExpanded(true);
                }
            }}
        >
        <CardContent className="p-6">
          <motion.div layout="position">
            <div>
              <p className="text-sm text-slate-300">Total Balance</p>
              <div className="flex items-start">
                <span className="text-5xl font-bold tracking-tight">{formatBalance(krwBalance, 'KRW')}</span>
              </div>
              <p className="text-sm text-slate-400 opacity-60">
                {convertedAmount ? `≈ ${convertedAmount}` : <Skeleton className="h-5 w-32 inline-block bg-slate-700" />}
              </p>
            </div>
          </motion.div>
          
          <AnimatePresence initial={false}>
            {!isExpanded && (
                <motion.div
                    key="add-money"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Button className="w-full bg-amber-400 text-amber-950 hover:bg-amber-400/90 font-bold" tabIndex={-1}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Money
                    </Button>
                </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
              {isExpanded && (
                  <motion.div
                      key="transactions"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: '1.5rem' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                      <MiniTransactionList />
                  </motion.div>
              )}
          </AnimatePresence>
        </CardContent>

        <AnimatePresence>
            {isExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-slate-300 hover:text-white hover:bg-white/10 rounded-full z-10"
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                        aria-label="Close transaction summary"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
