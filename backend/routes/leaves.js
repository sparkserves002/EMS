const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { getDb } = require('../firebaseAdmin');

// Leave types and their default balances (per year)
const LEAVE_TYPES = {
  casual: { name: 'Casual Leave', balance: 12 },
  sick: { name: 'Sick Leave', balance: 10 },
  paid: { name: 'Paid Leave', balance: 15 },
  unpaid: { name: 'Unpaid Leave', balance: 0 },
};

// In-memory storage for mock mode
let mockLeaves = [
  {
    id: 'leave001',
    userId: 'emp002',
    type: 'sick',
    startDate: '2024-01-15',
    endDate: '2024-01-16',
    reason: 'Medical appointment',
    status: 'approved',
    appliedAt: '2024-01-14T10:00:00Z',
    approvedBy: 'admin001',
    approvedAt: '2024-01-14T15:00:00Z',
    remarks: 'Get well soon!',
  },
  {
    id: 'leave002',
    userId: 'emp003',
    type: 'casual',
    startDate: '2024-02-01',
    endDate: '2024-02-02',
    reason: 'Family function',
    status: 'pending',
    appliedAt: '2024-01-28T09:00:00Z',
  },
];

// Get leave types
router.get('/types', authJwt, async (req, res) => {
  return res.json({ types: LEAVE_TYPES });
});

