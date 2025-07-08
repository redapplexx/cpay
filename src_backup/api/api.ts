import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express, { Request, Response } from 'express';
import cors from 'cors';

// Extend Express Request to include user data
interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
  };
  userData?: {
    uid: string;
    tenantId: string;
    role: string;
  };
}

const app = express();
const db = admin.firestore();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Authentication middleware
const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email ?? ''
    };
    // Fetch user data from Firestore
    const userSnapshot = await db.collectionGroup('users').where('uid', '==', req.user.uid).get();
    if (userSnapshot.empty) {
      return res.status(401).json({ error: 'User not found' });
    }
    const userData = userSnapshot.docs[0].data() as any;
    req.userData = {
      uid: userData.uid ?? '',
      tenantId: userData.tenantId ?? '',
      role: userData.role ?? ''
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Admin middleware
const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const userSnapshot = await db.collectionGroup('users').where('uid', '==', req.user.uid).get();
    if (userSnapshot.empty) {
      res.status(404).send('User not found');
      return;
    }

    const userData = userSnapshot.docs[0].data();
    if (userData.role !== 'admin') {
      res.status(403).send('Admin access required');
      return;
    }

    req.userData = userData;
    next();
  } catch (error) {
    res.status(500).send('Error checking admin status');
  }
};

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get user profile
app.get('/user/profile', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const userSnapshot = await db.collectionGroup('users').where('uid', '==', req.user.uid).get();
  if (userSnapshot.empty) {
    return res.status(404).json({ error: 'User not found' });
  }
  const userData = userSnapshot.docs[0].data();
  res.status(200).json(userData);
});

// Update user profile
app.put('/user/profile', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { fullName, birthDate, placeOfBirth, homeAddress, nationality, language } = req.body;
    
    const userSnapshot = await db.collectionGroup('users').where('uid', '==', req.user.uid).get();
    if (userSnapshot.empty) {
      res.status(404).send('User not found');
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    const updateData = {
      fullName: fullName || userData.fullName,
      birthDate: birthDate || userData.birthDate,
      placeOfBirth: placeOfBirth || userData.placeOfBirth,
      homeAddress: homeAddress || userData.homeAddress,
      nationality: nationality || userData.nationality,
      language: language || userData.language,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await userDoc.ref.update(updateData);

    res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).send('Error updating user profile');
  }
});

// Get user balance
app.get('/user/balance', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const userSnapshot = await db.collectionGroup('users').where('uid', '==', req.user.uid).get();
    if (userSnapshot.empty) {
      res.status(404).send('User not found');
      return;
    }

    const userData = userSnapshot.docs[0].data();
    res.status(200).json(userData.balance || { PHP: 0, KRW: 0, USD: 0 });
  } catch (error) {
    res.status(500).send('Error fetching user balance');
  }
});

// Get transaction history
app.get('/user/transactions', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { limit = 20, offset = 0, type, status } = req.query;
    
    const userSnapshot = await db.collectionGroup('users').where('uid', '==', req.user.uid).get();
    if (userSnapshot.empty) {
      res.status(404).send('User not found');
      return;
    }

    const userData = userSnapshot.docs[0].data();
    const tenantId = userData.tenantId;

    let query = db.collection('tenants').doc(tenantId).collection('transactions')
      .where('senderUid', '==', req.user.uid)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    if (type) {
      query = query.where('type', '==', type);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    const transactionsSnapshot = await query.get();
    const transactions = transactionsSnapshot.docs.map(doc => doc.data());

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).send('Error fetching transaction history');
  }
});

// Get notifications
app.get('/user/notifications', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { limit = 20, unreadOnly = false } = req.query;
    
    const userSnapshot = await db.collectionGroup('users').where('uid', '==', req.user.uid).get();
    if (userSnapshot.empty) {
      res.status(404).send('User not found');
      return;
    }

    const userData = userSnapshot.docs[0].data();
    const tenantId = userData.tenantId;

    let query = db.collection('tenants').doc(tenantId).collection('notifications')
      .where('userId', '==', req.user.uid)
      .orderBy('sentAt', 'desc')
      .limit(parseInt(limit as string));

    if (unreadOnly === 'true') {
      query = query.where('read', '==', false);
    }

    const notificationsSnapshot = await query.get();
    const notifications = notificationsSnapshot.docs.map(doc => doc.data());

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).send('Error fetching notifications');
  }
});

// Mark notification as read
app.put('/user/notifications/:notificationId/read', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { notificationId } = req.params;
    
    const userSnapshot = await db.collectionGroup('users').where('uid', '==', req.user.uid).get();
    if (userSnapshot.empty) {
      res.status(404).send('User not found');
      return;
    }

    const userData = userSnapshot.docs[0].data();
    const tenantId = userData.tenantId;

    const notificationRef = db.collection('tenants').doc(tenantId).collection('notifications').doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      res.status(404).send('Notification not found');
      return;
    }

    await notificationRef.update({
      read: true,
      readAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).send('Error updating notification');
  }
});

