const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { getDb } = require('../firebaseAdmin');

// In-memory storage for mock mode
let mockExpenses = [
  {
    id: 'exp001',
    userId: 'emp002',
    userName: 'Jane Doe',
    category: 'travel',
    amount: 5000,
    description: 'Client meeting travel expenses',
    date: '2024-01-15',
    status: 'approved',
    reviewedBy: 'admin001',
    reviewedByName: 'John Smith',
    reviewedAt: '2024-01-18T10:00:00Z',
    attachments: [],
    createdAt: '2024-01-15T14:00:00Z',
  },
  {
    id: 'exp002',
    userId: 'emp003',
    userName: 'Mike Johnson',
    category: 'food',
    amount: 1200,
    description: 'Team lunch with clients',
    date: '2024-01-20',
    status: 'pending',
    reviewedBy: null,
    reviewedByName: null,
    reviewedAt: null,
    attachments: [],
    createdAt: '2024-01-20T12:00:00Z',
  },
  {
    id: 'exp003',
    userId: 'emp002',
    userName: 'Jane Doe',
    category: 'supplies',
    amount: 800,
    description: 'Office supplies purchase',
    date: '2024-01-22',
    status: 'rejected',
    reviewedBy: 'admin001',
    reviewedByName: 'John Smith',
    reviewedAt: '2024-01-23T09:00:00Z',
    attachments: [],
    createdAt: '2024-01-22T10:00:00Z',
  },
];

// Expense categories
const EXPENSE_CATEGORIES = ['travel', 'food', 'supplies', 'equipment', 'communication', 'training', 'other'];

// Get my expenses
router.get('/my-expenses', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const snapshot = await db.collection('Expenses')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();
      
      let expenses = [];
      snapshot.forEach(doc => {
        expenses.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ expenses });
    } else {
      const expenses = mockExpenses.filter(e => e.userId === uid);
      return res.json({ expenses });
    }
  } catch (err) {
    console.error('Get my expenses error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Create expense claim
router.post('/', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { category, amount, description, date, attachments } = req.body;

    if (!category || !amount || !description || !date) {
      return res.status(400).json({ error: 'Category, amount, description, and date are required' });
    }

    // Get user name
    const userName = req.user.name || 'User';

    const newExpense = {
      userId: uid,
      userName,
      category,
      amount: parseFloat(amount),
      description,
      date,
      attachments: attachments || [],
      status: 'pending',
      reviewedBy: null,
      reviewedByName: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
    };

    const db = getDb();
    if (db) {
      const docRef = await db.collection('Expenses').add(newExpense);
      return res.json({ success: true, expense: { id: docRef.id, ...newExpense } });
    } else {
      newExpense.id = `exp${Date.now()}`;
      mockExpenses.push(newExpense);
      return res.json({ success: true, expense: newExpense });
    }
  } catch (err) {
    console.error('Create expense error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get expense by ID
router.get('/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Expenses').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      const expense = { id: doc.id, ...doc.data() };
      // Check authorization
      if (expense.userId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      return res.json({ expense });
    } else {
      const expense = mockExpenses.find(e => e.id === id);
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      if (expense.userId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      return res.json({ expense });
    }
  } catch (err) {
    console.error('Get expense error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete expense (only pending)
router.delete('/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Expenses').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      const expense = doc.data();
      if (expense.userId !== uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (expense.status !== 'pending') {
        return res.status(400).json({ error: 'Cannot delete approved/rejected expenses' });
      }
      await db.collection('Expenses').doc(id).delete();
      return res.json({ success: true });
    } else {
      const index = mockExpenses.findIndex(e => e.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      if (mockExpenses[index].userId !== uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (mockExpenses[index].status !== 'pending') {
        return res.status(400).json({ error: 'Cannot delete approved/rejected expenses' });
      }
      mockExpenses.splice(index, 1);
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Delete expense error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all expenses (admin only)
router.get('/all', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { status, category, startDate, endDate } = req.query;
    const db = getDb();

    if (db) {
      let snapshot;
      if (status) {
        snapshot = await db.collection('Expenses')
          .where('status', '==', status)
          .orderBy('createdAt', 'desc')
          .get();
      } else {
        snapshot = await db.collection('Expenses')
          .orderBy('createdAt', 'desc')
          .get();
      }
      let expenses = [];
      snapshot.forEach(doc => {
        expenses.push({ id: doc.id, ...doc.data() });
      });

      if (category) {
        expenses = expenses.filter(e => e.category === category);
      }
      if (startDate) {
        expenses = expenses.filter(e => e.date >= startDate);
      }
      if (endDate) {
        expenses = expenses.filter(e => e.date <= endDate);
      }

      return res.json({ expenses });
    } else {
      let expenses = [...mockExpenses];
      if (status) {
        expenses = expenses.filter(e => e.status === status);
      }
      if (category) {
        expenses = expenses.filter(e => e.category === category);
      }
      expenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ expenses });
    }
  } catch (err) {
    console.error('Get all expenses error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Approve/Reject expense (admin only)
router.patch('/:id/review', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { status, reviewComment } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either approved or rejected' });
    }

    const updates = {
      status,
      reviewedBy: req.user.uid,
      reviewedByName: req.user.name || 'Admin',
      reviewedAt: new Date().toISOString(),
    };

    if (reviewComment) {
      updates.reviewComment = reviewComment;
    }

    const db = getDb();
    if (db) {
      await db.collection('Expenses').doc(id).update(updates);
      return res.json({ success: true });
    } else {
      const index = mockExpenses.findIndex(e => e.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      mockExpenses[index] = { ...mockExpenses[index], ...updates };
      return res.json({ success: true, expense: mockExpenses[index] });
    }
  } catch (err) {
    console.error('Review expense error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get expense statistics (admin)
router.get('/stats', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const db = getDb();
    let expenses = [];

    if (db) {
      const snapshot = await db.collection('Expenses').get();
      snapshot.forEach(doc => {
        expenses.push({ id: doc.id, ...doc.data() });
      });
    } else {
      expenses = mockExpenses;
    }

    const stats = {
      total: expenses.length,
      pending: expenses.filter(e => e.status === 'pending').length,
      approved: expenses.filter(e => e.status === 'approved').length,
      rejected: expenses.filter(e => e.status === 'rejected').length,
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
      approvedAmount: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0),
      pendingAmount: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
    };

    // By category
    const byCategory = {};
    expenses.forEach(expense => {
      if (!byCategory[expense.category]) {
        byCategory[expense.category] = { count: 0, amount: 0 };
      }
      byCategory[expense.category].count++;
      byCategory[expense.category].amount += expense.amount;
    });

    stats.byCategory = byCategory;

    return res.json({ stats });
  } catch (err) {
    console.error('Get expense stats error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get expense categories
router.get('/categories', authJwt, async (req, res) => {
  return res.json({ categories: EXPENSE_CATEGORIES });
});

module.exports = router;
