'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Zap,
  Play,
  Settings,
  History,
  Upload,
  TestTube,
  Deploy,
  Monitor
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ModelVersion {
  version: string;
  modelType: 'FRAUD_DETECTION' | 'BEHAVIORAL_ANALYSIS' | 'TRANSACTION_CLASSIFICATION';
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
  };
  trainingMetrics: {
    trainingSamples: number;
    validationSamples: number;
    trainingTime: number;
    epochs: number;
    loss: number;
  };
  features: string[];
  hyperparameters: Record<string, any>;
  deployedAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

interface TrainingData {
  id: string;
  features: Record<string, number>;
  label: boolean;
  metadata: {
    transactionId?: string;
    userId: string;
    timestamp: Date;
    source: 'REAL_TRANSACTION' | 'SYNTHETIC' | 'VALIDATED';
  };
  createdAt: Date;
}

interface ModelEvaluation {
  modelType: string;
  evaluationPeriod: number;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  sampleSize: number;
  evaluatedAt: Date;
}

export default function MLModelsDashboard() {
  const [modelVersions, setModelVersions] = useState<ModelVersion[]>([]);
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [evaluations, setEvaluations] = useState<ModelEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModelType, setSelectedModelType] = useState<string>('FRAUD_DETECTION');
  const [isTraining, setIsTraining] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMLModels();
  }, []);

  const loadMLModels = async () => {
    try {
      setLoading(true);
      
      // Mock model versions data
      const mockModelVersions: ModelVersion[] = [
        {
          version: 'v1705123456789',
          modelType: 'FRAUD_DETECTION',
          performance: {
            accuracy: 0.942,
            precision: 0.918,
            recall: 0.895,
            f1Score: 0.906,
            auc: 0.923,
          },
          trainingMetrics: {
            trainingSamples: 8500,
            validationSamples: 2125,
            trainingTime: 45000,
            epochs: 100,
            loss: 0.156,
          },
          features: ['amount', 'timeOfDay', 'dayOfWeek', 'transactionFrequency', 'recipientRisk'],
          hyperparameters: {
            learningRate: 0.001,
            batchSize: 32,
            epochs: 100,
          },
          deployedAt: new Date('2024-01-15T10:30:00Z'),
          isActive: true,
          createdAt: new Date('2024-01-15T10:00:00Z'),
        },
        {
          version: 'v1705123456788',
          modelType: 'BEHAVIORAL_ANALYSIS',
          performance: {
            accuracy: 0.876,
            precision: 0.834,
            recall: 0.812,
            f1Score: 0.823,
            auc: 0.891,
          },
          trainingMetrics: {
            trainingSamples: 6200,
            validationSamples: 1550,
            trainingTime: 38000,
            epochs: 80,
            loss: 0.234,
          },
          features: ['loginFrequency', 'transactionFrequency', 'amountPattern', 'timePattern'],
          hyperparameters: {
            learningRate: 0.001,
            batchSize: 64,
            epochs: 80,
          },
          deployedAt: new Date('2024-01-14T15:45:00Z'),
          isActive: true,
          createdAt: new Date('2024-01-14T15:00:00Z'),
        },
        {
          version: 'v1705123456787',
          modelType: 'TRANSACTION_CLASSIFICATION',
          performance: {
            accuracy: 0.912,
            precision: 0.889,
            recall: 0.901,
            f1Score: 0.895,
            auc: 0.934,
          },
          trainingMetrics: {
            trainingSamples: 7800,
            validationSamples: 1950,
            trainingTime: 42000,
            epochs: 90,
            loss: 0.189,
          },
          features: ['amount', 'currency', 'transactionType', 'recipientType'],
          hyperparameters: {
            learningRate: 0.001,
            batchSize: 32,
            epochs: 90,
          },
          isActive: false,
          createdAt: new Date('2024-01-13T12:00:00Z'),
        },
      ];

      const mockTrainingData: TrainingData[] = [
        {
          id: 'training_001',
          features: { amount: 0.5, timeOfDay: 0.3, dayOfWeek: 0.2 },
          label: true,
          metadata: {
            transactionId: 'tx001',
            userId: 'user456',
            timestamp: new Date('2024-01-15T14:30:00Z'),
            source: 'REAL_TRANSACTION',
          },
          createdAt: new Date('2024-01-15T14:30:00Z'),
        },
        {
          id: 'training_002',
          features: { amount: 0.2, timeOfDay: 0.1, dayOfWeek: 0.1 },
          label: false,
          metadata: {
            transactionId: 'tx002',
            userId: 'user789',
            timestamp: new Date('2024-01-15T13:45:00Z'),
            source: 'REAL_TRANSACTION',
          },
          createdAt: new Date('2024-01-15T13:45:00Z'),
        },
      ];

      const mockEvaluations: ModelEvaluation[] = [
        {
          modelType: 'FRAUD_DETECTION',
          evaluationPeriod: 7,
          metrics: {
            accuracy: 0.938,
            precision: 0.912,
            recall: 0.889,
            f1Score: 0.900,
          },
          sampleSize: 1250,
          evaluatedAt: new Date('2024-01-15T16:00:00Z'),
        },
        {
          modelType: 'BEHAVIORAL_ANALYSIS',
          evaluationPeriod: 7,
          metrics: {
            accuracy: 0.867,
            precision: 0.823,
            recall: 0.801,
            f1Score: 0.812,
          },
          sampleSize: 890,
          evaluatedAt: new Date('2024-01-15T15:30:00Z'),
        },
      ];

      setModelVersions(mockModelVersions);
      setTrainingData(mockTrainingData);
      setEvaluations(mockEvaluations);
    } catch (error) {
      console.error('Error loading ML models:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ML models data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCollectTrainingData = async () => {
    try {
      setIsCollecting(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Success',
        description: 'Training data collection completed successfully',
      });
      
      loadMLModels(); // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to collect training data',
        variant: 'destructive',
      });
    } finally {
      setIsCollecting(false);
    }
  };

  const handleTrainModel = async (modelType: string) => {
    try {
      setIsTraining(true);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      toast({
        title: 'Success',
        description: `Model training completed for ${modelType}`,
      });
      
      loadMLModels(); // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to train model',
        variant: 'destructive',
      });
    } finally {
      setIsTraining(false);
    }
  };

  const handleDeployModel = async (version: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: `Model version ${version} deployed successfully`,
      });
      
      loadMLModels(); // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deploy model',
        variant: 'destructive',
      });
    }
  };

  const handleEvaluateModel = async (modelType: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Success',
        description: `Model evaluation completed for ${modelType}`,
      });
      
      loadMLModels(); // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to evaluate model',
        variant: 'destructive',
      });
    }
  };

  const getModelTypeIcon = (modelType: string) => {
    switch (modelType) {
      case 'FRAUD_DETECTION': return <Shield className="h-4 w-4" />;
      case 'BEHAVIORAL_ANALYSIS': return <Brain className="h-4 w-4" />;
      case 'TRANSACTION_CLASSIFICATION': return <BarChart3 className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getPerformanceColor = (value: number) => {
    if (value >= 0.9) return 'text-green-600';
    if (value >= 0.8) return 'text-yellow-600';
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
          <h1 className="text-3xl font-bold">ML Model Management</h1>
          <p className="text-muted-foreground">
            Train, deploy, and monitor machine learning models
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleCollectTrainingData} disabled={isCollecting}>
            {isCollecting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {isCollecting ? 'Collecting...' : 'Collect Data'}
          </Button>
          <Button onClick={() => loadMLModels()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Model Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modelVersions.filter(m => m.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently deployed models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Samples</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trainingData.length.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Available training data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((modelVersions.reduce((sum, m) => sum + m.performance.accuracy, 0) / modelVersions.length) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Training</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modelVersions.length > 0 ? 
                new Date(Math.max(...modelVersions.map(m => m.createdAt.getTime()))).toLocaleDateString() : 
                'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Most recent model training
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Model Management Tabs */}
      <Tabs defaultValue="models" className="space-y-4">
        <TabsList>
          <TabsTrigger value="models">Model Versions</TabsTrigger>
          <TabsTrigger value="training">Training Data</TabsTrigger>
          <TabsTrigger value="evaluation">Model Evaluation</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Versions</CardTitle>
              <CardDescription>
                All trained model versions with performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Model Type</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>F1 Score</TableHead>
                    <TableHead>Training Samples</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelVersions.map((model) => (
                    <TableRow key={model.version}>
                      <TableCell className="font-mono">{model.version}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getModelTypeIcon(model.modelType)}
                          <span>{model.modelType.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={getPerformanceColor(model.performance.accuracy)}>
                          {(model.performance.accuracy * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getPerformanceColor(model.performance.f1Score)}>
                          {(model.performance.f1Score * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {model.trainingMetrics.trainingSamples.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={model.isActive ? 'default' : 'secondary'}>
                          {model.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {!model.isActive && (
                            <Button
                              size="sm"
                              onClick={() => handleDeployModel(model.version)}
                            >
                              <Deploy className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Data</CardTitle>
              <CardDescription>
                Collected training data for model training
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingData.map((data) => (
                    <TableRow key={data.id}>
                      <TableCell className="font-mono">{data.id}</TableCell>
                      <TableCell className="font-mono">{data.metadata.userId}</TableCell>
                      <TableCell>
                        <Badge variant={data.label ? 'destructive' : 'default'}>
                          {data.label ? 'FRAUD' : 'LEGITIMATE'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {data.metadata.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {Object.keys(data.features).slice(0, 3).join(', ')}
                          {Object.keys(data.features).length > 3 && '...'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {data.createdAt.toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Evaluations</CardTitle>
              <CardDescription>
                Recent model performance evaluations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model Type</TableHead>
                    <TableHead>Evaluation Period</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Precision</TableHead>
                    <TableHead>Recall</TableHead>
                    <TableHead>F1 Score</TableHead>
                    <TableHead>Sample Size</TableHead>
                    <TableHead>Evaluated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((evaluation, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getModelTypeIcon(evaluation.modelType)}
                          <span>{evaluation.modelType.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>{evaluation.evaluationPeriod} days</TableCell>
                      <TableCell>
                        <span className={getPerformanceColor(evaluation.metrics.accuracy)}>
                          {(evaluation.metrics.accuracy * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getPerformanceColor(evaluation.metrics.precision)}>
                          {(evaluation.metrics.precision * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getPerformanceColor(evaluation.metrics.recall)}>
                          {(evaluation.metrics.recall * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getPerformanceColor(evaluation.metrics.f1Score)}>
                          {(evaluation.metrics.f1Score * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>{evaluation.sampleSize.toLocaleString()}</TableCell>
                      <TableCell>
                        {evaluation.evaluatedAt.toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Train New Model</CardTitle>
                <CardDescription>
                  Train a new model version with collected data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modelType">Model Type</Label>
                  <Select value={selectedModelType} onValueChange={setSelectedModelType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FRAUD_DETECTION">Fraud Detection</SelectItem>
                      <SelectItem value="BEHAVIORAL_ANALYSIS">Behavioral Analysis</SelectItem>
                      <SelectItem value="TRANSACTION_CLASSIFICATION">Transaction Classification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={() => handleTrainModel(selectedModelType)}
                  disabled={isTraining}
                  className="w-full"
                >
                  {isTraining ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Training...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Train Model
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evaluate Models</CardTitle>
                <CardDescription>
                  Evaluate model performance on recent data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="evalModelType">Model Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FRAUD_DETECTION">Fraud Detection</SelectItem>
                      <SelectItem value="BEHAVIORAL_ANALYSIS">Behavioral Analysis</SelectItem>
                      <SelectItem value="TRANSACTION_CLASSIFICATION">Transaction Classification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="evalPeriod">Evaluation Period (days)</Label>
                  <Input type="number" defaultValue={7} min={1} max={30} />
                </div>
                
                <Button 
                  onClick={() => handleEvaluateModel('FRAUD_DETECTION')}
                  className="w-full"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Evaluate Model
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Monitoring</CardTitle>
                <CardDescription>
                  Monitor active model performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fraud Detection</span>
                    <Badge variant="default">ACTIVE</Badge>
                  </div>
                  <Progress value={94.2} className="w-full" />
                  <span className="text-xs text-muted-foreground">94.2% accuracy</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Behavioral Analysis</span>
                    <Badge variant="default">ACTIVE</Badge>
                  </div>
                  <Progress value={87.6} className="w-full" />
                  <span className="text-xs text-muted-foreground">87.6% accuracy</span>
                </div>
                
                <Button className="w-full" variant="outline">
                  <Monitor className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Settings</CardTitle>
                <CardDescription>
                  Configure ML model parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="performanceThreshold">Performance Threshold</Label>
                  <Input type="number" defaultValue={90} min={0} max={100} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="retrainingSchedule">Auto-retraining Schedule</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 