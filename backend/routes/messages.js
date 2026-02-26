const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { getDb } = require('../firebaseAdmin');

// In-memory storage for mock mode
let mockMessages = [
  {
    id: 'msg001',
    senderId: 'admin001',
    senderName: 'John Smith',
    receiverId: 'emp002',
    receiverName: 'Jane Doe',
    message: 'Welcome to the company! Let me know if you need any help.',
    isRead: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'msg002',
    senderId: 'emp002',
    senderName: 'Jane Doe',
    receiverId: 'admin001',
    receiverName: 'John Smith',
    message: 'Thank you! I have a question about the attendance system.',
    isRead: true,
    createdAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 'msg003',
    senderId: 'admin001',
    senderName: 'Admin',
    receiverId: 'all',
    receiverName: 'All Employees',
    message: 'Important: Office will be closed tomorrow due to maintenance.',
    isRead: false,
    createdAt: '2024-01-20T09:00:00Z',
  },
];

// Send a message
router.post('/', authJwt, async (req, res) => {
  try {
    const senderId = req.user.uid;
    const senderName = req.user.name || 'User';
    const { receiverId, message, isBroadcast = false } = req.body;

    if (!message || (!receiverId && !isBroadcast)) {
      return res.status(400).json({ error: 'Message and receiver are required' });
    }

    const db = getDb();
    
    if (isBroadcast && req.user.role === 'admin') {
      // Broadcast to all employees - create multiple messages
      let employees = [];
      if (db) {
        const snapshot = await db.collection('Users').get();
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.uid !== senderId) {
            employees.push({ id: doc.id, ...data });
          }
        });
      }

      const newMessages = [];
      const recipients = isBroadcast ? 'all' : receiverId;

      const broadcastMsg = {
        senderId,
        senderName,
        receiverId: recipients,
        receiverName: 'All Employees',
        message,
        isBroadcast: true,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      if (db) {
        const docRef = await db.collection('Messages').add(broadcastMsg);
        newMessages.push({ id: docRef.id, ...broadcastMsg });
      } else {
        broadcastMsg.id = `msg${Date.now()}`;
        broadcastMsg.isRead = false;
        mockMessages.push(broadcastMsg);
        newMessages.push(broadcastMsg);
      }

      return res.json({ success: true, messages: newMessages });
    } else {
      // Single message
      const newMessage = {
        senderId,
        senderName,
        receiverId: receiverId || req.user.uid,
        receiverName: '',
        message,
        isBroadcast: false,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      // Get receiver name
      if (db) {
        const empSnap = await db.collection('Users').where('uid', '==', receiverId).limit(1).get();
        empSnap.forEach(doc => {
          newMessage.receiverName = doc.data().name || 'User';
        });
      } else {
        const emp = mockEmployees?.find(e => e.uid === receiverId);
        newMessage.receiverName = emp?.name || 'User';
      }

      if (db) {
        const docRef = await db.collection('Messages').add(newMessage);
        return res.json({ success: true, message: { id: docRef.id, ...newMessage } });
      } else {
        newMessage.id = `msg${Date.now()}`;
        mockMessages.push(newMessage);
        return res.json({ success: true, message: newMessage });
      }
    }
  } catch (err) {
    console.error('Send message error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get my messages (conversations)
router.get('/', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      // Get messages where user is sender or receiver
      const sentSnap = await db.collection('Messages')
        .where('senderId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();
      
      const receivedSnap = await db.collection('Messages')
        .where('receiverId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();

      const sent = [];
      sentSnap.forEach(doc => sent.push({ id: doc.id, ...doc.data() }));

      const received = [];
      receivedSnap.forEach(doc => received.push({ id: doc.id, ...doc.data() }));

      // Get broadcasts
      const broadcastSnap = await db.collection('Messages')
        .where('receiverId', '==', 'all')
        .orderBy('createdAt', 'desc')
        .get();
      
      const broadcasts = [];
      broadcastSnap.forEach(doc => broadcasts.push({ id: doc.id, ...doc.data() }));

      return res.json({ sent, received, broadcasts });
    } else {
      const sent = mockMessages.filter(m => m.senderId === uid);
      const received = mockMessages.filter(m => m.receiverId === uid || m.receiverId === 'all');
      const broadcasts = mockMessages.filter(m => m.isBroadcast);
      return res.json({ sent, received, broadcasts });
    }
  } catch (err) {
    console.error('Get messages error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get conversation with a specific user
router.get('/conversation/:userId', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const otherUserId = req.params.userId;
    const db = getDb();

    if (db) {
      const snapshot = await db.collection('Messages')
        .where('senderId', 'in', [uid, otherUserId])
        .where('receiverId', 'in', [uid, otherUserId])
        .orderBy('createdAt', 'asc')
        .get();

      const messages = [];
      snapshot.forEach(doc => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ messages });
    } else {
      const messages = mockMessages.filter(m => 
        (m.senderId === uid && m.receiverId === otherUserId) ||
        (m.senderId === otherUserId && m.receiverId === uid)
      );
      return res.json({ messages });
    }
  } catch (err) {
    console.error('Get conversation error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Mark message as read
router.patch('/:id/read', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Messages').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Message not found' });
      }
      const msg = doc.data();
      if (msg.receiverId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      await db.collection('Messages').doc(id).update({ isRead: true });
      return res.json({ success: true });
    } else {
      const msg = mockMessages.find(m => m.id === id);
      if (!msg) {
        return res.status(404).json({ error: 'Message not found' });
      }
      if (msg.receiverId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      msg.isRead = true;
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get unread message count
router.get('/unread-count', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const snapshot = await db.collection('Messages')
        .where('receiverId', '==', uid)
        .where('isRead', '==', false)
        .get();
      
      return res.json({ count: snapshot.size });
    } else {
      const count = mockMessages.filter(m => 
        (m.receiverId === uid || m.receiverId === 'all') && !m.isRead
      ).length;
      return res.json({ count });
    }
  } catch (err) {
    console.error('Get unread count error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all employees for messaging (admin can see all)
router.get('/recipients', authJwt, async (req, res) => {
  try {
    const db = getDb();
    let employees = [];

    if (db) {
      const snapshot = await db.collection('Users').get();
      snapshot.forEach(doc => {
        const data = doc.data();
        employees.push({
          id: data.uid,
          name: data.name,
          email: data.email,
          department: data.department,
        });
      });
    } else {
      employees = [
        { id: 'admin001', name: 'John Smith', email: 'john.smith@company.com', department: 'Engineering' },
        { id: 'emp002', name: 'Jane Doe', email: 'jane.doe@company.com', department: 'HR' },
        { id: 'emp003', name: 'Mike Johnson', email: 'mike.johnson@company.com', department: 'Sales' },
      ];
    }

    return res.json({ employees: employees.filter(e => e.id !== req.user.uid) });
  } catch (err) {
    console.error('Get recipients error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete message
router.delete('/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Messages').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Message not found' });
      }
      const msg = doc.data();
      if (msg.senderId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      await db.collection('Messages').doc(id).delete();
      return res.json({ success: true });
    } else {
      const index = mockMessages.findIndex(m => m.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Message not found' });
      }
      if (mockMessages[index].senderId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      mockMessages.splice(index, 1);
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Delete message error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
