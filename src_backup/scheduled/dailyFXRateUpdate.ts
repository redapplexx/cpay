import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

const db = admin.firestore();

export const dailyFXRateUpdate = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
  try {
    console.log('Starting daily FX rate update...');

    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Fetch FX rates from external API (simulated)
    const fxRates = await fetchFXRatesFromAPI();

    // Store in Firestore
    await db.collection('fx_rates').doc(today).set({
      date: today,
      rates: fxRates,
      source: 'api',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'system'
    });

    console.log(`FX rates updated for ${today}:`, fxRates);

    // Send notification to admins about successful update
    await notifyAdminsOfFXUpdate(fxRates);

    return null;
  } catch (error) {
    console.error('Error updating FX rates:', error);
    
    // Send error notification to admins
    await notifyAdminsOfFXUpdateError(error);
    
    throw error;
  }
});

async function fetchFXRatesFromAPI() {
  try {
    // Simulate API call to external FX rate provider
    // In production, replace with actual API endpoint
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
      timeout: 10000
    });

    const rates = response.data.rates;
    
    return {
      PHP: rates.PHP || 55.0, // Fallback rate
      KRW: rates.KRW || 1300.0, // Fallback rate
      USD: 1.0 // Base currency
    };
  } catch (error) {
    console.error('Error fetching FX rates from API:', error);
    
    // Return fallback rates if API fails
    return {
      PHP: 55.0,
      KRW: 1300.0,
      USD: 1.0
    };
  }
}

async function notifyAdminsOfFXUpdate(rates: any) {
  try {
    // Get all admin users
    const adminSnapshot = await db.collectionGroup('users')
      .where('role', '==', 'admin')
      .get();

    const notifications = adminSnapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        userId: userData.uid,
        tenantId: userData.tenantId,
        title: 'FX Rates Updated',
        body: `Daily FX rates have been updated. PHP: ${rates.PHP}, KRW: ${rates.KRW}`,
        type: 'promotional',
        data: {
          type: 'fx_update',
          rates
        },
        read: false,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        fcmSent: false
      };
    });

    // Batch write notifications
    const batch = db.batch();
    notifications.forEach(notification => {
      const notificationRef = db.collection('tenants')
        .doc(notification.tenantId)
        .collection('notifications')
        .doc();
      batch.set(notificationRef, notification);
    });

    await batch.commit();
    console.log(`Sent FX update notifications to ${notifications.length} admins`);
  } catch (error) {
    console.error('Error sending FX update notifications:', error);
  }
}

async function notifyAdminsOfFXUpdateError(error: any) {
  try {
    // Get all admin users
    const adminSnapshot = await db.collectionGroup('users')
      .where('role', '==', 'admin')
      .get();

    const notifications = adminSnapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        userId: userData.uid,
        tenantId: userData.tenantId,
        title: 'FX Rates Update Failed',
        body: 'Daily FX rates update failed. Please check the system logs.',
        type: 'security',
        data: {
          type: 'fx_update_error',
          error: error.message
        },
        read: false,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        fcmSent: false
      };
    });

    // Batch write notifications
    const batch = db.batch();
    notifications.forEach(notification => {
      const notificationRef = db.collection('tenants')
        .doc(notification.tenantId)
        .collection('notifications')
        .doc();
      batch.set(notificationRef, notification);
    });

    await batch.commit();
    console.log(`Sent FX update error notifications to ${notifications.length} admins`);
  } catch (notifyError) {
    console.error('Error sending FX update error notifications:', notifyError);
  }
} 