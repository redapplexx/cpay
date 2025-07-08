import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownLeft, Send, Wallet, Coins } from 'lucide-react';

const allTransactions = [
  {
    type: 'Cash-In',
    source: '7-Eleven',
    amount: '+ ₱5,000.00',
    date: '2023-10-27',
    icon: Wallet,
    color: 'text-emerald-green',
  },
  {
    type: 'Sent',
    source: 'Jane Doe',
    amount: '- ₩15,000',
    date: '2023-10-27',
    icon: Send,
    color: 'text-soft-red',
  },
  {
    type: 'Received',
    source: 'John Smith',
    amount: '+ ₩50,000',
    date: '2023-10-26',
    icon: ArrowDownLeft,
    color: 'text-emerald-green',
  },
  {
    type: 'Crypto Buy',
    source: 'USDT',
    amount: '- ₩120,000',
    date: '2023-10-25',
    icon: Coins,
    color: 'text-sky-blue',
  },
];

const TransactionItem = ({ tx }: { tx: (typeof allTransactions)[0] }) => (
  <div className="flex items-center gap-4 py-4">
    <div className="bg-secondary p-3 rounded-full">
      <tx.icon className={`h-5 w-5 ${tx.color}`} />
    </div>
    <div className="flex-1">
      <p className="font-semibold">{tx.type}</p>
      <p className="text-sm text-muted-foreground">{tx.source}</p>
    </div>
    <div className="text-right">
      <p className={`font-bold ${tx.color}`}>{tx.amount}</p>
      <p className="text-sm text-muted-foreground">{tx.date}</p>
    </div>
  </div>
);

export default function ActivityPage() {
  return (
    <div className="p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold font-headline text-primary">Transaction History</h1>
        <p className="text-muted-foreground">Review all your past transactions.</p>
      </header>

      <Card className="shadow-elegant rounded-3xl">
        <CardContent className="p-4">
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="cash-in">Cash-In</TabsTrigger>
              <TabsTrigger value="cash-out">Cash-Out</TabsTrigger>
              <TabsTrigger value="transfers">Transfers</TabsTrigger>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
            </TabsList>
            <Separator />
            <TabsContent value="all">
              {allTransactions.map((tx, index) => (
                <TransactionItem key={index} tx={tx} />
              ))}
            </TabsContent>
            <TabsContent value="cash-in">
              {allTransactions
                .filter((tx) => tx.type.includes('Cash-In') || tx.type.includes('Received'))
                .map((tx, index) => (
                  <TransactionItem key={index} tx={tx} />
                ))}
            </TabsContent>
            <TabsContent value="cash-out">
              <p className="text-center text-muted-foreground p-8">No cash-out transactions yet.</p>
            </TabsContent>
            <TabsContent value="transfers">
              {allTransactions
                .filter((tx) => tx.type.includes('Sent'))
                .map((tx, index) => (
                  <TransactionItem key={index} tx={tx} />
                ))}
            </TabsContent>
            <TabsContent value="crypto">
              {allTransactions
                .filter((tx) => tx.type.includes('Crypto'))
                .map((tx, index) => (
                  <TransactionItem key={index} tx={tx} />
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
