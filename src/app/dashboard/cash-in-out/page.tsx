// src/app/dashboard/cash-in-out/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Landmark, Ticket, Bitcoin } from 'lucide-react';
import { BankCashOutForm } from '@/components/cashout/BankCashOutForm';
import { CryptoCashInForm, VoucherCashInForm } from '@/components/cashin/ExpandedCashInForms';
import { CryptoCashOutForm, PayoutOutletForm } from '@/components/cashout/ExpandedCashOutForms';

export default function CashInOutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'cash-in');
  const [activeCashInMethod, setActiveCashInMethod] = useState('bank');
  const [activeCashOutMethod, setActiveCashOutMethod] = useState('bank');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && (tab === 'cash-in' || tab === 'cash-out')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`${pathname}?tab=${value}`, { scroll: false });
  };

  const renderCashInContent = () => {
    switch (activeCashInMethod) {
      case 'bank':
        return (
          <div className="flex items-start gap-4 rounded-lg border p-4">
            <Landmark className="h-8 w-8 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">From Your Banking App</h3>
              <p className="text-sm text-muted-foreground">
                1. Open your preferred bank or e-wallet app.
                <br />
                2. Select 'Transfer to other bank/e-wallet' via InstaPay or PesoNet.
                <br />
                3. Choose 'CPay Wallet' from the list of banks/e-wallets.
                <br />
                4. Enter your CPay Wallet mobile number and the amount.
                <br />
                5. Confirm the transaction. Funds will reflect in your wallet shortly.
              </p>
            </div>
          </div>
        );
      case 'voucher':
        return <VoucherCashInForm />;
      case 'crypto':
        return <CryptoCashInForm />;
      default:
        return null;
    }
  };

  const renderCashOutContent = () => {
    switch (activeCashOutMethod) {
        case 'bank':
            return <BankCashOutForm />;
        case 'outlet':
            return <PayoutOutletForm />;
        case 'crypto':
            return <CryptoCashOutForm />;
        default:
            return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cash-in">Cash In</TabsTrigger>
          <TabsTrigger value="cash-out">Cash Out</TabsTrigger>
        </TabsList>
        <TabsContent value="cash-in">
          <Card>
            <CardHeader>
              <CardTitle>Cash In</CardTitle>
              <CardDescription>Add funds to your CPay Wallet using your preferred method.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeCashInMethod} onValueChange={setActiveCashInMethod} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="bank"><Landmark className="mr-2 h-4 w-4" />Bank</TabsTrigger>
                  <TabsTrigger value="voucher"><Ticket className="mr-2 h-4 w-4" />Voucher</TabsTrigger>
                  <TabsTrigger value="crypto"><Bitcoin className="mr-2 h-4 w-4" />Crypto</TabsTrigger>
                </TabsList>
                <TabsContent value={activeCashInMethod} className="mt-4">
                  {renderCashInContent()}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cash-out">
          <Card>
            <CardHeader>
              <CardTitle>Cash Out</CardTitle>
              <CardDescription>Withdraw funds from your wallet.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeCashOutMethod} onValueChange={setActiveCashOutMethod} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bank"><Landmark className="mr-2 h-4 w-4" />Bank</TabsTrigger>
                    <TabsTrigger value="outlet"><Landmark className="mr-2 h-4 w-4" />Outlet</TabsTrigger>
                    <TabsTrigger value="crypto"><Bitcoin className="mr-2 h-4 w-4" />Crypto</TabsTrigger>
                    </TabsList>
                    <TabsContent value={activeCashOutMethod} className="mt-4">
                    {renderCashOutContent()}
                    </TabsContent>
                </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// We need a BankCashOutForm component, let's create a placeholder for it here
// as it was part of the original page.
const BankCashOutForm = () => {
    // This would contain the Zod schema and form logic for bank cash-outs
    // as seen previously in the `cash-in-out/page.tsx` file.
    return (
        <div className="text-center text-muted-foreground p-8 border rounded-lg">
            <p className="font-semibold">Bank Cash Out</p>
            <p className="text-sm mt-2">The form to cash out to a bank account would be implemented here.</p>
        </div>
    )
}
