const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { getDb } = require('../dbProvider');

// In-memory storage for mock mode
let mockNotifications = [
  {
    id: 'notif001',
    userId: 'emp002',
    type: 'leave',
    title: 'Leave Approved',
    message: 'Your leave request for Jan 20-21 has been approved.',
    isRead: false,
    createdAt: '2024-01-19T10:00:00Z',
    link: '/employee/leaves',
  },
  {
    id: 'notif002',
    userId: 'emp003',
    type: 'ticket',
    title: 'Ticket Reply',
    message: 'Admin has replied to your ticket #ticket002.',
    isRead: false,
    createdAt: '2024-01-19T09:00:00Z',
    link: '/employee/tickets',
  },
  {
    id: 'notif003',
    userId: 'emp002',
    type: 'announcement',
    title: 'New Announcement',
    message: 'Check out the new office policy update.',
    isRead: true,
    createdAt: '2024-01-18T14:00:00Z',
    link: '/employee/announcements',
  },
];

// Notification types
const NOTIFICATION_TYPES = ['leave', 'ticket', 'payroll', 'announcement', 'attendance', 'message', 'system'];

// Get notifications for current user
router.get('/', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { unreadOnly } = req.query;
    const db = getDb();

    if (db) {
      let query = db.collection('Notifications')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc');
      
      const snapshot = await query.get();
      let notifications = [];
      snapshot.forEach(doc => {
        notifications.push({ id: doc.id, ...doc.data() });
      });

      if (unreadOnly === 'true') {
        notifications = notifications.filter(n => !n.isRead);
      }

      return res.json({ notifications });
    } else {
      let notifications = mockNotifications.filter(n => n.userId === uid);
      if (unreadOnly === 'true') {
        notifications = notifications.filter(n => !n.isRead);
      }
      notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ notifications });
    }
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get unread count
router.get('/unread-count', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const snapshot = await db.collection('Notifications')
        .where('userId', '==', uid)
        .where('isRead', '==', false)
        .get();
      
      return res.json({ count: snapshot.size });
    } else {
      const count = mockNotifications.filter(n => n.userId === uid && !n.isRead).length;
      return res.json({ count });
    }
  } catch (err) {
    console.error('Get unread count error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as read
router.patch('/:id/read', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const db = getDb();

    const updates = { isRead: true, readAt: new Date().toISOString() };

    if (db) {
      const doc = await db.collection('Notifications').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      if (doc.data().userId !== uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      await db.collection('Notifications').doc(id).update(updates);
      return res.json({ success: true });
    } else {
      const index = mockNotifications.findIndex(n => n.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      if (mockNotifications[index].userId !== uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      mockNotifications[index] = { ...mockNotifications[index], ...updates };
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const snapshot = await db.collection('Notifications')
        .where('userId', '==', uid)
        .where('isRead', '==', false)
        .get();
      
      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.update(doc.ref, { isRead: true, readAt: new Date().toISOString() });
      });
      await batch.commit();
      
      return res.json({ success: true, count: snapshot.size });
    } else {
      let count = 0;
      mockNotifications.forEach((n, index) => {
        if (n.userId === uid && !n.isRead) {
          mockNotifications[index].isRead = true;
          count++;
        }
      });
      return res.json({ success: true, count });
    }
  } catch (err) {
    console.error('Mark all read error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Notifications').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      if (doc.data().userId !== uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      await db.collection('Notifications').doc(id).delete();
      return res.json({ success: true });
    } else {
      const index = mockNotifications.findIndex(n => n.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      if (mockNotifications[index].userId !== uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      mockNotifications.splice(index, 1);
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Delete notification error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Create notification (internal use - for other modules to call)
const createNotification = async (db, notification) => {
  const newNotification = {
    ...notification,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  if (db) {
    await db.collection('Notifications').add(newNotification);
  } else {
    newNotification.id = `notif${Date.now()}`;
    mockNotifications.push(newNotification);
  }
  
  return newNotification;
};

// Helper function to create notifications (exported for other routes)
module.exports.createNotification = createNotification;

// Get notification preferences
router.get('/preferences', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    // Default preferences
    const defaultPreferences = {
      leave: true,
      ticket: true,
      payroll: true,
      announcement: true,
      attendance: true,
      message: true,
      system: true,
      email: false,
    };

    if (db) {
      const doc = await db.collection('NotificationPreferences').doc(uid).get();
      if (doc.exists) {
        return res.json({ preferences: { ...defaultPreferences, ...doc.data() } });
      }
    }

    return res.json({ preferences: defaultPreferences });
  } catch (err) {
    console.error('Get preferences error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update notification preferences
router.put('/preferences', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const preferences = req.body;
    const db = getDb();

    if (db) {
      await db.collection('NotificationPreferences').doc(uid).set(preferences, { merge: true });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Update preferences error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


