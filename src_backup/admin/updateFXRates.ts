import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

const db = admin.firestore();

interface FXRateData {
  PHP: number;
  KRW: number;
  USD: number;
}

interface FXAPIResponse {
  success: boolean;
  rates?: {
    PHP?: number;
    KRW?: number;
    USD?: number;
  };
  error?: string;
}

// Fetch FX rates from external API
async function fetchFXRates(): Promise<FXRateData> {
  try {
    // Using a free FX API (you can replace with your preferred provider)
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
      timeout: 10000,
      headers: {
        'User-Agent': 'CPayX-eMango/1.0'
      }
    });

    if (response.data && response.data.rates) {
      const rates = response.data.rates;
      return {
        PHP: rates.PHP || 55.0, // Fallback rate
        KRW: rates.KRW || 1300.0, // Fallback rate
        USD: 1.0 // Base currency
      };
    }

    throw new Error('Invalid response from FX API');

  } catch (error) {
    console.error('Error fetching FX rates:', error);
    
    // Fallback to mock rates for demo purposes
    return {
      PHP: 55.0 + (Math.random() - 0.5) * 2, // 55 ± 1
      KRW: 1300.0 + (Math.random() - 0.5) * 50, // 1300 ± 25
      USD: 1.0
    };
  }
}

// Validate FX rates
function validateFXRates(rates: FXRateData): boolean {
  // Check for reasonable ranges
  if (rates.PHP < 50 || rates.PHP > 60) return false;
  if (rates.KRW < 1200 || rates.KRW > 1400) return false;
  if (rates.USD !== 1.0) return false;
  
  return true;
}

export const updateFXRates = functions.https.onRequest(async (req, res) => {
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
    // Verify authentication and admin role
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).send('Unauthorized');
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid } = decodedToken;

    // Check if user is admin
    const userSnapshot = await db.collectionGroup('users').where('uid', '==', uid).get();
    if (userSnapshot.empty) {
      res.status(404).send('User not found');
      return;
    }

    const userData = userSnapshot.docs[0].data();
    if (userData.role !== 'admin') {
      res.status(403).send('Admin access required');
      return;
    }

    const { manualRates, source = 'api' } = req.body;

    let fxRates: FXRateData;

    if (source === 'manual' && manualRates) {
      // Use manually provided rates
      fxRates = {
        PHP: parseFloat(manualRates.PHP),
        KRW: parseFloat(manualRates.KRW),
        USD: 1.0
      };

      if (!validateFXRates(fxRates)) {
        res.status(400).send('Invalid FX rates provided');
        return;
      }
    } else {
      // Fetch rates from API
      fxRates = await fetchFXRates();
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Check if rates already exist for today
    const existingRatesDoc = await db.collection('fx_rates').doc(today).get();

    if (existingRatesDoc.exists) {
      // Update existing rates
      await existingRatesDoc.ref.update({
        rates: fxRates,
        source,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: uid
      });
    } else {
      // Create new rates document
      await db.collection('fx_rates').doc(today).set({
        id: today,
        date: today,
        rates: fxRates,
        source,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: uid
      });
    }

    // Log the update
    await db.collection('tenants').doc(userData.tenantId).collection('access_logs').add({
      userId: uid,
      tenantId: userData.tenantId,
      action: 'fx_rates_updated',
      ipAddress: 'unknown',
      userAgent: 'cloud_function',
      deviceFingerprint: 'unknown',
      success: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: `FX rates updated for ${today}: PHP=${fxRates.PHP}, KRW=${fxRates.KRW}`
    });

    console.log(`FX rates updated for ${today}:`, fxRates);

    res.status(200).json({
      success: true,
      date: today,
      rates: fxRates,
      source
    });

  } catch (error) {
    console.error('Error updating FX rates:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Scheduled function to update FX rates daily
export const dailyFXRateUpdate = functions.pubsub
  .schedule('0 0 * * *') // Run daily at midnight
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('Running daily FX rate update');

      // Fetch new rates
      const fxRates = await fetchFXRates();

      if (!validateFXRates(fxRates)) {
        console.error('Invalid FX rates received, skipping update');
        return null;
      }

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Update rates
      await db.collection('fx_rates').doc(today).set({
        id: today,
        date: today,
        rates: fxRates,
        source: 'api',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'system'
      });

      console.log(`Daily FX rates updated for ${today}:`, fxRates);

      return null;
    } catch (error) {
      console.error('Error in daily FX rate update:', error);
      return null;
    }
  }); 