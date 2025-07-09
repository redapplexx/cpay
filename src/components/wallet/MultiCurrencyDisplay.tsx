// File: src/components/wallet/MultiCurrencyDisplay.tsx

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card'; // Assuming Shadcn Card components
import { cn } from '@/lib/utils'; // Assuming a utility for class merging

interface UserWallets {
    [key: string]: {
        balance: number;
        currency: string;
    };
}

interface MultiCurrencyDisplayProps {
    wallets: UserWallets;
    className?: string;
}

const currencySymbols: { [key: string]: string } = {
    PHP: '₱',
    KRW: '₩',
    USD: '$',
    // Add other currency symbols as needed
};

const formatBalance = (amount: number, currency: string) => {
    const locale = currency === 'KRW' ? 'ko-KR' : currency === 'PHP' ? 'en-PH' : 'en-US';
    const maximumFractionDigits = currency === 'PHP' || currency === 'USD' ? 2 : 0;
    const minimumFractionDigits = currency === 'PHP' || currency === 'USD' ? 2 : 0;

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: maximumFractionDigits,
            minimumFractionDigits: minimumFractionDigits,
        }).format(amount);
    } catch (error) {
        console.error(`Failed to format balance for currency ${currency}:`, error);
        // Fallback to a simple format if Intl.NumberFormat fails
        return `${currencySymbols[currency] || ''}${amount.toFixed(maximumFractionDigits)} ${currency}`;
    }
};

export function MultiCurrencyDisplay({ wallets, className }: MultiCurrencyDisplayProps) {
    const currencies = Object.keys(wallets);

    if (currencies.length === 0) {
        return (
            <div className={cn("text-center text-muted-foreground", className)}>
                No wallet balances available.
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {currencies.map(currencyCode => {
                const wallet = wallets[currencyCode];
                if (!wallet) return null;

                return (
                    <Card key={currencyCode} className="bg-white dark:bg-gray-800 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{wallet.currency}</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {formatBalance(wallet.balance, wallet.currency)}
                                </p>
                            </div>
                            {/* Optional: Add an icon or other indicator for the currency */}
                            {/* <div>
                                <span className="text-gray-400 dark:text-gray-600">{currencyCode}</span>
                            </div> */}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}