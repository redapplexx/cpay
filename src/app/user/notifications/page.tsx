import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Megaphone, ShieldAlert, Ticket } from 'lucide-react';

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  icon: React.ElementType;
  time: string;
};

const notifications = {
  system: [
    {
      id: '1',
      icon: ShieldAlert,
      title: 'Security Alert: New Device Login',
      message: 'A new device has logged into your account.',
      time: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      icon: ShieldAlert,
      title: 'Password successfully changed',
      message: 'Your password has been updated successfully.',
      time: '1 day ago',
      read: true,
    },
  ],
  offers: [
    {
      id: '3',
      icon: Ticket,
      title: 'Zero-fee transfers to Korea this weekend!',
      message: 'Enjoy free transfers to Korea this weekend.',
      time: '4 hours ago',
      read: false,
    },
  ],
  announcements: [
    {
      id: '4',
      icon: Megaphone,
      title: 'Scheduled Maintenance: Oct 30, 2 AM KST',
      message: 'We will be performing scheduled maintenance.',
      time: '3 days ago',
      read: true,
    },
  ],
};

const NotificationItem = ({ item }: { item: Notification }) => (
  <div className="flex items-start gap-4 py-4 px-2">
    <div className={`p-2 rounded-full ${!item.read ? 'bg-primary/10' : 'bg-secondary'}`}>
      <item.icon className={`h-6 w-6 ${!item.read ? 'text-primary' : 'text-muted-foreground'}`} />
    </div>
    <div className="flex-1">
      <p className={`font-semibold ${!item.read && 'text-primary'}`}>{item.title}</p>
      <p className="text-sm text-muted-foreground">{item.time}</p>
    </div>
    {!item.read && <div className="h-2.5 w-2.5 rounded-full bg-royal-gold mt-1.5"></div>}
  </div>
);

export default function NotificationsPage() {
  return (
    <div className="p-4 sm:p-6">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline text-primary">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with alerts and offers.</p>
        </div>
        <Button variant="ghost" size="sm">
          Mark all as read
        </Button>
      </header>

      <Card className="shadow-elegant rounded-3xl">
        <CardContent className="p-2">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="offers">Offers</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <div className="flex flex-col">
                {[...notifications.system, ...notifications.offers, ...notifications.announcements]
                  .sort((a, b) => (a.read ? 1 : -1))
                  .map((item, index) => (
                    <NotificationItem key={index} item={item} />
                  ))}
              </div>
            </TabsContent>
            <TabsContent value="offers">
              <div className="flex flex-col">
                {notifications.offers.map((item, index) => (
                  <NotificationItem key={index} item={item} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="system">
              <div className="flex flex-col">
                {notifications.system.map((item, index) => (
                  <NotificationItem key={index} item={item} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
