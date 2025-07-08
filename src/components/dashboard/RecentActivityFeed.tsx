"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const activityData = [
  {
    type: 'Cash-In',
    icon: 'https://logo.clearbit.com/7-eleven.com',
    description: '7-Eleven, BGC',
    amount: 5000.0,
    currency: 'PHP',
    timestamp: '10:45 AM',
  },
  {
    type: 'Sent',
    icon: 'MC',
    description: 'Transfer to Maria Cruz',
    amount: -15000.0,
    currency: 'KRW',
    timestamp: '09:30 AM',
  },
  {
    type: 'Received',
    icon: 'JS',
    description: 'From John Smith',
    amount: 50000.0,
    currency: 'KRW',
    timestamp: 'Yesterday',
  },
  {
    type: 'Payment',
    icon: 'https://logo.clearbit.com/meralco.com.ph',
    description: 'Meralco Electricity Bill',
    amount: -2150.5,
    currency: 'PHP',
    timestamp: '2 days ago',
  },
];

function ActivityItem({ item }: { item: typeof activityData[0] }) {
  const isPositive = item.amount > 0;
  const isLogo = item.icon.startsWith('http');
  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-10 w-10">
        {isLogo ? (
          <AvatarImage src={item.icon} alt={item.type} />
        ) : (
          <AvatarFallback>{item.icon}</AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1">
        <p className="font-semibold">{item.type}</p>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </div>
      <div className="text-right">
        <p className={`font-bold ${isPositive ? 'text-green-500' : 'text-slate-800 dark:text-slate-200'}`}>
          {isPositive ? '+' : ''}{item.amount.toLocaleString(undefined, { style: 'currency', currency: item.currency })}
        </p>
        <p className="text-sm text-muted-foreground">{item.timestamp}</p>
      </div>
    </div>
  );
}

export default function RecentActivityFeed() {
  return (
    <Card className="shadow-elegant rounded-3xl">
      <CardContent className="p-4 space-y-4">
        {activityData.map((item, idx) => (
          <ActivityItem key={idx} item={item} />
        ))}
      </CardContent>
    </Card>
  );
} 