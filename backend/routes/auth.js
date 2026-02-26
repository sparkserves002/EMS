const express = require('express');
const router = express.Router();
const { getAdmin } = require('../firebaseAdmin');

// Returns profile info; in dev returns a mock profile if Firebase isn't available
router.get('/profile/:uid', async (req, res) => {
  const uid = req.params.uid;
  try {
    const admin = getAdmin();
    if (admin && admin.auth) {
      const user = await admin.auth().getUser(uid);
      return res.json({ uid: user.uid, email: user.email, displayName: user.displayName });
    }
  } catch (err) {
    // continue to dev fallback
  }

  if (process.env.NODE_ENV !== 'production') {
    return res.json({ uid, email: `${uid}@example.com`, displayName: 'Dev User' });
  }

  return res.status(400).json({ error: 'User not found' });
});

module.exports = router;
