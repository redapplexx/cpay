"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, Send, Trash2, Eye, ArrowUpCircle } from 'lucide-react';

// Dummy function for wallet creation (replace with actual API call)
async function createTestWallet() {
  // Simulate API call
  return {
    id: 'wallet_' + Math.random().toString(36).slice(2, 10),
    balance: Math.floor(Math.random() * 10000) / 100,
  };
}

export default function WalletManager() {
  const [wallets, setWallets] = useState<{ id: string; balance: number }[]>([]);
  const [sendDialog, setSendDialog] = useState<{ open: boolean; walletId: string | null }>({ open: false, walletId: null });

  const handleCreateWallet = async () => {
    const newWallet = await createTestWallet();
    setWallets((prev) => [newWallet, ...prev]);
    // Optionally, push to global log here
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Test Wallets</h2>
        <Button onClick={handleCreateWallet} variant="default">
          <Plus className="w-4 h-4 mr-2" /> Create New Test Wallet
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Wallet ID</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wallets.map((wallet) => (
            <TableRow key={wallet.id}>
              <TableCell className="font-mono">{wallet.id}</TableCell>
              <TableCell>₱{wallet.balance.toFixed(2)}</TableCell>
              <TableCell>
                <Button size="sm" variant="secondary" onClick={() => setSendDialog({ open: true, walletId: wallet.id })}>
                  <Send className="w-4 h-4 mr-1" /> Send From
                </Button>
                <Button size="sm" variant="outline" className="ml-2">
                  <ArrowUpCircle className="w-4 h-4 mr-1" /> Top Up
                </Button>
                <Button size="sm" variant="ghost" className="ml-2">
                  <Eye className="w-4 h-4 mr-1" /> View History
                </Button>
                <Button size="sm" variant="destructive" className="ml-2">
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Send From Dialog */}
      <Dialog open={sendDialog.open} onOpenChange={(open) => setSendDialog({ open, walletId: open ? sendDialog.walletId : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send From Wallet</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Handle send logic here
              setSendDialog({ open: false, walletId: null });
            }}
            className="space-y-4"
          >
            <Input label="From Wallet ID" value={sendDialog.walletId || ''} readOnly />
            <Input label="To Wallet ID" placeholder="Enter destination wallet ID" required />
            <Input label="Amount" type="number" min={1} step={0.01} placeholder="Amount" required />
            <Button type="submit" variant="default" className="w-full">
              Send
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 