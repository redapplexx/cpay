import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

const db = admin.firestore();

// Initialize email transporter
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

interface NotificationData {
  userId: string;
  tenantId: string;
  title: string;
  body: string;
  type: 'transaction' | 'kyc' | 'security' | 'promotional';
  data?: Record<string, any>;
  read: boolean;
  sentAt: any;
  fcmSent: boolean;
  fcmSentAt?: any;
}

export const sendNotification = functions.firestore
  .document('tenants/{tenantId}/notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    try {
      const { tenantId, notificationId } = context.params;
      const notificationData = snap.data() as NotificationData;
      const { userId, title, body, type, data } = notificationData;

      console.log(`Sending notification ${notificationId} to user ${userId}`);

      // Get user data
      const userDoc = await db.collection('tenants').doc(tenantId).collection('users').doc(userId).get();
      if (!userDoc.exists) {
        console.log(`User ${userId} not found`);
        return;
      }

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;
      const email = userData?.email;
      const mobileNumber = userData?.mobileNumber;

      // Send FCM push notification
      if (fcmToken) {
        try {
          const message = {
            token: fcmToken,
            notification: {
              title,
              body
            },
            data: {
              type,
              notificationId,
              ...data
            },
            android: {
              priority: 'high' as const,
              notification: {
                sound: 'default',
                channelId: 'transactions'
              }
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1
                }
              }
            }
          };

          const response = await admin.messaging().send(message);
          console.log('FCM notification sent:', response);

          // Update notification with FCM sent status
          await snap.ref.update({
            fcmSent: true,
            fcmSentAt: admin.firestore.FieldValue.serverTimestamp()
          });

        } catch (error) {
          console.error('Error sending FCM notification:', error);
          
          // Update notification with FCM error
          await snap.ref.update({
            fcmSent: false,
            fcmError: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Send email notification for important types
      if (email && (type === 'security' || type === 'kyc' || type === 'transaction')) {
        try {
          const emailContent = generateEmailContent(title, body, type, data);
          
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `CPay×eMango - ${title}`,
            html: emailContent
          };

          await emailTransporter.sendMail(mailOptions);
          console.log('Email notification sent to:', email);

        } catch (error) {
          console.error('Error sending email notification:', error);
        }
      }

      // Send SMS notification for security alerts
      if (mobileNumber && type === 'security') {
        try {
          // This would integrate with Twilio or similar SMS service
          // For now, we'll just log it
          console.log(`SMS notification would be sent to ${mobileNumber}: ${body}`);
          
        } catch (error) {
          console.error('Error sending SMS notification:', error);
        }
      }

      console.log(`Notification ${notificationId} processed successfully`);

    } catch (error) {
      console.error('Error processing notification:', error);
      throw error;
    }
  });

function generateEmailContent(title: string, body: string, type: string, data?: Record<string, any>): string {
  const baseUrl = process.env.APP_URL || 'https://cpayx-emango.com';
  
  let emailBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CPay×eMango Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CPay×eMango</h1>
          <p>${title}</p>
        </div>
        <div class="content">
          <p>${body}</p>
  `;

  // Add type-specific content
  if (type === 'transaction' && data) {
    emailBody += `
      <div class="alert">
        <strong>Transaction Details:</strong><br>
        Amount: ${data.amount} ${data.currency}<br>
        Reference: ${data.transactionId}<br>
        <a href="${baseUrl}/dashboard/activity" class="button">View Transaction</a>
      </div>
    `;
  }

  if (type === 'security') {
    emailBody += `
      <div class="alert">
        <strong>Security Notice:</strong><br>
        If you didn't initiate this action, please contact support immediately.<br>
        <a href="${baseUrl}/support" class="button">Contact Support</a>
      </div>
    `;
  }

  if (type === 'kyc' && data) {
    emailBody += `
      <div class="alert">
        <strong>KYC Status:</strong> ${data.status}<br>
        <a href="${baseUrl}/dashboard/profile" class="button">View Profile</a>
      </div>
    `;
  }

  emailBody += `
        </div>
        <div class="footer">
          <p>This is an automated message from CPay×eMango. Please do not reply to this email.</p>
          <p>If you have questions, contact us at support@cpayx-emango.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return emailBody;
} 