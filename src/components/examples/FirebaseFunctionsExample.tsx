'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { firebaseFunctions } from '@/lib/firebase-functions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function FirebaseFunctionsExample() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [functionName, setFunctionName] = useState('testConnection');
  const [functionData, setFunctionData] = useState('{}');

  const handleCallFunction = async () => {
    setLoading(true);
    setResult(null);

    try {
      let data;
      try {
        data = JSON.parse(functionData);
      } catch (error) {
        toast({
          title: 'Invalid JSON',
          description: 'Please enter valid JSON data',
          variant: 'destructive',
        });
        return;
      }

      // Call the function dynamically
      const response = await firebaseFunctions.callFunction(functionName, data);
      setResult(response);
      
      toast({
        title: 'Function Call Successful',
        description: `Function ${functionName} executed successfully`,
      });
    } catch (error: any) {
      setResult({ error: error.message });
      toast({
        title: 'Function Call Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const presetFunctions = [
    {
      name: 'testConnection',
      data: '{}',
      description: 'Test basic connection to Firebase Functions',
    },
    {
      name: 'testTransaction',
      data: '{"userId": "test-user-123", "amount": 500}',
      description: 'Test transaction processing',
    },
    {
      name: 'createWallet',
      data: '{"userId": "test-user-123", "currency": "PHP", "initialBalance": 1000}',
      description: 'Create a new wallet',
    },
    {
      name: 'getWalletBalance',
      data: '{"walletId": "your-wallet-id-here"}',
      description: 'Get wallet balance (replace walletId)',
    },
    {
      name: 'processTransaction',
      data: '{"fromWalletId": "wallet1", "toWalletId": "wallet2", "amount": 100, "currency": "PHP", "type": "transfer"}',
      description: 'Process a transaction between wallets',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firebase Functions Testing Console</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Function Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select Function</h3>
          <Select value={functionName} onValueChange={setFunctionName}>
            <SelectTrigger>
              <SelectValue placeholder="Select a function" />
            </SelectTrigger>
            <SelectContent>
              {presetFunctions.map((func) => (
                <SelectItem key={func.name} value={func.name}>
                  {func.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Preset Functions */}
          <div className="space-y-2">
            <h4 className="font-medium">Quick Presets:</h4>
            <div className="grid grid-cols-1 gap-2">
              {presetFunctions.map((func) => (
                <Button
                  key={func.name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFunctionName(func.name);
                    setFunctionData(func.data);
                  }}
                  className="justify-start text-left"
                >
                  <div>
                    <div className="font-medium">{func.name}</div>
                    <div className="text-xs text-gray-600">{func.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Function Data */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Function Data (JSON)</h3>
          <Textarea
            value={functionData}
            onChange={(e) => setFunctionData(e.target.value)}
            placeholder="Enter JSON data for the function..."
            rows={6}
            className="font-mono text-sm"
          />
        </div>

        {/* Execute Button */}
        <Button 
          onClick={handleCallFunction} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <LoadingSpinner size="sm" text="Executing..." />
          ) : (
            `Execute ${functionName}`
          )}
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Result</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 