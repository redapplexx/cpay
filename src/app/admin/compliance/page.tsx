'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  TrendingUp, 
  FileText, 
  Activity,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ComplianceMetrics {
  totalUsers: number;
  kycComplianceRate: number;
  suspiciousActivityCount: number;
  riskAssessmentCount: number;
  totalVolume: number;
  totalTransactions: number;
}

interface RiskAssessment {
  userId: string;
  assessmentType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  overallRiskScore: number;
  assessmentDate: string;
}

interface SuspiciousActivity {
  transactionId: string;
  userId: string;
  flags: string[];
  amount: number;
  timestamp: string;
  status: string;
}

interface KycSubmission {
  userId: string;
  level: string;
  status: string;
  riskScore: number;
  createdAt: string;
}

export default function ComplianceDashboard() {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [kycSubmissions, setKycSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      // Mock data - in production, fetch from your Cloud Functions
      const mockMetrics: ComplianceMetrics = {
        totalUsers: 1250,
        kycComplianceRate: 87.5,
        suspiciousActivityCount: 23,
        riskAssessmentCount: 156,
        totalVolume: 45000000,
        totalTransactions: 8900,
      };

      const mockRiskAssessments: RiskAssessment[] = [
        {
          userId: 'user123',
          assessmentType: 'KYC',
          riskLevel: 'LOW',
          overallRiskScore: 0.2,
          assessmentDate: '2024-01-15T10:30:00Z',
        },
        {
          userId: 'user456',
          assessmentType: 'TRANSACTION',
          riskLevel: 'HIGH',
          overallRiskScore: 0.8,
          assessmentDate: '2024-01-15T09:15:00Z',
        },
        {
          userId: 'user789',
          assessmentType: 'BEHAVIORAL',
          riskLevel: 'CRITICAL',
          overallRiskScore: 0.95,
          assessmentDate: '2024-01-15T08:45:00Z',
        },
      ];

      const mockSuspiciousActivities: SuspiciousActivity[] = [
        {
          transactionId: 'tx001',
          userId: 'user456',
          flags: ['STRUCTURED_TRANSACTION', 'HIGH_FREQUENCY'],
          amount: 495000,
          timestamp: '2024-01-15T14:30:00Z',
          status: 'PENDING_REVIEW',
        },
        {
          transactionId: 'tx002',
          userId: 'user789',
          flags: ['UNUSUAL_AMOUNT', 'RAPID_FUND_MOVEMENT'],
          amount: 750000,
          timestamp: '2024-01-15T13:45:00Z',
          status: 'FLAGGED',
        },
      ];

      const mockKycSubmissions: KycSubmission[] = [
        {
          userId: 'user123',
          level: 'ENHANCED',
          status: 'VERIFIED',
          riskScore: 0.2,
          createdAt: '2024-01-15T12:00:00Z',
        },
        {
          userId: 'user456',
          level: 'FULL',
          status: 'UNDER_REVIEW',
          riskScore: 0.7,
          createdAt: '2024-01-15T11:30:00Z',
        },
        {
          userId: 'user789',
          level: 'BASIC',
          status: 'REJECTED',
          riskScore: 0.9,
          createdAt: '2024-01-15T10:15:00Z',
        },
      ];

      setMetrics(mockMetrics);
      setRiskAssessments(mockRiskAssessments);
      setSuspiciousActivities(mockSuspiciousActivities);
      setKycSubmissions(mockKycSubmissions);
    } catch (error) {
      console.error('Error loading compliance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load compliance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor KYC compliance, risk assessments, and suspicious activities
          </p>
        </div>
        <Button onClick={loadComplianceData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.kycComplianceRate}%</div>
            <Progress value={metrics?.kycComplianceRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Verified users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activities</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.suspiciousActivityCount}</div>
            <p className="text-xs text-muted-foreground">
              Flagged transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Assessments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.riskAssessmentCount}</div>
            <p className="text-xs text-muted-foreground">
              Completed assessments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {metrics && metrics.suspiciousActivityCount > 10 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High Suspicious Activity</AlertTitle>
          <AlertDescription>
            {metrics.suspiciousActivityCount} suspicious activities detected. Review flagged transactions immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Views */}
      <Tabs defaultValue="kyc" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kyc">KYC Submissions</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessments</TabsTrigger>
          <TabsTrigger value="suspicious">Suspicious Activities</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="kyc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>KYC Submissions</CardTitle>
              <CardDescription>
                Monitor KYC verification status and levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kycSubmissions.map((submission) => (
                    <TableRow key={submission.userId}>
                      <TableCell className="font-mono">{submission.userId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.level}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={submission.riskScore * 100} className="w-16" />
                          <span className="text-sm">{(submission.riskScore * 100).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessments</CardTitle>
              <CardDescription>
                View detailed risk assessments and scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskAssessments.map((assessment) => (
                    <TableRow key={`${assessment.userId}-${assessment.assessmentType}`}>
                      <TableCell className="font-mono">{assessment.userId}</TableCell>
                      <TableCell>{assessment.assessmentType}</TableCell>
                      <TableCell>
                        <Badge className={getRiskLevelColor(assessment.riskLevel)}>
                          {assessment.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={assessment.overallRiskScore * 100} className="w-16" />
                          <span className="text-sm">{(assessment.overallRiskScore * 100).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(assessment.assessmentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suspicious" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suspicious Activities</CardTitle>
              <CardDescription>
                Monitor flagged transactions and suspicious patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suspiciousActivities.map((activity) => (
                    <TableRow key={activity.transactionId}>
                      <TableCell className="font-mono">{activity.transactionId}</TableCell>
                      <TableCell className="font-mono">{activity.userId}</TableCell>
                      <TableCell>₱{activity.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {activity.flags.map((flag) => (
                            <Badge key={flag} variant="secondary" className="text-xs">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>
                Generate and download regulatory reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Daily Report</CardTitle>
                    <CardDescription>Daily compliance snapshot</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Daily Report
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Monthly Report</CardTitle>
                    <CardDescription>Monthly compliance summary</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Monthly Report
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Suspicious Transaction Report</CardTitle>
                    <CardDescription>STR for AMLC submission</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate STR
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Risk Assessment Report</CardTitle>
                    <CardDescription>Comprehensive risk analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      <Activity className="h-4 w-4 mr-2" />
                      Generate Risk Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 