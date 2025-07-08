import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TransferPage() {
  return (
    <div className="p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold font-headline text-primary">Send Money</h1>
        <p className="text-muted-foreground">Transfer funds securely and instantly.</p>
      </header>
      <Card className="w-full shadow-elegant rounded-3xl">
        <form>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
            <CardDescription>Enter the amount and recipient information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount-send">You Send</Label>
              <div className="flex gap-2">
                <Select defaultValue="krw">
                  <SelectTrigger className="w-[100px] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="krw">🇰🇷 KRW</SelectItem>
                    <SelectItem value="php">🇵🇭 PHP</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="amount-send"
                  type="number"
                  placeholder="100,000"
                  className="text-lg font-bold rounded-xl"
                />
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              FX Rate: 1 KRW = 0.042 PHP
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount-receive">Recipient Gets</Label>
              <div className="flex gap-2">
                <Select defaultValue="php">
                  <SelectTrigger className="w-[100px] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="php">🇵🇭 PHP</SelectItem>
                    <SelectItem value="krw">🇰🇷 KRW</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="amount-receive"
                  type="number"
                  placeholder="4,200.00"
                  readOnly
                  className="text-lg font-bold rounded-xl bg-secondary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                placeholder="Enter recipient's name or mobile"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Input id="message" placeholder="e.g., For monthly expenses" className="rounded-xl" />
            </div>

            <div className="text-sm p-4 bg-accent rounded-2xl text-accent-foreground">
              <p>Fee: ₩1,000</p>
              <p className="font-bold">Total to Pay: ₩101,000</p>
            </div>
          </CardContent>
          <div className="p-6 pt-0">
            <Button type="submit" className="w-full rounded-xl" size="lg">
              Continue
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
