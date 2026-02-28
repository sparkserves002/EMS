const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { getDb } = require('../dbProvider');

// Ticket categories
const TICKET_CATEGORIES = ['salary', 'technical', 'hr', 'other'];

// In-memory storage for mock mode
let mockTickets = [
  {
    id: 'ticket001',
    userId: 'emp002',
    userName: 'Jane Doe',
    category: 'salary',
    subject: 'Salary discrepancy',
    message: 'My last month salary was less than expected',
    status: 'open',
    priority: 'high',
    createdAt: '2024-01-20T10:00:00Z',
    adminReply: null,
    repliedAt: null,
  },
  {
    id: 'ticket002',
    userId: 'emp003',
    userName: 'Mike Johnson',
    category: 'technical',
    subject: 'Login issue',
    message: 'Unable to login to the system',
    status: 'closed',
    priority: 'medium',
    createdAt: '2024-01-18T14:00:00Z',
    adminReply: 'Issue has been resolved. Please try again.',
    repliedAt: '2024-01-19T09:00:00Z',
  },
];

// Get ticket categories
router.get('/categories', authJwt, async (req, res) => {
  return res.json({ categories: TICKET_CATEGORIES });
});

// Create a new ticket
router.post('/', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { category, subject, message, priority = 'medium' } = req.body;

    if (!category || !subject || !message) {
      return res.status(400).json({ error: 'Category, subject, and message are required' });
    }

    if (!TICKET_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Get user name
    const userName = req.user.name || 'User';

    const newTicket = {
      userId: uid,
      userName,
      category,
      subject,
      message,
      priority,
      status: 'open',
      createdAt: new Date().toISOString(),
      adminReply: null,
      repliedAt: null,
    };

    const db = getDb();
    if (db) {
      const docRef = await db.collection('Tickets').add(newTicket);
      return res.json({ success: true, ticket: { id: docRef.id, ...newTicket } });
    } else {
      newTicket.id = `ticket${Date.now()}`;
      mockTickets.push(newTicket);
      return res.json({ success: true, ticket: newTicket });
    }
  } catch (err) {
    console.error('Create ticket error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get my tickets
router.get('/my-tickets', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const snapshot = await db.collection('Tickets')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();
      const tickets = [];
      snapshot.forEach(doc => {
        tickets.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ tickets });
    } else {
      const tickets = mockTickets
        .filter(t => t.userId === uid)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ tickets });
    }
  } catch (err) {
    console.error('Get my tickets error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get ticket by ID
router.get('/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Tickets').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      const ticket = { id: doc.id, ...doc.data() };
      // Check authorization
      if (ticket.userId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      return res.json({ ticket });
    } else {
      const ticket = mockTickets.find(t => t.id === id);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      if (ticket.userId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      return res.json({ ticket });
    }
  } catch (err) {
    console.error('Get ticket error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all tickets (admin only)
router.get('/all', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { status, category } = req.query;
    const db = getDb();

    if (db) {
      let snapshot;
      if (status) {
        snapshot = await db.collection('Tickets')
          .where('status', '==', status)
          .orderBy('createdAt', 'desc')
          .get();
      } else {
        snapshot = await db.collection('Tickets')
          .orderBy('createdAt', 'desc')
          .get();
      }
      let tickets = [];
      snapshot.forEach(doc => {
        tickets.push({ id: doc.id, ...doc.data() });
      });
      if (category) {
        tickets = tickets.filter(t => t.category === category);
      }
      return res.json({ tickets });
    } else {
      let tickets = [...mockTickets];
      if (status) {
        tickets = tickets.filter(t => t.status === status);
      }
      if (category) {
        tickets = tickets.filter(t => t.category === category);
      }
      tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ tickets });
    }
  } catch (err) {
    console.error('Get all tickets error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Reply to ticket (admin only)
router.post('/:id/reply', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({ error: 'Reply message is required' });
    }

    const db = getDb();
    const updates = {
      adminReply: reply,
      repliedAt: new Date().toISOString(),
      status: 'answered',
    };

    if (db) {
      await db.collection('Tickets').doc(id).update(updates);
      return res.json({ success: true });
    } else {
      const index = mockTickets.findIndex(t => t.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      mockTickets[index] = { ...mockTickets[index], ...updates };
      return res.json({ success: true, ticket: mockTickets[index] });
    }
  } catch (err) {
    console.error('Reply ticket error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Close ticket
router.patch('/:id/close', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const db = getDb();
    const updates = { status: 'closed' };

    if (db) {
      const doc = await db.collection('Tickets').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      const ticket = doc.data();
      if (ticket.userId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      await db.collection('Tickets').doc(id).update(updates);
      return res.json({ success: true });
    } else {
      const index = mockTickets.findIndex(t => t.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      if (mockTickets[index].userId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      mockTickets[index].status = 'closed';
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Close ticket error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete ticket
router.delete('/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Tickets').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      const ticket = doc.data();
      if (ticket.userId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      await db.collection('Tickets').doc(id).delete();
      return res.json({ success: true });
    } else {
      const index = mockTickets.findIndex(t => t.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      if (mockTickets[index].userId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      mockTickets.splice(index, 1);
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Delete ticket error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get ticket statistics (admin)
router.get('/stats', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const db = getDb();
    let tickets = [];

    if (db) {
      const snapshot = await db.collection('Tickets').get();
      snapshot.forEach(doc => {
        tickets.push({ id: doc.id, ...doc.data() });
      });
    } else {
      tickets = mockTickets;
    }

    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      answered: tickets.filter(t => t.status === 'answered').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      byCategory: {},
    };

    TICKET_CATEGORIES.forEach(cat => {
      stats.byCategory[cat] = tickets.filter(t => t.category === cat).length;
    });

    return res.json({ stats });
  } catch (err) {
    console.error('Get ticket stats error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


