import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ReceiptText,
  Signal,
  CreditCard,
  Globe,
  ArrowDownUp,
  Store,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';

const services = [
  {
    title: 'Send Money',
    description: 'Transfer funds to other CPay users.',
    href: '/dashboard/transfer',
    icon: ArrowUpRight,
  },
  {
    title: 'Request Money',
    description: 'Request payments from other users.',
    href: '/dashboard/receive',
    icon: ArrowDownLeft,
  },
  {
    title: 'Pay Merchant',
    description: 'Use QR or enter ID to pay businesses.',
    href: '/dashboard/pay',
    icon: CreditCard,
  },
  {
    title: 'Pay Bills',
    description: 'Settle your utility and other bills.',
    href: '/dashboard/pay-bills',
    icon: ReceiptText,
  },
  {
    title: 'Buy Load',
    description: 'Top up your prepaid mobile number.',
    href: '/dashboard/e-load',
    icon: Signal,
  },
  {
    title: 'Remittance',
    description: 'Send money internationally.',
    href: '/dashboard/remit',
    icon: Globe,
  },
  {
    title: 'Cash In / Out',
    description: 'Manage your wallet funds.',
    href: '/dashboard/cash-in-out',
    icon: ArrowDownUp,
  },
  {
    title: 'My Business',
    description: 'Manage your merchant account.',
    href: '/dashboard/business',
    icon: Store,
  },
  {
    title: 'KYC Verification',
    description: 'Verify your identity for higher limits.',
    href: '/dashboard/kyc',
    icon: UserCheck,
  },
];

export default function ServicesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tighter">Services</h1>
        <p className="text-muted-foreground">All your financial tools in one place.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Link href={service.href} key={service.href}>
            <Card className="flex h-full flex-col hover:bg-accent hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <service.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
