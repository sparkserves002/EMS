const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { getDb } = require('../dbProvider');

// In-memory storage for mock mode
let mockDocuments = [
  {
    id: 'doc001',
    userId: 'emp002',
    userName: 'Jane Doe',
    type: 'offer_letter',
    name: 'Offer Letter - Jane Doe',
    fileName: 'offer_letter_jane.pdf',
    fileUrl: '/uploads/offer_letter_jane.pdf',
    fileSize: 1024000,
    status: 'verified',
    verifiedBy: 'admin001',
    verifiedByName: 'John Smith',
    verifiedAt: '2024-01-10T10:00:00Z',
    uploadedAt: '2024-01-05T09:00:00Z',
  },
  {
    id: 'doc002',
    userId: 'emp002',
    userName: 'Jane Doe',
    type: 'aadhar',
    name: 'Aadhar Card - Jane Doe',
    fileName: 'aadhar_jane.pdf',
    fileUrl: '/uploads/aadhar_jane.pdf',
    fileSize: 512000,
    status: 'verified',
    verifiedBy: 'admin001',
    verifiedByName: 'John Smith',
    verifiedAt: '2024-01-10T10:00:00Z',
    uploadedAt: '2024-01-05T09:30:00Z',
  },
  {
    id: 'doc003',
    userId: 'emp003',
    userName: 'Mike Johnson',
    type: 'offer_letter',
    name: 'Offer Letter - Mike Johnson',
    fileName: 'offer_letter_mike.pdf',
    fileUrl: '/uploads/offer_letter_mike.pdf',
    fileSize: 980000,
    status: 'pending',
    verifiedBy: null,
    verifiedByName: null,
    verifiedAt: null,
    uploadedAt: '2024-01-08T11:00:00Z',
  },
  {
    id: 'doc004',
    userId: 'emp002',
    userName: 'Jane Doe',
    type: 'pan',
    name: 'PAN Card - Jane Doe',
    fileName: 'pan_jane.pdf',
    fileUrl: '/uploads/pan_jane.pdf',
    fileSize: 256000,
    status: 'pending',
    verifiedBy: null,
    verifiedByName: null,
    verifiedAt: null,
    uploadedAt: '2024-01-15T14:00:00Z',
  },
];

// Document types
const DOCUMENT_TYPES = [
  { id: 'offer_letter', name: 'Offer Letter', required: true },
  { id: 'aadhar', name: 'Aadhar Card', required: true },
  { id: 'pan', name: 'PAN Card', required: true },
  { id: 'photo', name: 'Profile Photo', required: true },
  { id: 'resume', name: 'Resume/CV', required: true },
  { id: 'experience', name: 'Experience Letter', required: false },
  { id: 'education', name: 'Education Certificates', required: false },
  { id: 'other', name: 'Other', required: false },
];

