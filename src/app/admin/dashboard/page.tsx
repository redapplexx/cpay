'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Activity,
  Shield,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { adminService, DashboardStats } from '@/lib/admin-service';
import WalletManager from '@/components/dashboard/WalletManager';
import LogOutput from '@/components/dashboard/LogOutput';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const dashboardStats = await adminService.getDashboardStats();
        setStats(dashboardStats);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor your fintech platform in real-time</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={stats.systemHealth === 'healthy' ? 'default' : 'destructive'}>
            {stats.systemHealth === 'healthy' ? <CheckCircle className="w-4 h-4 mr-1" /> : <AlertTriangle className="w-4 h-4 mr-1" />}
            System {stats.systemHealth}
          </Badge>
          <Badge variant="outline">
            <Activity className="w-4 h-4 mr-1" />
            {stats.uptime}% Uptime
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.activeUsers}</span> active this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalWallets)}</div>
            <p className="text-xs text-muted-foreground">
              Active digital wallets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaction Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalVolume)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.totalTransactions)} total transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
            <p className="text-xs text-muted-foreground">
              From transaction fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Recent system notifications and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.pendingKYC > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">{stats.pendingKYC} KYC Reviews Pending</p>
                    <p className="text-sm text-yellow-600">Requires immediate attention</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Review</Button>
              </div>
            )}

            {stats.pendingPayouts > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">{stats.pendingPayouts} Payouts Pending</p>
                    <p className="text-sm text-blue-600">Awaiting processing</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Process</Button>
              </div>
            )}

            {stats.openAMLFlags > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">{stats.openAMLFlags} AML Flags Open</p>
                    <p className="text-sm text-red-600">Requires investigation</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Investigate</Button>
              </div>
            )}

            {stats.pendingKYC === 0 && stats.pendingPayouts === 0 && stats.openAMLFlags === 0 && (
              <div className="flex items-center justify-center p-6 text-center">
                <div>
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">All systems operational</p>
                  <p className="text-sm text-green-600">No pending alerts</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Wallet className="mr-2 h-4 w-4" />
              View Wallets
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Transaction History
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              KYC Management
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Mission Control: WalletManager + LogOutput */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mt-8">
        <div className="lg:col-span-7">
          <WalletManager />
        </div>
        <div className="lg:col-span-3">
          <LogOutput />
        </div>
      </div>

      {/* Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
          <CardDescription>Detailed insights into platform performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.totalUsers)}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatNumber(stats.activeUsers)}</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{formatNumber(stats.totalWallets)}</div>
                  <div className="text-sm text-gray-600">Wallets</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{formatNumber(stats.totalTransactions)}</div>
                  <div className="text-sm text-gray-600">Transactions</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">User Growth</h4>
                  <div className="flex items-center space-x-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">+12.5%</span>
                    <span className="text-gray-600">this month</span>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Active Users</h4>
                  <div className="text-2xl font-bold">{formatNumber(stats.activeUsers)}</div>
                  <div className="text-sm text-gray-600">Last 30 days</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="transactions" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Total Volume</h4>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalVolume)}</div>
                  <div className="text-sm text-gray-600">All time</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Transaction Count</h4>
                  <div className="text-2xl font-bold">{formatNumber(stats.totalTransactions)}</div>
                  <div className="text-sm text-gray-600">Total transactions</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Pending KYC</h4>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingKYC}</div>
                  <div className="text-sm text-gray-600">Awaiting review</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">AML Flags</h4>
                  <div className="text-2xl font-bold text-red-600">{stats.openAMLFlags}</div>
                  <div className="text-sm text-gray-600">Open investigations</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">System Health</h4>
                  <div className="text-2xl font-bold text-green-600">{stats.uptime}%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
