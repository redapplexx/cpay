const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

exports.helloWorld = onCall((request) => {
  return {
    message: 'Hello from CPay Functions!',
    timestamp: new Date().toISOString()
  };
}); 