const admin = require('firebase-admin');

/**
 * Initialize Firebase Admin using either a base64-encoded service account JSON
 * string (FIREBASE_SERVICE_ACCOUNT) or a JSON file path (FIREBASE_SERVICE_ACCOUNT_PATH).
 * The initialization is idempotent and guards against the "app/duplicate-app" error
 * that appears when dev servers are reloaded in Codespaces.
 */
function initializeFirebaseAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  let credential;
  if (base64ServiceAccount) {
    try {
      const decoded = Buffer.from(base64ServiceAccount, 'base64').toString('utf8');
      credential = admin.credential.cert(JSON.parse(decoded));
    } catch (error) {
      throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT: ${error.message}`);
    }
  } else if (serviceAccountPath) {
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const serviceAccount = require(serviceAccountPath);
      credential = admin.credential.cert(serviceAccount);
    } catch (error) {
      throw new Error(`Failed to load service account file at ${serviceAccountPath}: ${error.message}`);
    }
  } else {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT (base64 JSON) or FIREBASE_SERVICE_ACCOUNT_PATH');
  }

  return admin.initializeApp({
    credential,
  });
}

module.exports = {
  initializeFirebaseAdmin,
};
