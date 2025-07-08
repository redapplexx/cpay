import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';

const db = admin.firestore();
const storage = admin.storage();

interface MonthlyReportData {
  userId: string;
  tenantId: string;
  month: string;
  year: string;
  totalTransactions: number;
  totalAmount: number;
  totalFees: number;
  transactions: any[];
  summary: {
    cashIn: { count: number; amount: number };
    cashOut: { count: number; amount: number };
    p2p: { count: number; amount: number };
  };
}

// Generate PDF report
async function generatePDFReport(reportData: MonthlyReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add header
      doc.fontSize(24).text('CPay×eMango', { align: 'center' });
      doc.fontSize(16).text('Monthly Transaction Report', { align: 'center' });
      doc.fontSize(12).text(`${reportData.month} ${reportData.year}`, { align: 'center' });
      doc.moveDown(2);

      // Add summary
      doc.fontSize(14).text('Summary', { underline: true });
      doc.fontSize(10).text(`Total Transactions: ${reportData.totalTransactions}`);
      doc.fontSize(10).text(`Total Amount: ${reportData.totalAmount.toFixed(2)}`);
      doc.fontSize(10).text(`Total Fees: ${reportData.totalFees.toFixed(2)}`);
      doc.moveDown();

      // Add breakdown
      doc.fontSize(12).text('Transaction Breakdown:', { underline: true });
      doc.fontSize(10).text(`Cash-In: ${reportData.summary.cashIn.count} transactions, ${reportData.summary.cashIn.amount.toFixed(2)} total`);
      doc.fontSize(10).text(`Cash-Out: ${reportData.summary.cashOut.count} transactions, ${reportData.summary.cashOut.amount.toFixed(2)} total`);
      doc.fontSize(10).text(`P2P Transfers: ${reportData.summary.p2p.count} transactions, ${reportData.summary.p2p.amount.toFixed(2)} total`);
      doc.moveDown(2);

      // Add transaction list
      doc.fontSize(12).text('Transaction Details:', { underline: true });
      doc.moveDown();

      reportData.transactions.forEach((txn, index) => {
        if (index > 0) doc.moveDown(0.5);
        doc.fontSize(8).text(`Date: ${txn.timestamp.toDate().toLocaleDateString()}`);
        doc.fontSize(8).text(`Type: ${txn.type.toUpperCase()}`);
        doc.fontSize(8).text(`Amount: ${txn.amount} ${txn.sourceCurrency}`);
        doc.fontSize(8).text(`Status: ${txn.status}`);
        doc.fontSize(8).text(`Reference: ${txn.referenceNumber}`);
        if (index < reportData.transactions.length - 1) doc.moveDown(0.5);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Generate CSV report
async function generateCSVReport(reportData: MonthlyReportData): Promise<string> {
  const csvStringifier = createObjectCsvWriter({
    header: [
      { id: 'date', title: 'Date' },
      { id: 'type', title: 'Type' },
      { id: 'amount', title: 'Amount' },
      { id: 'currency', title: 'Currency' },
      { id: 'fees', title: 'Fees' },
      { id: 'status', title: 'Status' },
      { id: 'reference', title: 'Reference' }
    ]
  });

  const records = reportData.transactions.map(txn => ({
    date: txn.timestamp.toDate().toISOString().split('T')[0],
    type: txn.type.toUpperCase(),
    amount: txn.amount,
    currency: txn.sourceCurrency,
    fees: txn.fees || 0,
    status: txn.status,
    reference: txn.referenceNumber
  }));

  return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
}

export const monthlyReportGeneration = functions.pubsub
  .schedule('0 1 1 * *') // Run on the 1st of every month at 1 AM
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('Starting monthly report generation');

      // Get last month's date
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthName = lastMonth.toLocaleString('default', { month: 'long' });
      const year = lastMonth.getFullYear().toString();
      const month = lastMonth.getMonth() + 1;
      const monthStr = month.toString().padStart(2, '0');

      // Get all users
      const usersSnapshot = await db.collectionGroup('users').get();
      const users = usersSnapshot.docs;

      for (const userDoc of users) {
        try {
          const userData = userDoc.data();
          const userId = userData.uid;
          const tenantId = userData.tenantId;

          // Get user's transactions for last month
          const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
          const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

          const transactionsSnapshot = await db.collection('tenants').doc(tenantId).collection('transactions')
            .where('senderUid', '==', userId)
            .where('timestamp', '>=', startDate)
            .where('timestamp', '<=', endDate)
            .get();

          const transactions = transactionsSnapshot.docs.map(doc => doc.data());

          // Also get transactions where user is recipient
          const recipientTransactionsSnapshot = await db.collection('tenants').doc(tenantId).collection('transactions')
            .where('recipientUid', '==', userId)
            .where('timestamp', '>=', startDate)
            .where('timestamp', '<=', endDate)
            .get();

          const recipientTransactions = recipientTransactionsSnapshot.docs.map(doc => doc.data());

          // Combine all transactions
          const allTransactions = [...transactions, ...recipientTransactions];

          if (allTransactions.length === 0) {
            console.log(`No transactions found for user ${userId} in ${monthName} ${year}`);
            continue;
          }

          // Calculate summary
          const summary = {
            cashIn: { count: 0, amount: 0 },
            cashOut: { count: 0, amount: 0 },
            p2p: { count: 0, amount: 0 }
          };

          let totalAmount = 0;
          let totalFees = 0;

          allTransactions.forEach(txn => {
            if (txn.type === 'cash_in') {
              summary.cashIn.count++;
              summary.cashIn.amount += txn.amount;
            } else if (txn.type === 'cash_out') {
              summary.cashOut.count++;
              summary.cashOut.amount += txn.amount;
            } else if (txn.type === 'p2p') {
              summary.p2p.count++;
              summary.p2p.amount += txn.amount;
            }

            totalAmount += txn.amount;
            totalFees += txn.fees || 0;
          });

          const reportData: MonthlyReportData = {
            userId,
            tenantId,
            month: monthName,
            year,
            totalTransactions: allTransactions.length,
            totalAmount,
            totalFees,
            transactions: allTransactions,
            summary
          };

          // Generate reports
          const [pdfBuffer, csvContent] = await Promise.all([
            generatePDFReport(reportData),
            generateCSVReport(reportData)
          ]);

          // Upload to Cloud Storage
          const bucket = storage.bucket();
          const pdfFileName = `reports/${userId}/${year}-${monthStr}-monthly-report.pdf`;
          const csvFileName = `reports/${userId}/${year}-${monthStr}-monthly-report.csv`;

          const [pdfFile, csvFile] = [
            bucket.file(pdfFileName),
            bucket.file(csvFileName)
          ];

          await Promise.all([
            pdfFile.save(pdfBuffer, {
              metadata: {
                contentType: 'application/pdf',
                cacheControl: 'public, max-age=31536000'
              }
            }),
            csvFile.save(csvContent, {
              metadata: {
                contentType: 'text/csv',
                cacheControl: 'public, max-age=31536000'
              }
            })
          ]);

          // Make files publicly accessible
          await Promise.all([
            pdfFile.makePublic(),
            csvFile.makePublic()
          ]);

          // Create export request records
          const exportRequestData = {
            id: `monthly_${userId}_${year}_${monthStr}`,
            userId,
            tenantId,
            type: 'transactions',
            format: 'pdf',
            dateRange: {
              start: startDate,
              end: endDate
            },
            status: 'completed',
            fileUrl: `https://storage.googleapis.com/${bucket.name}/${pdfFileName}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            completedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          await db.collection('tenants').doc(tenantId).collection('export_requests')
            .doc(exportRequestData.id).set(exportRequestData);

          // Send notification to user
          const notificationData = {
            userId,
            tenantId,
            title: 'Monthly Report Ready',
            body: `Your monthly transaction report for ${monthName} ${year} is ready for download.`,
            type: 'transaction',
            data: {
              reportUrl: exportRequestData.fileUrl,
              month: monthName,
              year,
              transactionCount: allTransactions.length
            },
            read: false,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            fcmSent: false
          };

          await db.collection('tenants').doc(tenantId).collection('notifications').add(notificationData);

          console.log(`Monthly report generated for user ${userId}`);

        } catch (error) {
          console.error(`Error generating report for user ${userDoc.id}:`, error);
          // Continue with next user
        }
      }

      console.log('Monthly report generation completed');
      return null;

    } catch (error) {
      console.error('Error in monthly report generation:', error);
      return null;
    }
  }); 