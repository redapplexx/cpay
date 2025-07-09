
'use client';

import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { useMemo } from 'react';
import { subDays, format, parseISO, startOfDay } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  spending: {
    label: 'Spending',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;


export function SpendingChart() {
    const { transactions, isLoading } = useAuth();

    const chartData = useMemo(() => {
        if (!transactions) return [];

        const last7Days = Array.from({ length: 7 }, (_, i) => startOfDay(subDays(new Date(), i))).reverse();

        const dailySpending = last7Days.map(day => {
            const dayString = format(day, 'yyyy-MM-dd');
            const total = transactions
                .filter(t => t.direction === 'sent' && t.currency === 'PHP' && format(parseISO(t.date), 'yyyy-MM-dd') === dayString)
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                date: format(day, 'eee'), // Format as 'Mon', 'Tue', etc.
                spending: total,
            };
        });

        return dailySpending;
    }, [transactions]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Weekly Spending (PHP)</CardTitle>
                <CardDescription>Your spending over the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                    {isLoading && !transactions ? (
                        <Skeleton className="h-full w-full" />
                    ) : (
                        <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => `₱${Number(value) / 1000}k`}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent 
                                    formatter={(value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value as number)}
                                    indicator="dot" 
                                />}
                            />
                            <Bar dataKey="spending" fill="var(--color-spending)" radius={4} />
                        </BarChart>
                    )}
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
