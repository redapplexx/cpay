const admin = require('firebase-admin');
const serviceAccount = require('./serviceaccountkey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const email = 'winny@cpay.com';
const password = 'superwinny';

async function createAdminUser() {
  try {
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log('User already exists:', user.uid);
    } catch (e) {
      user = await admin.auth().createUser({
        email,
        password,
        emailVerified: true,
        displayName: 'Winny Admin',
      });
      console.log('User created:', user.uid);
    }
    await admin.auth().setCustomUserClaims(user.uid, { role: 'ADMIN' });
    console.log('Admin claim set for', email);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createAdminUser(); 