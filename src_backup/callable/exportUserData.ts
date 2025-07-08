import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';

const db = admin.firestore();
const storage = admin.storage();

interface ExportRequest {
  type: 'transactions' | 'kyc' | 'ai_logs';
  format: 'pdf' | 'csv' | 'json';
  dateRange: {
    start: Date;
    end: Date;
  };
}

export const exportUserData = functions.https.onCall(async (data: ExportRequest, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { uid } = context.auth;
    const { type, format, dateRange } = data;

    // Get user data
    const userSnapshot = await db.collectionGroup('users').where('uid', '==', uid).get();
    if (userSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userSnapshot.docs[0].data();
    const tenantId = userData.tenantId;

    // Create export request record
    const exportRequestId = `export_${uid}_${Date.now()}`;
    const exportRequestRef = db.collection('tenants').doc(tenantId).collection('export_requests')
      .doc(exportRequestId);

    await exportRequestRef.set({
      id: exportRequestId,
      userId: uid,
      tenantId,
      type,
      format,
      dateRange: {
        start: admin.firestore.Timestamp.fromDate(dateRange.start),
        end: admin.firestore.Timestamp.fromDate(dateRange.end)
      },
      status: 'processing',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Fetch data based on type
    let dataToExport: any[] = [];

    switch (type) {
      case 'transactions':
        const transactionsSnapshot = await db.collection('tenants').doc(tenantId).collection('transactions')
          .where('senderUid', '==', uid)
          .where('timestamp', '>=', dateRange.start)
          .where('timestamp', '<=', dateRange.end)
          .orderBy('timestamp', 'desc')
          .get();

        const recipientTransactionsSnapshot = await db.collection('tenants').doc(tenantId).collection('transactions')
          .where('recipientUid', '==', uid)
          .where('timestamp', '>=', dateRange.start)
          .where('timestamp', '<=', dateRange.end)
          .orderBy('timestamp', 'desc')
          .get();

        dataToExport = [
          ...transactionsSnapshot.docs.map(doc => doc.data()),
          ...recipientTransactionsSnapshot.docs.map(doc => doc.data())
        ];
        break;

      case 'kyc':
        const kycSnapshot = await db.collection('tenants').doc(tenantId).collection('kyc_submissions')
          .where('userId', '==', uid)
          .where('submittedAt', '>=', dateRange.start)
          .where('submittedAt', '<=', dateRange.end)
          .orderBy('submittedAt', 'desc')
          .get();

        dataToExport = kycSnapshot.docs.map(doc => doc.data());
        break;

      case 'ai_logs':
        const aiLogsSnapshot = await db.collection('tenants').doc(tenantId).collection('ai_logs')
          .where('userId', '==', uid)
          .where('timestamp', '>=', dateRange.start)
          .where('timestamp', '<=', dateRange.end)
          .orderBy('timestamp', 'desc')
          .get();

        dataToExport = aiLogsSnapshot.docs.map(doc => doc.data());
        break;

      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid export type');
    }

    let fileUrl: string;

    // Generate file based on format
    switch (format) {
      case 'pdf':
        fileUrl = await generatePDFExport(dataToExport, type, userData);
        break;

      case 'csv':
        fileUrl = await generateCSVExport(dataToExport, type);
        break;

      case 'json':
        fileUrl = await generateJSONExport(dataToExport, type);
        break;

      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid export format');
    }

    // Update export request with completed status
    await exportRequestRef.update({
      status: 'completed',
      fileUrl,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      exportId: exportRequestId,
      fileUrl,
      recordCount: dataToExport.length
    };

  } catch (error) {
    console.error('Error exporting user data:', error);
    throw new functions.https.HttpsError('internal', 'Error exporting data');
  }
});

async function generatePDFExport(data: any[], type: string, userData: any): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const fileName = `exports/${userData.uid}/${type}_${Date.now()}.pdf`;
          const file = storage.bucket().file(fileName);

          await file.save(buffer, {
            metadata: {
              contentType: 'application/pdf',
              cacheControl: 'public, max-age=31536000'
            }
          });

          await file.makePublic();
          resolve(`https://storage.googleapis.com/${storage.bucket().name}/${fileName}`);
        } catch (error) {
          reject(error);
        }
      });

      // Add header
      doc.fontSize(24).text('CPay×eMango', { align: 'center' });
      doc.fontSize(16).text(`${type.toUpperCase()} Export`, { align: 'center' });
      doc.fontSize(12).text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Add user info
      doc.fontSize(14).text('User Information', { underline: true });
      doc.fontSize(10).text(`Name: ${userData.fullName || 'N/A'}`);
      doc.fontSize(10).text(`Email: ${userData.email || 'N/A'}`);
      doc.fontSize(10).text(`User ID: ${userData.uid}`);
      doc.moveDown();

      // Add data
      doc.fontSize(14).text('Data', { underline: true });
      doc.moveDown();

      data.forEach((item, index) => {
        if (index > 0) doc.moveDown(0.5);
        doc.fontSize(8).text(JSON.stringify(item, null, 2));
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function generateCSVExport(data: any[], type: string): Promise<string> {
  const csvStringifier = createObjectCsvWriter({
    header: Object.keys(data[0] || {}).map(key => ({ id: key, title: key }))
  });

  const csvContent = await csvStringifier.writeRecords(data);
  const fileName = `exports/${type}_${Date.now()}.csv`;
  const file = storage.bucket().file(fileName);

  await file.save(csvContent, {
    metadata: {
      contentType: 'text/csv',
      cacheControl: 'public, max-age=31536000'
    }
  });

  await file.makePublic();
  return `https://storage.googleapis.com/${storage.bucket().name}/${fileName}`;
}

async function generateJSONExport(data: any[], type: string): Promise<string> {
  const jsonContent = JSON.stringify(data, null, 2);
  const fileName = `exports/${type}_${Date.now()}.json`;
  const file = storage.bucket().file(fileName);

  await file.save(jsonContent, {
    metadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=31536000'
    }
  });

  await file.makePublic();
  return `https://storage.googleapis.com/${storage.bucket().name}/${fileName}`;
} 