// Get leave balance for current user
router.get('/balance', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();
    let leaves = [];

    if (db) {
      const snapshot = await db.collection('Leaves').where('userId', '==', uid).get();
      snapshot.forEach(doc => {
        leaves.push({ id: doc.id, ...doc.data() });
      });
    } else {
      leaves = mockLeaves.filter(l => l.userId === uid);
    }

    // Calculate balance for current year
    const currentYear = new Date().getFullYear();
    const balance = { ...LEAVE_TYPES };

    Object.keys(balance).forEach(type => {
      const used = leaves.filter(l => 
        l.type === type && 
        l.status !== 'rejected' &&
        new Date(l.startDate).getFullYear() === currentYear
      ).length;
      
      // Calculate days for each leave
      let totalDays = 0;
      leaves.filter(l => l.type === type && l.status !== 'rejected').forEach(leave => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        totalDays += days;
      });

      balance[type].used = totalDays;
      balance[type].remaining = balance[type].balance - totalDays;
    });

    return res.json({ balance });
  } catch (err) {
    console.error('Get balance error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Apply for leave
router.post('/', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { type, startDate, endDate, reason } = req.body;

    // Validate leave type
    if (!LEAVE_TYPES[type]) {
      return res.status(400).json({ error: 'Invalid leave type' });
    }

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Constraint: Validate dates are not in the past
    if (start < today) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }
    if (end < today) {
      return res.status(400).json({ error: 'End date cannot be in the past' });
    }

    if (start > end) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Constraint: Maximum leave duration (max 30 days)
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (durationDays > 30) {
      return res.status(400).json({ error: 'Leave duration cannot exceed 30 days' });
    }

    // Constraint: Advance notice requirement (at least 1 day in advance)
    const advanceNoticeDays = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
    if (advanceNoticeDays < 1) {
      return res.status(400).json({ error: 'Leave must be applied at least 1 day in advance' });
    }

    // Constraint: Minimum reason length (at least 10 characters)
    const trimmedReason = reason ? reason.trim() : '';
    if (trimmedReason.length < 10) {
      return res.status(400).json({ error: 'Reason must be at least 10 characters long' });
    }

    // Check for existing pending leave
    const db = getDb();
    if (db) {
      const snapshot = await db.collection('Leaves')
        .where('userId', '==', uid)
        .where('status', '==', 'pending')
        .get();
      if (!snapshot.empty) {
        return res.status(400).json({ error: 'You already have a pending leave request' });
      }
    } else {
      const hasPending = mockLeaves.some(l => 
        l.userId === uid && l.status === 'pending'
      );
      if (hasPending) {
        return res.status(400).json({ error: 'You already have a pending leave request' });
      }
    }

    const newLeave = {
      userId: uid,
      type,
      startDate,
      endDate,
      reason: reason || '',
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };

    if (db) {
      const docRef = await db.collection('Leaves').add(newLeave);
      return res.json({ success: true, leave: { id: docRef.id, ...newLeave } });
    } else {
      newLeave.id = `leave${Date.now()}`;
      mockLeaves.push(newLeave);
      return res.json({ success: true, leave: newLeave });
    }
  } catch (err) {
    console.error('Apply leave error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get leave history for current user
router.get('/my-leaves', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const snapshot = await db.collection('Leaves')
        .where('userId', '==', uid)
        .orderBy('appliedAt', 'desc')
        .get();
      const leaves = [];
      snapshot.forEach(doc => {
        leaves.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ leaves });
    } else {
      const leaves = mockLeaves
        .filter(l => l.userId === uid)
        .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      return res.json({ leaves });
    }
  } catch (err) {
    console.error('Get my leaves error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all leaves (admin only)
router.get('/all', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { status, startDate, endDate } = req.query;
    const db = getDb();

    if (db) {
      let query = db.collection('Leaves').orderBy('appliedAt', 'desc');
      if (status) {
        query = query.where('status', '==', status);
      }
      const snapshot = await query.get();
      const leaves = [];
      snapshot.forEach(doc => {
        leaves.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ leaves });
    } else {
      let leaves = [...mockLeaves];
      if (status) {
        leaves = leaves.filter(l => l.status === status);
      }
      leaves.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      return res.json({ leaves });
    }
  } catch (err) {
    console.error('Get all leaves error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Approve/Reject leave (admin only)
router.patch('/:id', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const db = getDb();
    const updates = {
      status,
      approvedBy: req.user.uid,
      approvedAt: new Date().toISOString(),
    };
    if (remarks) {
      updates.remarks = remarks;
    }

    if (db) {
      await db.collection('Leaves').doc(id).update(updates);
      return res.json({ success: true });
    } else {
      const index = mockLeaves.findIndex(l => l.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Leave not found' });
      }
      mockLeaves[index] = { ...mockLeaves[index], ...updates };
      return res.json({ success: true, leave: mockLeaves[index] });
    }
  } catch (err) {
    console.error('Update leave error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Cancel leave (own request)
router.delete('/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Leaves').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Leave not found' });
      }
      const leave = doc.data();
      if (leave.userId !== uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (leave.status !== 'pending') {
        return res.status(400).json({ error: 'Can only cancel pending leaves' });
      }
      await db.collection('Leaves').doc(id).delete();
      return res.json({ success: true });
    } else {
      const index = mockLeaves.findIndex(l => l.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Leave not found' });
      }
      if (mockLeaves[index].userId !== uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (mockLeaves[index].status !== 'pending') {
        return res.status(400).json({ error: 'Can only cancel pending leaves' });
      }
      mockLeaves.splice(index, 1);
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Cancel leave error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get leave statistics (admin)
router.get('/stats', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const db = getDb();
    let leaves = [];

    if (db) {
      const snapshot = await db.collection('Leaves').get();
      snapshot.forEach(doc => {
        leaves.push({ id: doc.id, ...doc.data() });
      });
    } else {
      leaves = mockLeaves;
    }

    const stats = {
      total: leaves.length,
      pending: leaves.filter(l => l.status === 'pending').length,
      approved: leaves.filter(l => l.status === 'approved').length,
      rejected: leaves.filter(l => l.status === 'rejected').length,
      byType: {},
    };

    Object.keys(LEAVE_TYPES).forEach(type => {
      stats.byType[type] = leaves.filter(l => l.type === type).length;
    });

    return res.json({ stats });
  } catch (err) {
    console.error('Get leave stats error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
