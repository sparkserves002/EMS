const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getDb } = require('../dbProvider');

// Login endpoint that returns backend-verifiable JWT for non-Firebase auth flow
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const uid = normalizedEmail.split('@')[0] || 'user';
    let role = (normalizedEmail.includes('admin') || normalizedEmail.includes('hr') || normalizedEmail.includes('employer'))
      ? 'admin'
      : 'employee';
    let displayName = uid;

    try {
      const db = getDb();
      if (db) {
        const usersSnapshot = await db.collection('Users').where('email', '==', normalizedEmail).limit(1).get();
        const userDoc = usersSnapshot && usersSnapshot.docs && usersSnapshot.docs.length > 0
          ? usersSnapshot.docs[0].data()
          : null;

        if (userDoc) {
          role = userDoc.role || role;
          displayName = userDoc.name || userDoc.displayName || displayName;
        }
      }
    } catch (_) {
      // Keep heuristic role if DB lookup fails
    }

    const jwtSecret = process.env.JWT_SECRET || 'ems-dev-secret';
    const token = jwt.sign(
      { uid, email: normalizedEmail, role, name: displayName },
      jwtSecret,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      user: {
        uid,
        email: normalizedEmail,
        role,
        displayName
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Returns profile info from employees collection; in dev returns a mock profile if not found
router.get('/profile/:uid', async (req, res) => {
  const uid = req.params.uid;
  try {
    const db = getDb();
    if (db) {
      const doc = await db.collection('employees').doc(uid).get();
      if (doc.exists) {
        const data = doc.data() || {};
        return res.json({
          uid,
          email: data.email || `${uid}@example.com`,
          displayName: data.name || data.displayName || 'User',
          role: data.role || 'employee'
        });
      }
    }
  } catch (err) {
    // continue to fallback
  }

  if (process.env.NODE_ENV !== 'production') {
    return res.json({ uid, email: `${uid}@example.com`, displayName: 'Dev User', role: 'employee' });
  }

  return res.status(400).json({ error: 'User not found' });
});

module.exports = router;


