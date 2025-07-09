'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ThemeToggle } from '@/components/dashboard/theme-toggle';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
<<<<<<< HEAD
import { PasswordExpirationPrompt } from '@/components/auth/PasswordExpirationPrompt';
=======
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tighter">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and app preferences.
        </p>
      </div>

<<<<<<< HEAD
      <PasswordExpirationPrompt />

=======
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode-toggle">Dark Mode</Label>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language</CardTitle>
          <CardDescription>
            Choose your preferred language for the interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup defaultValue="english" className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="english" id="lang-en" />
              <Label htmlFor="lang-en">English</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="korean" id="lang-kr" disabled />
              <Label htmlFor="lang-kr" className="text-muted-foreground">한국어 (Korean)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Manage how you receive alerts and updates from us.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
                <Label htmlFor="push-notifs">Push Notifications</Label>
                <Switch id="push-notifs" defaultChecked />
            </div>
             <div className="flex items-center justify-between">
                <Label htmlFor="email-notifs">Email Notifications</Label>
                <Switch id="email-notifs" defaultChecked />
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
<<<<<<< HEAD
          <CardTitle>Security &amp; Privacy</CardTitle>
=======
          <CardTitle>Security & Privacy</CardTitle>
>>>>>>> a5dccd17e1ecf3d6883cf1f61b4d531b45beabd3
          <CardDescription>
            Manage your password, devices, and view legal documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
            <Button variant="ghost" className="w-full justify-between h-auto py-3 px-2">
                <span>Manage Devices</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" className="w-full justify-between h-auto py-3 px-2">
                <span>Change Password</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" className="w-full justify-between h-auto py-3 px-2">
                <span>Two-Factor Authentication (2FA)</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
           <CardDescription>
            Legal documents and app information.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
            <Button variant="ghost" className="w-full justify-between h-auto py-3 px-2">
                <span>Terms of Service</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" className="w-full justify-between h-auto py-3 px-2">
                <span>Privacy Policy</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
