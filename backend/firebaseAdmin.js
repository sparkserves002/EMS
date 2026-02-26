const admin = require('firebase-admin');
const { createMockDb } = require('./mockFirestore');

let _initialized = false;
let _mockDb = null;

function initializeFirebaseAdmin() {
  if (_initialized) return;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || './serviceAccountKey.json';
  let initOptions = {};
  try {
    try {
      const serviceAccount = require(serviceAccountPath);
      initOptions.credential = admin.credential.cert(serviceAccount);
      if (process.env.FIREBASE_STORAGE_BUCKET) initOptions.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    } catch (err) {
      console.warn('No service account found at', serviceAccountPath, '- attempting default credentials or running in dev mode.');
    }

    if (!admin.apps.length) {
      admin.initializeApp(initOptions);
      _initialized = true;
    }
  } catch (err) {
    console.warn('Failed to initialize Firebase Admin:', err.message);
  }
}

function getAdmin() {
  if (!admin.apps.length) initializeFirebaseAdmin();
  return admin;
}

function getDb() {
  try {
    if (!admin.apps.length) initializeFirebaseAdmin();
    const firestore = admin.firestore ? admin.firestore() : null;
    if (firestore) return firestore;
  } catch (e) {
    // fall through to mock
  }

  // fallback to in-memory mock for development/testing
  if (process.env.NODE_ENV !== 'production') {
    if (!_mockDb) _mockDb = createMockDb();
    return _mockDb;
  }

  return null;
}

module.exports = { initializeFirebaseAdmin, getAdmin, getDb };
