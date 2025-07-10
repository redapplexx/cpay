const functions = require('firebase-functions');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, conf: { distDir: '.next' } });
const handle = app.getRequestHandler();

// Export Next.js app
exports.nextapp = functions.https.onRequest((req, res) => {
  return app.prepare().then(() => handle(req, res));
});

// Export admin functions
const { createAdminUser, createWinnyAdmin, verifyAdminUser } = require('./src/admin/createAdmin');

exports.createAdminUser = createAdminUser;
exports.createWinnyAdmin = createWinnyAdmin;
exports.verifyAdminUser = verifyAdminUser; 