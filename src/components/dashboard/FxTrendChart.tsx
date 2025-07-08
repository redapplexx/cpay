"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

const fxData = {
  currentRate: 0.0418,
  change24h: -0.0045, // -0.45%
  trendData: [
    { date: '7d ago', rate: 0.0421 },
    { date: '6d ago', rate: 0.0423 },
    { date: '5d ago', rate: 0.0422 },
    { date: '4d ago', rate: 0.0419 },
    { date: '3d ago', rate: 0.0420 },
    { date: '2d ago', rate: 0.0419 },
    { date: 'Today', rate: 0.0418 },
  ],
};

export default function FxTrendChart() {
  const isUp = fxData.change24h >= 0;
  const changePercent = (fxData.change24h * 100).toFixed(2);
  return (
    <Card className="bg-white dark:bg-slate-900 rounded-3xl shadow-elegant">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">KRW to PHP Exchange Rate</CardTitle>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-3xl font-bold">1 KRW = ₱{fxData.currentRate.toFixed(4)}</span>
          <span className={`flex items-center ml-2 text-sm font-semibold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
            {isUp ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
            {changePercent}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={fxData.trendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <Line
              type="monotone"
              dataKey="rate"
              stroke={isUp ? '#22c55e' : '#ef4444'}
              strokeWidth={3}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 