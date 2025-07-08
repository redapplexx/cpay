import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

const db = admin.firestore();

interface AccessLogData {
  userId: string;
  tenantId: string;
  action: 'login' | 'logout' | 'transaction' | 'kyc_submission' | 'profile_update' | 'blockchain_recorded';
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  location?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  success: boolean;
  errorMessage?: string;
}

interface LocationData {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
}

// Get location data from IP address
async function getLocationFromIP(ipAddress: string): Promise<LocationData | null> {
  try {
    // Skip local IPs
    if (ipAddress.startsWith('127.') || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
      return null;
    }

    const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
      timeout: 5000
    });

    if (response.data.status === 'success') {
      return {
        country: response.data.country,
        city: response.data.city,
        latitude: response.data.lat,
        longitude: response.data.lon
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return null;
  }
}

// Calculate risk score based on access patterns
function calculateAccessRiskScore(
  userId: string,
  ipAddress: string,
  deviceFingerprint: string,
  action: string,
  location?: LocationData
): number {
  let riskScore = 0;

  // High-risk actions
  if (action === 'transaction' || action === 'kyc_submission') {
    riskScore += 10;
  }

  // New IP address (would need to check against user's known IPs)
  // For demo purposes, we'll use a simple heuristic
  if (ipAddress && !ipAddress.startsWith('127.')) {
    riskScore += 5;
  }

  // New device fingerprint
  if (deviceFingerprint && deviceFingerprint !== 'unknown') {
    riskScore += 5;
  }

  // Location-based risk (simplified)
  if (location) {
    // High-risk countries (example)
    const highRiskCountries = ['XX', 'YY', 'ZZ']; // Replace with actual high-risk country codes
    if (highRiskCountries.includes(location.country)) {
      riskScore += 20;
    }
  }

  return Math.min(riskScore, 100);
}

export const logAccess = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).send('Unauthorized');
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid } = decodedToken;

    const { action, ipAddress, userAgent, deviceFingerprint, success, errorMessage } = req.body;

    if (!action || !uid) {
      res.status(400).send('Missing required fields');
      return;
    }

    // Get user data
    const userSnapshot = await db.collectionGroup('users').where('uid', '==', uid).get();
    if (userSnapshot.empty) {
      res.status(404).send('User not found');
      return;
    }

    const userData = userSnapshot.docs[0].data();
    const tenantId = userData.tenantId;

    // Get location from IP
    const location = await getLocationFromIP(ipAddress);

    // Calculate risk score
    const riskScore = calculateAccessRiskScore(uid, ipAddress, deviceFingerprint, action, location);

    // Create access log
    const accessLogData: AccessLogData = {
      userId: uid,
      tenantId,
      action,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      deviceFingerprint: deviceFingerprint || 'unknown',
      location,
      success: success !== false,
      errorMessage
    };

    await db.collection('tenants').doc(tenantId).collection('access_logs').add({
      ...accessLogData,
      riskScore,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update device fingerprint record
    if (deviceFingerprint && deviceFingerprint !== 'unknown') {
      const deviceRef = db.collection('tenants').doc(tenantId).collection('device_fingerprints')
        .doc(deviceFingerprint);

      const deviceDoc = await deviceRef.get();
      
      if (deviceDoc.exists) {
        // Update existing device
        await deviceRef.update({
          lastSeen: admin.firestore.FieldValue.serverTimestamp(),
          riskScore: Math.max(deviceDoc.data()?.riskScore || 0, riskScore)
        });
      } else {
        // Create new device record
        await deviceRef.set({
          id: deviceFingerprint,
          userId: uid,
          tenantId,
          fingerprint: deviceFingerprint,
          deviceInfo: {
            userAgent: userAgent || 'unknown',
            screenResolution: 'unknown',
            timezone: 'unknown',
            language: 'unknown',
            platform: 'unknown'
          },
          firstSeen: admin.firestore.FieldValue.serverTimestamp(),
          lastSeen: admin.firestore.FieldValue.serverTimestamp(),
          isTrusted: false,
          riskScore
        });
      }
    }

    // Check for suspicious activity
    if (riskScore > 50) {
      // Send security alert
      const notificationData = {
        userId: uid,
        tenantId,
        title: 'Security Alert',
        body: `Suspicious activity detected. Please verify this was you.`,
        type: 'security',
        data: {
          action,
          ipAddress,
          location: location ? `${location.city}, ${location.country}` : 'Unknown',
          riskScore
        },
        read: false,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        fcmSent: false
      };

      await db.collection('tenants').doc(tenantId).collection('notifications').add(notificationData);

      // Log security alert
      await db.collection('tenants').doc(tenantId).collection('access_logs').add({
        userId: uid,
        tenantId,
        action: 'security_alert',
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        deviceFingerprint: deviceFingerprint || 'unknown',
        location,
        success: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: `High risk activity detected (score: ${riskScore})`
      });
    }

    res.status(200).json({ success: true, riskScore });

  } catch (error) {
    console.error('Error logging access:', error);
    res.status(500).send('Internal Server Error');
  }
}); 