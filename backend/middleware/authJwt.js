const { getAdmin } = require('../firebaseAdmin');

// Verifies Firebase ID token (sent as Bearer token)
module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { uid: 'dev-uid', email: 'dev@example.com' };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  const admin = getAdmin();
  if (!admin || !admin.auth) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { uid: 'dev-uid', email: 'dev@example.com' };
      return next();
    }
    return res.status(500).json({ error: 'Firebase admin not initialized' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};