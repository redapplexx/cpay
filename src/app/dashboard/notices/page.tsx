import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

export default function NoticesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tighter">Notices</h1>
        <p className="text-muted-foreground">Important announcements and promotions.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>No new notices</CardTitle>
          <CardDescription>Check back here for important updates.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-16">
            <div className="text-center text-muted-foreground">
                <Megaphone className="h-16 w-16 mx-auto mb-4" />
                <p>You're all caught up!</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
