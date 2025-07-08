
'use client';

import {
  Landmark,
  ShoppingCart,
  Users,
  Globe,
  ReceiptText,
  Signal,
  type LucideProps,
  FilterX,
  Upload,
  BadgeCheck,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { type Transaction } from '@/ai/flows/get-transactions-flow';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

const StatusIndicator = ({ status }: { status: Transaction['status']}) => {
    if (status === 'Pending') return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
    if (status === 'Failed') return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Failed</Badge>
    return <Badge variant="default" className="bg-green-600 hover:bg-green-600/90"><BadgeCheck className="mr-1 h-3 w-3" />Completed</Badge>
}

export function TransactionHistory() {
  const { transactions, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (activeTab === 'all') return transactions;
    return transactions.filter(t => {
      switch (activeTab) {
        case 'sent': return t.direction === 'sent';
        case 'received': return t.direction === 'received';
        case 'transfers': return t.type === 'P2P Transfer';
        case 'payments': return t.type === 'Payment' || t.type === 'Bills Payment' || t.type === 'E-Load';
        case 'remittance': return t.type === 'Remittance';
        default: return true;
      }
    });
  }, [transactions, activeTab]);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleCloseModal = () => {
    setSelectedTransaction(null);
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start sm:items-center justify-between">
            <div>
                 <CardTitle className="font-headline text-2xl font-semibold tracking-tight">Complete History</CardTitle>
                 <CardDescription>Review all your past transactions.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Coming Soon!', description: 'Export functionality will be available in a future update.'})}>
                <Upload className="mr-2 h-4 w-4" />
                Export
            </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:grid-cols-6 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="received">Received</TabsTrigger>
              <TabsTrigger value="transfers">Transfers</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="remittance">Remittance</TabsTrigger>
            </TabsList>
            <div className="space-y-1">
              {isLoading && !transactions && (
                <>
                  {[...Array(8)].map((_, i) => (
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
              {!isLoading && filteredTransactions.length > 0 && filteredTransactions.map((t) => {
                 const date = parseISO(t.date);
                 return (
                     <button key={t.id} onClick={() => handleTransactionClick(t)} className="w-full text-left grid grid-cols-[auto_1fr_auto] items-center gap-4 p-2 rounded-md hover:bg-secondary">
                        <Avatar className="h-10 w-10">
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
                            <p className="text-xs text-muted-foreground">{format(date, "MMM d, yyyy")}</p>
                        </div>
                    </button>
                 )
              })}
              {!isLoading && filteredTransactions.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-16 flex flex-col items-center">
                     <FilterX className="h-10 w-10 mb-4 text-muted-foreground/50"/>
                     <p className="font-semibold text-base">No Matching Transactions</p>
                     <p>
                        {transactions && transactions.length > 0
                            ? 'Try a different filter.'
                            : 'You don\'t have any transactions yet.'
                        }
                     </p>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTransaction} onOpenChange={(isOpen) => !isOpen && handleCloseModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTransaction?.party}</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.type} Details
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-3 text-sm pt-2">
                <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold font-mono">{selectedTransaction.direction === 'sent' ? '-' : '+'} {currencySymbols[selectedTransaction.currency as keyof typeof currencySymbols]}{selectedTransaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <StatusIndicator status={selectedTransaction.status} />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <span className="text-muted-foreground">Date</span><span className="text-right font-medium">{format(parseISO(selectedTransaction.date), "MMM d, yyyy 'at' h:mm a")}</span>
                    <span className="text-muted-foreground">Transaction ID</span><span className="text-right font-mono font-medium truncate">{selectedTransaction.id}</span>
                    <span className="text-muted-foreground">IP Address</span><span className="text-right font-mono font-medium">{selectedTransaction.ipAddress}</span>
                </div>
                {selectedTransaction.fxDetails && (
                    <>
                        <Separator />
                        <h4 className="font-semibold">FX Details</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                             <span className="text-muted-foreground">You Sent</span><span className="text-right font-mono font-medium">{selectedTransaction.fxDetails.sourceAmount.toLocaleString()} {selectedTransaction.fxDetails.sourceCurrency}</span>
                             <span className="text-muted-foreground">Exchange Rate</span><span className="text-right font-mono font-medium">1 {selectedTransaction.fxDetails.sourceCurrency} = {selectedTransaction.fxDetails.rate.toFixed(4)} {selectedTransaction.fxDetails.targetCurrency}</span>
                             <span className="text-muted-foreground">Recipient Received</span><span className="text-right font-mono font-medium">{selectedTransaction.fxDetails.targetAmount.toLocaleString()} {selectedTransaction.fxDetails.targetCurrency}</span>
                        </div>
                    </>
                )}
                 <Separator />
                <Button variant="outline" className="w-full">Repeat Transaction</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
