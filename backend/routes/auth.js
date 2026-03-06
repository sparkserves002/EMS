const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getDb } = require('../dbProvider');
const authJwt = require('../middleware/authJwt');

const MAX_LOGIN_EVENTS = 50;
let recentEmployeeLogins = [];

function upsertRecentEmployeeLogin({ uid, email, displayName, role }) {
  if (role === 'admin') {
    return;
  }

  const now = new Date().toISOString();
  const event = {
    uid,
    email,
    displayName,
    role: role || 'employee',
    loggedInAt: now,
  };

  recentEmployeeLogins = [
    event,
    ...recentEmployeeLogins.filter((item) => item.email !== email),
  ].slice(0, MAX_LOGIN_EVENTS);
}

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
        const userDocId = usersSnapshot && usersSnapshot.docs && usersSnapshot.docs.length > 0
          ? usersSnapshot.docs[0].id
          : null;

        if (userDoc) {
          role = userDoc.role || role;
          displayName = userDoc.name || userDoc.displayName || displayName;

          if (userDocId) {
            await db.collection('Users').doc(userDocId).set(
              { lastLoginAt: new Date().toISOString() },
              { merge: true }
            );
          }
        }
      }
    } catch (_) {
      // Keep heuristic role if DB lookup fails
    }

    upsertRecentEmployeeLogin({ uid, email: normalizedEmail, displayName, role });

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

router.get('/recent-employee-logins', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const db = getDb();
    if (db) {
      try {
        const usersSnapshot = await db
          .collection('Users')
          .where('role', '==', 'employee')
          .orderBy('lastLoginAt', 'desc')
          .limit(10)
          .get();

        const logins = [];
        usersSnapshot.forEach((doc) => {
          const data = doc.data() || {};
          if (data.lastLoginAt) {
            logins.push({
              uid: data.uid || doc.id,
              email: data.email || '',
              displayName: data.name || data.displayName || data.email || 'Employee',
              role: data.role || 'employee',
              loggedInAt: data.lastLoginAt,
            });
          }
        });

        if (logins.length > 0) {
          return res.json({ logins });
        }
      } catch (_) {
        // Fall back to memory cache if query/order is not supported in active adapter
      }
    }

    return res.json({ logins: recentEmployeeLogins.slice(0, 10) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch recent employee logins' });
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


