import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const sendAnnouncement = functions.https.onCall(async (data, context) => {
  // 1. Authenticate and Authorize: Ensure the caller is an administrator.
  // This is a placeholder for actual authorization logic.
  // You would typically check the user's claims or roles.
  const uid = context.auth?.uid;
  if (!uid /* || !isAdmin(uid) */) { // Replace isAdmin(uid) with your authorization check
    throw new functions.https.HttpsError('permission-denied', 'User is not authorized to send announcements.');
  }

  const { title, body, recipientUids } = data;

  // 2. Validate Input Data
  if (!title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'Announcement title and body are required.');
  }

  const message: admin.messaging.Message = {
    notification: {
      title: title,
      body: body,
    },
    // Optional: Add data payload for custom handling in the app
    data: {
      type: 'announcement',
      // Add other relevant data here
    },
  };

  try {
    let response;
    if (recipientUids && Array.isArray(recipientUids) && recipientUids.length > 0) {
      // Targeted notification: Send to specific user tokens.
      // This requires fetching FCM registration tokens for the recipient UIDs.
      // This is a placeholder and needs actual implementation to fetch tokens.
      const registrationTokens: string[] = []; // Fetch tokens for recipientUids
      if (registrationTokens.length > 0) {
        response = await admin.messaging().sendMulticast({
            tokens: registrationTokens,
            notification: message.notification,
            data: message.data,
        });
        console.log('Successfully sent message to multiple tokens:', response);
      } else {
        console.log('No valid tokens found for targeted recipients.');
        return { status: 'success', message: 'No valid tokens found for targeted recipients.' };
      }
    } else {
      // Broadcast: Send to a topic (e.g., 'announcements') for all subscribed users.
      const topic = 'announcements';
      response = await admin.messaging().send({
        topic: topic,
        notification: message.notification,
        data: message.data,
      });
      console.log('Successfully sent message to topic:', response);
    }

    return { status: 'success', message: 'Announcement sent successfully.', fcmResponse: response };

  } catch (error) {
    console.error('Error sending announcement:', error);
    throw new functions.https.HttpsError('internal', 'Unable to send announcement.', error);
  }
});