// Get FX rates
app.get('/fx-rates', async (req: Request, res: Response) => {
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const fxRatesDoc = await db.collection('fx_rates').doc(targetDate).get();
  
  if (!fxRatesDoc.exists) {
    res.status(404).send('FX rates not found for the specified date');
    return;
  }

  res.status(200).json(fxRatesDoc.data());
});

// Admin endpoints
app.get('/admin/users', authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userData) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { limit = 50, offset = 0, status, kycStatus } = req.query;
    
    let query = db.collection('tenants').doc(req.userData.tenantId).collection('users')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    if (status) {
      query = query.where('status', '==', status);
    }

    if (kycStatus) {
      query = query.where('kycStatus', '==', kycStatus);
    }

    const usersSnapshot = await query.get();
    const users = usersSnapshot.docs.map(doc => doc.data());

    res.status(200).json(users);
  } catch (error) {
    res.status(500).send('Error fetching users');
  }
});

app.get('/admin/transactions', authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userData) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { limit = 50, offset = 0, type, status, startDate, endDate } = req.query;
    
    let query = db.collection('tenants').doc(req.userData.tenantId).collection('transactions')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    if (type) {
      query = query.where('type', '==', type);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    if (startDate && endDate) {
      query = query.where('timestamp', '>=', new Date(startDate as string))
                   .where('timestamp', '<=', new Date(endDate as string));
    }

    const transactionsSnapshot = await query.get();
    const transactions = transactionsSnapshot.docs.map(doc => doc.data());

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).send('Error fetching transactions');
  }
});

app.get('/admin/kyc-submissions', authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userData) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { limit = 50, offset = 0, status } = req.query;
    
    let query = db.collection('tenants').doc(req.userData.tenantId).collection('kyc_submissions')
      .orderBy('submittedAt', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    if (status) {
      query = query.where('status', '==', status);
    }

    const submissionsSnapshot = await query.get();
    const submissions = submissionsSnapshot.docs.map(doc => doc.data());

    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).send('Error fetching KYC submissions');
  }
});

// Update KYC submission status
app.put('/admin/kyc-submissions/:submissionId', authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userData) return res.status(401).json({ error: 'Unauthorized' });
  const { submissionId } = req.params;
  const submissionRef = db.collection('tenants').doc(req.userData.tenantId).collection('kyc_submissions').doc(submissionId);
  const submissionDoc = await submissionRef.get();
  const submissionData = submissionDoc.data();
  if (!submissionData) return res.status(404).json({ error: 'Submission not found' });
  const userId = submissionData.userId;
  try {
    const { status, adminNotes } = req.body;

    // Update submission
    await submissionRef.update({
      status,
      adminReviewedBy: req.user.uid,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      adminNotes
    });

    // Update user KYC status
    const userRef = db.collection('tenants').doc(req.userData.tenantId).collection('users').doc(userId);
    await userRef.update({
      kycStatus: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update custom claims
    const customClaims = {
      kycStatus: status,
      kycTier: status === 'approved' ? 'enhanced' : 'basic'
    };
    await admin.auth().setCustomUserClaims(userId, customClaims);

    // Log KYC action
    await db.collection('tenants').doc(req.userData.tenantId).collection('kyc_logs').add({
      userId,
      tenantId: req.userData.tenantId,
      action: status,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: adminNotes || `KYC ${status} by admin`,
      adminId: req.user.uid
    });

    res.status(200).json({ success: true, message: 'KYC submission updated successfully' });
  } catch (error) {
    res.status(500).send('Error updating KYC submission');
  }
});

// Get system statistics
app.get('/admin/stats', authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userData) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const tenantId = req.userData.tenantId;

    // Get counts
    const [usersCount, transactionsCount, kycSubmissionsCount] = await Promise.all([
      db.collection('tenants').doc(tenantId).collection('users').count().get(),
      db.collection('tenants').doc(tenantId).collection('transactions').count().get(),
      db.collection('tenants').doc(tenantId).collection('kyc_submissions').count().get()
    ]);

    // Get recent activity
    const recentTransactions = await db.collection('tenants').doc(tenantId).collection('transactions')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    const stats = {
      users: usersCount.data().count,
      transactions: transactionsCount.data().count,
      kycSubmissions: kycSubmissionsCount.data().count,
      recentTransactions: recentTransactions.docs.map(doc => doc.data())
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).send('Error fetching statistics');
  }
});

// Export the API
export const api = functions.https.onRequest(app); 