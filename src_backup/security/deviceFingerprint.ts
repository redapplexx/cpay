import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

const db = admin.firestore();

interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  canvasFingerprint?: string;
  webglFingerprint?: string;
  audioFingerprint?: string;
  fonts?: string[];
  plugins?: string[];
}

interface DeviceValidationResult {
  isValid: boolean;
  riskScore: number;
  isKnownDevice: boolean;
  isTrusted: boolean;
  recommendations: string[];
}

// Generate device fingerprint from device info
function generateDeviceFingerprint(deviceInfo: DeviceInfo): string {
  const fingerprintData = {
    userAgent: deviceInfo.userAgent,
    screenResolution: deviceInfo.screenResolution,
    timezone: deviceInfo.timezone,
    language: deviceInfo.language,
    platform: deviceInfo.platform,
    canvasFingerprint: deviceInfo.canvasFingerprint,
    webglFingerprint: deviceInfo.webglFingerprint,
    audioFingerprint: deviceInfo.audioFingerprint,
    fonts: deviceInfo.fonts?.sort().join(','),
    plugins: deviceInfo.plugins?.sort().join(',')
  };

  const fingerprintString = JSON.stringify(fingerprintData);
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
}

// Validate device fingerprint
function validateDeviceFingerprintInternal(
  fingerprint: string,
  deviceInfo: DeviceInfo,
  knownDevices: any[]
): DeviceValidationResult {
  let riskScore = 0;
  const recommendations: string[] = [];
  let isKnownDevice = false;
  let isTrusted = false;

  // Check if device is known
  const knownDevice = knownDevices.find(device => device.fingerprint === fingerprint);
  if (knownDevice) {
    isKnownDevice = true;
    isTrusted = knownDevice.isTrusted;
    riskScore = knownDevice.riskScore || 0;
  } else {
    // New device - calculate risk score
    riskScore = calculateNewDeviceRisk(deviceInfo);
    recommendations.push('New device detected. Consider enabling 2FA for additional security.');
  }

  // Check for suspicious patterns
  if (deviceInfo.userAgent.includes('bot') || deviceInfo.userAgent.includes('crawler')) {
    riskScore += 30;
    recommendations.push('Bot-like user agent detected.');
  }

  if (!deviceInfo.screenResolution || deviceInfo.screenResolution === '0x0') {
    riskScore += 20;
    recommendations.push('Invalid screen resolution detected.');
  }

  if (!deviceInfo.timezone || deviceInfo.timezone === 'UTC') {
    riskScore += 15;
    recommendations.push('Generic timezone detected.');
  }

  if (deviceInfo.platform === 'unknown' || !deviceInfo.platform) {
    riskScore += 10;
    recommendations.push('Unknown platform detected.');
  }

  // Check for missing fingerprinting data
  if (!deviceInfo.canvasFingerprint && !deviceInfo.webglFingerprint) {
    riskScore += 5;
    recommendations.push('Limited fingerprinting data available.');
  }

  // Normalize risk score
  riskScore = Math.min(riskScore, 100);

  return {
    isValid: riskScore < 80,
    riskScore,
    isKnownDevice,
    isTrusted,
    recommendations
  };
}

function calculateNewDeviceRisk(deviceInfo: DeviceInfo): number {
  let riskScore = 20; // Base risk for new devices

  // Check for common browser patterns
  const commonBrowsers = ['chrome', 'firefox', 'safari', 'edge'];
  const userAgentLower = deviceInfo.userAgent.toLowerCase();
  const hasCommonBrowser = commonBrowsers.some(browser => userAgentLower.includes(browser));
  
  if (!hasCommonBrowser) {
    riskScore += 25;
  }

  // Check for mobile vs desktop
  const isMobile = userAgentLower.includes('mobile') || userAgentLower.includes('android') || userAgentLower.includes('iphone');
  if (!isMobile && !userAgentLower.includes('desktop')) {
    riskScore += 10;
  }

  // Check for suspicious screen resolutions
  const suspiciousResolutions = ['0x0', '1x1', '100x100'];
  if (suspiciousResolutions.includes(deviceInfo.screenResolution)) {
    riskScore += 30;
  }

  return riskScore;
}

export const validateDeviceFingerprint = functions.https.onRequest(async (req, res) => {
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

    const { deviceInfo } = req.body;

    if (!deviceInfo) {
      res.status(400).send('Missing device info');
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

    // Generate fingerprint
    const fingerprint = generateDeviceFingerprint(deviceInfo);

    // Get known devices for this user
    const knownDevicesSnapshot = await db.collection('tenants').doc(tenantId).collection('device_fingerprints')
      .where('userId', '==', uid)
      .get();

    const knownDevices = knownDevicesSnapshot.docs.map(doc => doc.data());

    // Validate device
    const validationResult = validateDeviceFingerprintInternal(fingerprint, deviceInfo, knownDevices);

    // Update or create device record
    const deviceRef = db.collection('tenants').doc(tenantId).collection('device_fingerprints')
      .doc(fingerprint);

    const deviceDoc = await deviceRef.get();

    if (deviceDoc.exists) {
      // Update existing device
      await deviceRef.update({
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        riskScore: Math.max(deviceDoc.data()?.riskScore || 0, validationResult.riskScore),
        deviceInfo: {
          ...deviceDoc.data()?.deviceInfo,
          ...deviceInfo
        }
      });
    } else {
      // Create new device record
      await deviceRef.set({
        id: fingerprint,
        userId: uid,
        tenantId,
        fingerprint,
        deviceInfo,
        firstSeen: admin.firestore.FieldValue.serverTimestamp(),
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        isTrusted: false,
        riskScore: validationResult.riskScore
      });

      // Log new device detection
      await db.collection('tenants').doc(tenantId).collection('access_logs').add({
        userId: uid,
        tenantId,
        action: 'new_device_detected',
        ipAddress: 'unknown',
        userAgent: deviceInfo.userAgent || 'unknown',
        deviceFingerprint: fingerprint,
        success: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: `New device detected with risk score: ${validationResult.riskScore}`
      });
    }

    // Send security notification for high-risk devices
    if (validationResult.riskScore > 50 && !validationResult.isKnownDevice) {
      const notificationData = {
        userId: uid,
        tenantId,
        title: 'New Device Detected',
        body: `A new device was used to access your account. Please verify this was you.`,
        type: 'security',
        data: {
          deviceFingerprint: fingerprint,
          riskScore: validationResult.riskScore,
          platform: deviceInfo.platform,
          userAgent: deviceInfo.userAgent
        },
        read: false,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        fcmSent: false
      };

      await db.collection('tenants').doc(tenantId).collection('notifications').add(notificationData);
    }

    // Return validation result
    res.status(200).json({
      success: true,
      fingerprint,
      validation: validationResult
    });

  } catch (error) {
    console.error('Error validating device fingerprint:', error);
    res.status(500).send('Internal Server Error');
  }
}); 