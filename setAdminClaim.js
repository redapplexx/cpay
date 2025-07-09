const admin = require('firebase-admin');

const serviceAccount = require('./serviceaccountkey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const userUid = '4PMoWLXClrUfmvqFLjApLrOqy5v1'; // Updated with the new UID
const customClaims = { role: 'ADMIN' };

admin.auth().setCustomUserClaims(userUid, customClaims)
  .then(() => {
    console.log(`Custom claims set successfully for user ${userUid}. Role: ${customClaims.role}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting custom claims:', error);
    process.exit(1);
  });
