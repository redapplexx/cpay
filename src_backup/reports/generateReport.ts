import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';

const db = admin.firestore();

export const generateTransactionReport = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = context.auth;
  const { tenantId, dateRange, format = 'pdf' } = data;

  if (!tenantId || !dateRange) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  try {
    // Get user data
    const userSnapshot = await db.collection('tenants').doc(tenantId).collection('users')
      .where('uid', '==', uid)
      .get();

    if (userSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userSnapshot.docs[0].data();

    // Get transactions for the date range
    const transactionsSnapshot = await db.collection('tenants').doc(tenantId).collection('transactions')
      .where('senderUid', '==', uid)
      .where('timestamp', '>=', dateRange.start)
      .where('timestamp', '<=', dateRange.end)
      .orderBy('timestamp', 'desc')
      .get();

    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Generate report based on format
    if (format === 'pdf') {
      return await generatePDFReport(userData, transactions, dateRange);
    } else if (format === 'csv') {
      return await generateCSVReport(userData, transactions, dateRange);
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'Unsupported format');
    }
  } catch (error) {
    console.error('Error generating report:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate report');
  }
});

async function generatePDFReport(userData: any, transactions: any[], dateRange: any) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const result = Buffer.concat(chunks);
      resolve({
        format: 'pdf',
        data: result.toString('base64'),
        filename: `transaction_report_${new Date().toISOString().split('T')[0]}.pdf`
      });
    });

    // Generate PDF content
    doc.fontSize(20).text('Transaction Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`User: ${userData.fullName}`);
    doc.text(`Period: ${dateRange.start.toDate().toLocaleDateString()} - ${dateRange.end.toDate().toLocaleDateString()}`);
    doc.moveDown();

    // Add transaction table
    if (transactions.length > 0) {
      doc.fontSize(14).text('Transactions:');
      doc.moveDown();
      
      transactions.forEach((txn, index) => {
        doc.fontSize(10).text(`${index + 1}. ${txn.type} - ${txn.amount} ${txn.sourceCurrency} - ${txn.status}`);
      });
    } else {
      doc.fontSize(12).text('No transactions found for this period.');
    }

    doc.end();
  });
}

async function generateCSVReport(userData: any, transactions: any[], dateRange: any) {
  const csvStringifier = createObjectCsvWriter({
    header: Object.keys(transactions[0] || {}).map(key => ({ id: key, title: key }))
  });

  const records = transactions.map(txn => ({
    id: txn.id,
    type: txn.type,
    amount: txn.amount,
    currency: txn.sourceCurrency,
    status: txn.status,
    timestamp: txn.timestamp.toDate().toISOString()
  }));

  const csvContent = await csvStringifier.writeRecords(records);

  return {
    format: 'csv',
    data: csvContent,
    filename: `transaction_report_${new Date().toISOString().split('T')[0]}.csv`
  };
} 