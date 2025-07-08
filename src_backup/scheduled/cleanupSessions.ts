import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Clean up expired sessions and old data
export const cleanupExpiredSessions = functions.pubsub
  .schedule('0 2 * * *') // Run daily at 2 AM
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('Starting cleanup of expired sessions and old data');

      const now = admin.firestore.Timestamp.now();
      const thirtyDaysAgo = new Date(now.toDate().getTime() - (30 * 24 * 60 * 60 * 1000));
      const sevenDaysAgo = new Date(now.toDate().getTime() - (7 * 24 * 60 * 60 * 1000));
      const oneDayAgo = new Date(now.toDate().getTime() - (24 * 60 * 60 * 1000));

      let totalCleaned = 0;

      // Clean up old access logs (older than 30 days)
      const accessLogsSnapshot = await db.collectionGroup('access_logs')
        .where('timestamp', '<', thirtyDaysAgo)
        .limit(1000) // Process in batches
        .get();

      const accessLogsToDelete = accessLogsSnapshot.docs;
      for (const doc of accessLogsToDelete) {
        await doc.ref.delete();
        totalCleaned++;
      }

      console.log(`Cleaned up ${accessLogsToDelete.length} old access logs`);

      // Clean up old AI logs (older than 30 days)
      const aiLogsSnapshot = await db.collectionGroup('ai_logs')
        .where('timestamp', '<', thirtyDaysAgo)
        .limit(1000)
        .get();

      const aiLogsToDelete = aiLogsSnapshot.docs;
      for (const doc of aiLogsToDelete) {
        await doc.ref.delete();
        totalCleaned++;
      }

      console.log(`Cleaned up ${aiLogsToDelete.length} old AI logs`);

      // Clean up old notifications (older than 7 days and read)
      const oldNotificationsSnapshot = await db.collectionGroup('notifications')
        .where('sentAt', '<', sevenDaysAgo)
        .where('read', '==', true)
        .limit(1000)
        .get();

      const notificationsToDelete = oldNotificationsSnapshot.docs;
      for (const doc of notificationsToDelete) {
        await doc.ref.delete();
        totalCleaned++;
      }

      console.log(`Cleaned up ${notificationsToDelete.length} old read notifications`);

      // Clean up failed export requests (older than 1 day)
      const failedExportsSnapshot = await db.collectionGroup('export_requests')
        .where('status', '==', 'failed')
        .where('createdAt', '<', oneDayAgo)
        .limit(1000)
        .get();

      const exportsToDelete = failedExportsSnapshot.docs;
      for (const doc of exportsToDelete) {
        await doc.ref.delete();
        totalCleaned++;
      }

      console.log(`Cleaned up ${exportsToDelete.length} failed export requests`);

      // Clean up old KYC logs (older than 90 days)
      const ninetyDaysAgo = new Date(now.toDate().getTime() - (90 * 24 * 60 * 60 * 1000));
      const oldKYCLogsSnapshot = await db.collectionGroup('kyc_logs')
        .where('timestamp', '<', ninetyDaysAgo)
        .limit(1000)
        .get();

      const kycLogsToDelete = oldKYCLogsSnapshot.docs;
      for (const doc of kycLogsToDelete) {
        await doc.ref.delete();
        totalCleaned++;
      }

      console.log(`Cleaned up ${kycLogsToDelete.length} old KYC logs`);

      // Clean up old device fingerprints (not seen in 60 days)
      const sixtyDaysAgo = new Date(now.toDate().getTime() - (60 * 24 * 60 * 60 * 1000));
      const oldDevicesSnapshot = await db.collectionGroup('device_fingerprints')
        .where('lastSeen', '<', sixtyDaysAgo)
        .where('isTrusted', '==', false)
        .limit(1000)
        .get();

      const devicesToDelete = oldDevicesSnapshot.docs;
      for (const doc of devicesToDelete) {
        await doc.ref.delete();
        totalCleaned++;
      }

      console.log(`Cleaned up ${devicesToDelete.length} old untrusted devices`);

      // Clean up old FX rates (older than 1 year)
      const oneYearAgo = new Date(now.toDate().getTime() - (365 * 24 * 60 * 60 * 1000));
      const oldFXRatesSnapshot = await db.collection('fx_rates')
        .where('updatedAt', '<', oneYearAgo)
        .limit(1000)
        .get();

      const fxRatesToDelete = oldFXRatesSnapshot.docs;
      for (const doc of fxRatesToDelete) {
        await doc.ref.delete();
        totalCleaned++;
      }

      console.log(`Cleaned up ${fxRatesToDelete.length} old FX rates`);

      // Clean up old blockchain transactions (older than 1 year)
      const oldBlockchainSnapshot = await db.collectionGroup('blockchain_transactions')
        .where('timestamp', '<', oneYearAgo)
        .limit(1000)
        .get();

      const blockchainToDelete = oldBlockchainSnapshot.docs;
      for (const doc of blockchainToDelete) {
        await doc.ref.delete();
        totalCleaned++;
      }

      console.log(`Cleaned up ${blockchainToDelete.length} old blockchain transactions`);

      // Clean up old AI queries (older than 30 days)
      const oldAIQueriesSnapshot = await db.collectionGroup('ai_queries')
        .where('timestamp', '<', thirtyDaysAgo)
        .limit(1000)
        .get();

      const aiQueriesToDelete = oldAIQueriesSnapshot.docs;
      for (const doc of aiQueriesToDelete) {
        await doc.ref.delete();
        totalCleaned++;
      }

      console.log(`Cleaned up ${aiQueriesToDelete.length} old AI queries`);

      // Log cleanup summary
      console.log(`Cleanup completed. Total records cleaned: ${totalCleaned}`);

      return null;

    } catch (error) {
      console.error('Error in cleanup process:', error);
      return null;
    }
  }); 