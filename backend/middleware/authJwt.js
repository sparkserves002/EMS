const jwt = require('jsonwebtoken');

// Verifies JWT token (sent as Bearer token)
module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { uid: 'dev-uid', email: 'dev@example.com' };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'ems-dev-secret';

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = {
      uid: decoded.uid || decoded.id || decoded.userId || 'unknown',
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};