// Get my documents
router.get('/my-documents', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const snapshot = await db.collection('Documents')
        .where('userId', '==', uid)
        .orderBy('uploadedAt', 'desc')
        .get();
      
      let documents = [];
      snapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ documents });
    } else {
      const documents = mockDocuments.filter(d => d.userId === uid);
      return res.json({ documents });
    }
  } catch (err) {
    console.error('Get my documents error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Upload document
router.post('/upload', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { type, name, fileName, fileUrl, fileSize } = req.body;

    if (!type || !name || !fileName || !fileUrl) {
      return res.status(400).json({ error: 'Type, name, fileName, and fileUrl are required' });
    }

    // Get user name
    const userName = req.user.name || 'User';

    const newDocument = {
      userId: uid,
      userName,
      type,
      name,
      fileName,
      fileUrl,
      fileSize: fileSize || 0,
      status: 'pending',
      verifiedBy: null,
      verifiedByName: null,
      verifiedAt: null,
      uploadedAt: new Date().toISOString(),
    };

    const db = getDb();
    if (db) {
      const docRef = await db.collection('Documents').add(newDocument);
      return res.json({ success: true, document: { id: docRef.id, ...newDocument } });
    } else {
      newDocument.id = `doc${Date.now()}`;
      mockDocuments.push(newDocument);
      return res.json({ success: true, document: newDocument });
    }
  } catch (err) {
    console.error('Upload document error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get document by ID
router.get('/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Documents').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Document not found' });
      }
      const document = { id: doc.id, ...doc.data() };
      // Check authorization
      if (document.userId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      return res.json({ document });
    } else {
      const document = mockDocuments.find(d => d.id === id);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      if (document.userId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      return res.json({ document });
    }
  } catch (err) {
    console.error('Get document error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete document (only pending)
router.delete('/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Documents').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Document not found' });
      }
      const document = doc.data();
      if (document.userId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (document.status === 'verified') {
        return res.status(400).json({ error: 'Cannot delete verified documents' });
      }
      await db.collection('Documents').doc(id).delete();
      return res.json({ success: true });
    } else {
      const index = mockDocuments.findIndex(d => d.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Document not found' });
      }
      if (mockDocuments[index].userId !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (mockDocuments[index].status === 'verified') {
        return res.status(400).json({ error: 'Cannot delete verified documents' });
      }
      mockDocuments.splice(index, 1);
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Delete document error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all documents (admin only)
router.get('/all', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { status, type, userId } = req.query;
    const db = getDb();

    if (db) {
      let snapshot;
      if (status) {
        snapshot = await db.collection('Documents')
          .where('status', '==', status)
          .orderBy('uploadedAt', 'desc')
          .get();
      } else {
        snapshot = await db.collection('Documents')
          .orderBy('uploadedAt', 'desc')
          .get();
      }
      let documents = [];
      snapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() });
      });

      if (type) {
        documents = documents.filter(d => d.type === type);
      }
      if (userId) {
        documents = documents.filter(d => d.userId === userId);
      }

      return res.json({ documents });
    } else {
      let documents = [...mockDocuments];
      if (status) {
        documents = documents.filter(d => d.status === status);
      }
      if (type) {
        documents = documents.filter(d => d.type === type);
      }
      if (userId) {
        documents = documents.filter(d => d.userId === userId);
      }
      documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      return res.json({ documents });
    }
  } catch (err) {
    console.error('Get all documents error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Verify/Reject document (admin only)
router.patch('/:id/verify', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { status, comment } = req.body;

    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either verified or rejected' });
    }

    const updates = {
      status,
      verifiedBy: req.user.uid,
      verifiedByName: req.user.name || 'Admin',
      verifiedAt: new Date().toISOString(),
    };

    if (comment) {
      updates.comment = comment;
    }

    const db = getDb();
    if (db) {
      await db.collection('Documents').doc(id).update(updates);
      return res.json({ success: true });
    } else {
      const index = mockDocuments.findIndex(d => d.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Document not found' });
      }
      mockDocuments[index] = { ...mockDocuments[index], ...updates };
      return res.json({ success: true, document: mockDocuments[index] });
    }
  } catch (err) {
    console.error('Verify document error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get document statistics (admin)
router.get('/stats', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const db = getDb();
    let documents = [];

    if (db) {
      const snapshot = await db.collection('Documents').get();
      snapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() });
      });
    } else {
      documents = mockDocuments;
    }

    const stats = {
      total: documents.length,
      verified: documents.filter(d => d.status === 'verified').length,
      pending: documents.filter(d => d.status === 'pending').length,
      rejected: documents.filter(d => d.status === 'rejected').length,
    };

    // By type
    const byType = {};
    documents.forEach(doc => {
      if (!byType[doc.type]) {
        byType[doc.type] = { total: 0, verified: 0, pending: 0, rejected: 0 };
      }
      byType[doc.type].total++;
      byType[doc.type][doc.status]++;
    });

    stats.byType = byType;

    return res.json({ stats });
  } catch (err) {
    console.error('Get document stats error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get document types
router.get('/types', authJwt, async (req, res) => {
  return res.json({ types: DOCUMENT_TYPES });
});

module.exports = router;


