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
  Brain, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity,
  Eye,
  Download,
  RefreshCw,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MLAnalytics {
  fraudDetectionMetrics: {
    totalTransactions: number;
    flaggedTransactions: number;
    fraudDetectionRate: number;
    averageConfidence: number;
    falsePositiveRate: number;
  };
  modelPerformance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    lastUpdated: string;
  };
  behavioralInsights: {
    anomalyDetections: number;
    riskPatterns: number;
    userSegments: number;
    behavioralScore: number;
  };
  mlKitUsage: {
    textRecognition: number;
    faceDetection: number;
    documentScanning: number;
    customModels: number;
  };
}

interface FraudDetection {
  transactionId: string;
  userId: string;
  fraudProbability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  detectedAt: string;
  features: string[];
}

interface ModelPrediction {
  modelName: string;
  predictionType: string;
  confidence: number;
  result: any;
  processingTime: number;
  timestamp: string;
}

interface BehavioralAnalysis {
  userId: string;
  behaviorScore: number;
  anomalyDetected: boolean;
  riskFactors: string[];
  lastAnalyzed: string;
}

export default function MLAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<MLAnalytics | null>(null);
  const [fraudDetections, setFraudDetections] = useState<FraudDetection[]>([]);
  const [modelPredictions, setModelPredictions] = useState<ModelPrediction[]>([]);
  const [behavioralAnalyses, setBehavioralAnalyses] = useState<BehavioralAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMLAnalytics();
  }, []);

  const loadMLAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock ML analytics data
      const mockAnalytics: MLAnalytics = {
        fraudDetectionMetrics: {
          totalTransactions: 12500,
          flaggedTransactions: 234,
          fraudDetectionRate: 1.87,
          averageConfidence: 87.5,
          falsePositiveRate: 12.3,
        },
        modelPerformance: {
          accuracy: 94.2,
          precision: 91.8,
          recall: 89.5,
          f1Score: 90.6,
          lastUpdated: '2024-01-15T10:30:00Z',
        },
        behavioralInsights: {
          anomalyDetections: 45,
          riskPatterns: 12,
          userSegments: 8,
          behavioralScore: 78.3,
        },
        mlKitUsage: {
          textRecognition: 1250,
          faceDetection: 890,
          documentScanning: 567,
          customModels: 234,
        },
      };

      const mockFraudDetections: FraudDetection[] = [
        {
          transactionId: 'tx001',
          userId: 'user456',
          fraudProbability: 0.85,
          riskLevel: 'HIGH',
          confidence: 0.92,
          detectedAt: '2024-01-15T14:30:00Z',
          features: ['HIGH_AMOUNT', 'UNUSUAL_TIME', 'RISKY_RECIPIENT'],
        },
        {
          transactionId: 'tx002',
          userId: 'user789',
          fraudProbability: 0.95,
          riskLevel: 'CRITICAL',
          confidence: 0.98,
          detectedAt: '2024-01-15T13:45:00Z',
          features: ['STRUCTURED_TRANSACTION', 'HIGH_FREQUENCY', 'SUSPICIOUS_LOCATION'],
        },
        {
          transactionId: 'tx003',
          userId: 'user123',
          fraudProbability: 0.65,
          riskLevel: 'MEDIUM',
          confidence: 0.78,
          detectedAt: '2024-01-15T12:15:00Z',
          features: ['UNUSUAL_AMOUNT', 'DEVICE_RISK'],
        },
      ];

      const mockModelPredictions: ModelPrediction[] = [
        {
          modelName: 'fraud_detection',
          predictionType: 'Transaction Risk',
          confidence: 0.92,
          result: { fraudProbability: 0.85, riskLevel: 'HIGH' },
          processingTime: 150,
          timestamp: '2024-01-15T14:30:00Z',
        },
        {
          modelName: 'transaction_classification',
          predictionType: 'Transaction Category',
          confidence: 0.88,
          result: { category: 'P2P_TRANSFER', confidence: 0.88 },
          processingTime: 89,
          timestamp: '2024-01-15T14:25:00Z',
        },
        {
          modelName: 'user_behavior_analysis',
          predictionType: 'Behavioral Risk',
          confidence: 0.76,
          result: { behaviorScore: 0.76, anomalyDetected: true },
          processingTime: 234,
          timestamp: '2024-01-15T14:20:00Z',
        },
      ];

      const mockBehavioralAnalyses: BehavioralAnalysis[] = [
        {
          userId: 'user456',
          behaviorScore: 0.85,
          anomalyDetected: true,
          riskFactors: ['UNUSUAL_TRANSACTION_PATTERN', 'HIGH_FREQUENCY'],
          lastAnalyzed: '2024-01-15T14:30:00Z',
        },
        {
          userId: 'user789',
          behaviorScore: 0.92,
          anomalyDetected: true,
          riskFactors: ['SUSPICIOUS_DEVICE', 'LOCATION_MISMATCH'],
          lastAnalyzed: '2024-01-15T13:45:00Z',
        },
        {
          userId: 'user123',
          behaviorScore: 0.34,
          anomalyDetected: false,
          riskFactors: [],
          lastAnalyzed: '2024-01-15T12:15:00Z',
        },
      ];

      setAnalytics(mockAnalytics);
      setFraudDetections(mockFraudDetections);
      setModelPredictions(mockModelPredictions);
      setBehavioralAnalyses(mockBehavioralAnalyses);
    } catch (error) {
      console.error('Error loading ML analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ML analytics data',
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
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
          <h1 className="text-3xl font-bold">ML Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Machine learning insights, fraud detection metrics, and AI-powered analytics
          </p>
        </div>
        <Button onClick={loadMLAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key ML Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fraud Detection Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.fraudDetectionMetrics.fraudDetectionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.fraudDetectionMetrics.flaggedTransactions} flagged transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.modelPerformance.accuracy}%</div>
            <Progress value={analytics?.modelPerformance.accuracy} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              F1 Score: {analytics?.modelPerformance.f1Score}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomaly Detections</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.behavioralInsights.anomalyDetections}</div>
            <p className="text-xs text-muted-foreground">
              Behavioral anomalies detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ML Kit Usage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.mlKitUsage.textRecognition + analytics?.mlKitUsage.faceDetection}</div>
            <p className="text-xs text-muted-foreground">
              Document & face processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance Alert */}
      {analytics && analytics.modelPerformance.accuracy < 95 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Model Performance Alert</AlertTitle>
          <AlertDescription>
            Model accuracy is below 95%. Consider retraining the model with new data.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed ML Analytics */}
      <Tabs defaultValue="fraud" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
          <TabsTrigger value="models">Model Predictions</TabsTrigger>
          <TabsTrigger value="behavior">Behavioral Analysis</TabsTrigger>
          <TabsTrigger value="performance">Model Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="fraud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection Results</CardTitle>
              <CardDescription>
                Real-time fraud detection using ML models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Fraud Probability</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Detected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fraudDetections.map((detection) => (
                    <TableRow key={detection.transactionId}>
                      <TableCell className="font-mono">{detection.transactionId}</TableCell>
                      <TableCell className="font-mono">{detection.userId}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={detection.fraudProbability * 100} className="w-16" />
                          <span className="text-sm">{(detection.fraudProbability * 100).toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskLevelColor(detection.riskLevel)}>
                          {detection.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={getConfidenceColor(detection.confidence)}>
                          {(detection.confidence * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {detection.features.map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(detection.detectedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Predictions</CardTitle>
              <CardDescription>
                Recent ML model predictions and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Prediction Type</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Processing Time</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelPredictions.map((prediction, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{prediction.modelName}</TableCell>
                      <TableCell>{prediction.predictionType}</TableCell>
                      <TableCell>
                        <span className={getConfidenceColor(prediction.confidence)}>
                          {(prediction.confidence * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {Object.entries(prediction.result).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{prediction.processingTime}ms</TableCell>
                      <TableCell>
                        {new Date(prediction.timestamp).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Behavioral Analysis</CardTitle>
              <CardDescription>
                User behavior analysis and anomaly detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Behavior Score</TableHead>
                    <TableHead>Anomaly Detected</TableHead>
                    <TableHead>Risk Factors</TableHead>
                    <TableHead>Last Analyzed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {behavioralAnalyses.map((analysis) => (
                    <TableRow key={analysis.userId}>
                      <TableCell className="font-mono">{analysis.userId}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={analysis.behaviorScore * 100} className="w-16" />
                          <span className="text-sm">{(analysis.behaviorScore * 100).toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={analysis.anomalyDetected ? 'destructive' : 'default'}>
                          {analysis.anomalyDetected ? 'YES' : 'NO'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {analysis.riskFactors.map((factor) => (
                            <Badge key={factor} variant="secondary" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(analysis.lastAnalyzed).toLocaleDateString()}
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

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Model Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators for ML models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Accuracy</span>
                    <span className="font-medium">{analytics?.modelPerformance.accuracy}%</span>
                  </div>
                  <Progress value={analytics?.modelPerformance.accuracy} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Precision</span>
                    <span className="font-medium">{analytics?.modelPerformance.precision}%</span>
                  </div>
                  <Progress value={analytics?.modelPerformance.precision} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Recall</span>
                    <span className="font-medium">{analytics?.modelPerformance.recall}%</span>
                  </div>
                  <Progress value={analytics?.modelPerformance.recall} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>F1 Score</span>
                    <span className="font-medium">{analytics?.modelPerformance.f1Score}%</span>
                  </div>
                  <Progress value={analytics?.modelPerformance.f1Score} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ML Kit Usage Statistics</CardTitle>
                <CardDescription>Usage metrics for Firebase ML Kit features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Text Recognition</span>
                    <span className="font-medium">{analytics?.mlKitUsage.textRecognition}</span>
                  </div>
                  <Progress value={(analytics?.mlKitUsage.textRecognition || 0) / 10} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Face Detection</span>
                    <span className="font-medium">{analytics?.mlKitUsage.faceDetection}</span>
                  </div>
                  <Progress value={(analytics?.mlKitUsage.faceDetection || 0) / 10} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Document Scanning</span>
                    <span className="font-medium">{analytics?.mlKitUsage.documentScanning}</span>
                  </div>
                  <Progress value={(analytics?.mlKitUsage.documentScanning || 0) / 10} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Custom Models</span>
                    <span className="font-medium">{analytics?.mlKitUsage.customModels}</span>
                  </div>
                  <Progress value={(analytics?.mlKitUsage.customModels || 0) / 10} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 