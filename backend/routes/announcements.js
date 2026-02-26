const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { getDb } = require('../firebaseAdmin');

// In-memory storage for mock mode
let mockAnnouncements = [
  {
    id: 'ann001',
    title: 'Office Closure Notice',
    content: 'The office will remain closed on 26th January for Republic Day celebrations.',
    category: 'holiday',
    priority: 'high',
    createdBy: 'admin001',
    createdByName: 'John Smith',
    createdAt: '2024-01-20T10:00:00Z',
    expiresAt: '2024-01-27T00:00:00Z',
    isActive: true,
  },
  {
    id: 'ann002',
    title: 'New HR Policy Update',
    content: 'We have updated our leave policy. Please check the HR portal for details.',
    category: 'policy',
    priority: 'medium',
    createdBy: 'admin001',
    createdByName: 'John Smith',
    createdAt: '2024-01-18T14:00:00Z',
    expiresAt: null,
    isActive: true,
  },
  {
    id: 'ann003',
    title: 'Team Building Event',
    content: 'Join us for a team building event on 15th February at City Park.',
    category: 'event',
    priority: 'low',
    createdBy: 'admin001',
    createdByName: 'John Smith',
    createdAt: '2024-01-15T09:00:00Z',
    expiresAt: '2024-02-10T00:00:00Z',
    isActive: true,
  },
];

// Announcement categories
const ANNOUNCEMENT_CATEGORIES = ['general', 'holiday', 'policy', 'event', 'urgent'];

// Get all active announcements
router.get('/', authJwt, async (req, res) => {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    if (db) {
      const snapshot = await db.collection('Announcements')
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .get();
      
      let announcements = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Filter out expired announcements
        if (!data.expiresAt || new Date(data.expiresAt) > new Date(now)) {
          announcements.push({ id: doc.id, ...data });
        }
      });
      return res.json({ announcements });
    } else {
      const announcements = mockAnnouncements
        .filter(a => a.isActive && (!a.expiresAt || new Date(a.expiresAt) > new Date(now)))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ announcements });
    }
  } catch (err) {
    console.error('Get announcements error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get announcement by ID
router.get('/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Announcements').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      return res.json({ announcement: { id: doc.id, ...doc.data() } });
    } else {
      const announcement = mockAnnouncements.find(a => a.id === id);
      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      return res.json({ announcement });
    }
  } catch (err) {
    console.error('Get announcement error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Create announcement (admin only)
router.post('/', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { title, content, category, priority, expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const newAnnouncement = {
      title,
      content,
      category: category || 'general',
      priority: priority || 'medium',
      createdBy: req.user.uid,
      createdByName: req.user.name || 'Admin',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
      isActive: true,
    };

    const db = getDb();
    if (db) {
      const docRef = await db.collection('Announcements').add(newAnnouncement);
      return res.json({ success: true, announcement: { id: docRef.id, ...newAnnouncement } });
    } else {
      newAnnouncement.id = `ann${Date.now()}`;
      mockAnnouncements.push(newAnnouncement);
      return res.json({ success: true, announcement: newAnnouncement });
    }
  } catch (err) {
    console.error('Create announcement error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update announcement (admin only)
router.put('/:id', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const updates = req.body;
    updates.updatedAt = new Date().toISOString();

    const db = getDb();
    if (db) {
      await db.collection('Announcements').doc(id).update(updates);
      return res.json({ success: true });
    } else {
      const index = mockAnnouncements.findIndex(a => a.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      mockAnnouncements[index] = { ...mockAnnouncements[index], ...updates };
      return res.json({ success: true, announcement: mockAnnouncements[index] });
    }
  } catch (err) {
    console.error('Update announcement error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete announcement (admin only)
router.delete('/:id', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const db = getDb();

    if (db) {
      await db.collection('Announcements').doc(id).delete();
      return res.json({ success: true });
    } else {
      const index = mockAnnouncements.findIndex(a => a.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      mockAnnouncements.splice(index, 1);
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Delete announcement error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all announcements (admin only - including inactive)
router.get('/all', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const db = getDb();
    if (db) {
      const snapshot = await db.collection('Announcements')
        .orderBy('createdAt', 'desc')
        .get();
      let announcements = [];
      snapshot.forEach(doc => {
        announcements.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ announcements });
    } else {
      const announcements = [...mockAnnouncements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ announcements });
    }
  } catch (err) {
    console.error('Get all announcements error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get announcement categories
router.get('/categories', authJwt, async (req, res) => {
  return res.json({ categories: ANNOUNCEMENT_CATEGORIES });
});

module.exports = router;
