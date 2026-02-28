const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { getDb } = require('../dbProvider');

// In-memory storage for mock mode
let mockReviews = [
  {
    id: 'rev001',
    employeeId: 'emp002',
    employeeName: 'Jane Doe',
    reviewerId: 'admin001',
    reviewerName: 'John Smith',
    reviewPeriod: 'Q4 2023',
    reviewDate: '2024-01-15',
    overallRating: 4,
    goals: [
      { id: 'g1', title: 'Complete project on time', status: 'achieved', rating: 5 },
      { id: 'g2', title: 'Learn new skills', status: 'achieved', rating: 4 },
    ],
    strengths: 'Great communication and teamwork skills',
    improvements: 'Could improve technical documentation',
    comments: 'Excellent performance throughout the quarter',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'rev002',
    employeeId: 'emp003',
    employeeName: 'Mike Johnson',
    reviewerId: 'admin001',
    reviewerName: 'John Smith',
    reviewPeriod: 'Q4 2023',
    reviewDate: '2024-01-16',
    overallRating: 3,
    goals: [
      { id: 'g1', title: 'Increase sales targets', status: 'partial', rating: 3 },
      { id: 'g2', title: 'Client retention', status: 'achieved', rating: 4 },
    ],
    strengths: 'Good client relationships',
    improvements: 'Need to work on closing deals',
    comments: 'Good progress but needs to meet targets',
    createdAt: '2024-01-16T10:00:00Z',
  },
];

let mockGoals = [
  {
    id: 'goal001',
    userId: 'emp002',
    userName: 'Jane Doe',
    title: 'Complete AWS Certification',
    description: 'Obtain AWS Solutions Architect certification',
    dueDate: '2024-03-31',
    status: 'in_progress',
    progress: 50,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'goal002',
    userId: 'emp002',
    userName: 'Jane Doe',
    title: 'Lead a new project',
    description: 'Lead the new mobile app development project',
    dueDate: '2024-06-30',
    status: 'pending',
    progress: 0,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

// Rating scale descriptions
const RATING_DESCRIPTIONS = {
  1: 'Poor',
  2: 'Below Average',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

// Get my performance reviews
router.get('/my-reviews', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      // First get employee ID
      const empSnap = await db.collection('Users').where('uid', '==', uid).limit(1).get();
      let empId;
      empSnap.forEach(doc => empId = doc.id);

      if (!empId) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const snapshot = await db.collection('PerformanceReviews')
        .where('employeeId', '==', empId)
        .orderBy('reviewDate', 'desc')
        .get();
      
      let reviews = [];
      snapshot.forEach(doc => {
        reviews.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ reviews });
    } else {
      // For mock, find by uid
      const reviews = mockReviews.filter(r => {
        // Map uid to mock employee id
        const emp = mockGoals.find(g => g.userId === uid);
        return r.employeeId === (emp ? 'emp002' : uid);
      });
      return res.json({ reviews });
    }
  } catch (err) {
    console.error('Get my reviews error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get my goals
router.get('/my-goals', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const snapshot = await db.collection('Goals')
        .where('userId', '==', uid)
        .orderBy('dueDate', 'asc')
        .get();
      
      let goals = [];
      snapshot.forEach(doc => {
        goals.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ goals });
    } else {
      const goals = mockGoals.filter(g => g.userId === uid);
      return res.json({ goals });
    }
  } catch (err) {
    console.error('Get my goals error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Create goal
router.post('/goals', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { title, description, dueDate } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Title and due date are required' });
    }

    const userName = req.user.name || 'User';

    const newGoal = {
      userId: uid,
      userName,
      title,
      description: description || '',
      dueDate,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    const db = getDb();
    if (db) {
      const docRef = await db.collection('Goals').add(newGoal);
      return res.json({ success: true, goal: { id: docRef.id, ...newGoal } });
    } else {
      newGoal.id = `goal${Date.now()}`;
      mockGoals.push(newGoal);
      return res.json({ success: true, goal: newGoal });
    }
  } catch (err) {
    console.error('Create goal error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update goal progress
router.patch('/goals/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const { progress, status } = req.body;
    const db = getDb();

    const updates = {};
    if (progress !== undefined) updates.progress = progress;
    if (status) updates.status = status;
    updates.updatedAt = new Date().toISOString();

    if (db) {
      const doc = await db.collection('Goals').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Goal not found' });
      }
      if (doc.data().userId !== uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      await db.collection('Goals').doc(id).update(updates);
      return res.json({ success: true });
    } else {
      const index = mockGoals.findIndex(g => g.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Goal not found' });
      }
      if (mockGoals[index].userId !== uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      mockGoals[index] = { ...mockGoals[index], ...updates };
      return res.json({ success: true, goal: mockGoals[index] });
    }
  } catch (err) {
    console.error('Update goal error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete goal
router.delete('/goals/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Goals').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Goal not found' });
      }
      if (doc.data().userId !== uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      await db.collection('Goals').doc(id).delete();
      return res.json({ success: true });
    } else {
      const index = mockGoals.findIndex(g => g.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Goal not found' });
      }
      if (mockGoals[index].userId !== uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      mockGoals.splice(index, 1);
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Delete goal error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all performance reviews (admin only)
router.get('/all', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { employeeId, reviewPeriod } = req.query;
    const db = getDb();

    if (db) {
      let snapshot;
      if (employeeId) {
        snapshot = await db.collection('PerformanceReviews')
          .where('employeeId', '==', employeeId)
          .orderBy('reviewDate', 'desc')
          .get();
      } else {
        snapshot = await db.collection('PerformanceReviews')
          .orderBy('reviewDate', 'desc')
          .get();
      }
      let reviews = [];
      snapshot.forEach(doc => {
        reviews.push({ id: doc.id, ...doc.data() });
      });

      if (reviewPeriod) {
        reviews = reviews.filter(r => r.reviewPeriod === reviewPeriod);
      }

      return res.json({ reviews });
    } else {
      let reviews = [...mockReviews];
      if (employeeId) {
        reviews = reviews.filter(r => r.employeeId === employeeId);
      }
      reviews.sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate));
      return res.json({ reviews });
    }
  } catch (err) {
    console.error('Get all reviews error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all goals (admin only)
router.get('/all-goals', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { status, userId } = req.query;
    const db = getDb();

    if (db) {
      let snapshot;
      if (userId) {
        snapshot = await db.collection('Goals')
          .where('userId', '==', userId)
          .orderBy('dueDate', 'asc')
          .get();
      } else {
        snapshot = await db.collection('Goals')
          .orderBy('dueDate', 'asc')
          .get();
      }
      let goals = [];
      snapshot.forEach(doc => {
        goals.push({ id: doc.id, ...doc.data() });
      });

      if (status) {
        goals = goals.filter(g => g.status === status);
      }

      return res.json({ goals });
    } else {
      let goals = [...mockGoals];
      if (status) {
        goals = goals.filter(g => g.status === status);
      }
      goals.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      return res.json({ goals });
    }
  } catch (err) {
    console.error('Get all goals error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Create performance review (admin only)
router.post('/reviews', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { employeeId, employeeName, reviewPeriod, reviewDate, overallRating, goals, strengths, improvements, comments } = req.body;

    if (!employeeId || !reviewPeriod || !overallRating) {
      return res.status(400).json({ error: 'Employee ID, review period, and rating are required' });
    }

    const newReview = {
      employeeId,
      employeeName: employeeName || 'Employee',
      reviewerId: req.user.uid,
      reviewerName: req.user.name || 'Admin',
      reviewPeriod,
      reviewDate: reviewDate || new Date().toISOString().split('T')[0],
      overallRating,
      goals: goals || [],
      strengths: strengths || '',
      improvements: improvements || '',
      comments: comments || '',
      createdAt: new Date().toISOString(),
    };

    const db = getDb();
    if (db) {
      const docRef = await db.collection('PerformanceReviews').add(newReview);
      return res.json({ success: true, review: { id: docRef.id, ...newReview } });
    } else {
      newReview.id = `rev${Date.now()}`;
      mockReviews.push(newReview);
      return res.json({ success: true, review: newReview });
    }
  } catch (err) {
    console.error('Create review error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get performance statistics (admin)
router.get('/stats', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const db = getDb();
    let reviews = [];
    let goals = [];

    if (db) {
      const reviewSnap = await db.collection('PerformanceReviews').get();
      reviewSnap.forEach(doc => reviews.push({ id: doc.id, ...doc.data() }));

      const goalSnap = await db.collection('Goals').get();
      goalSnap.forEach(doc => goals.push({ id: doc.id, ...doc.data() }));
    } else {
      reviews = mockReviews;
      goals = mockGoals;
    }

    // Calculate review stats
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length).toFixed(1) 
      : 0;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      ratingDistribution[r.overallRating]++;
    });

    // Calculate goal stats
    const goalStats = {
      total: goals.length,
      completed: goals.filter(g => g.status === 'completed').length,
      inProgress: goals.filter(g => g.status === 'in_progress').length,
      pending: goals.filter(g => g.status === 'pending').length,
    };

    return res.json({
      stats: {
        totalReviews: reviews.length,
        averageRating: parseFloat(avgRating),
        ratingDistribution,
        goalStats,
      }
    });
  } catch (err) {
    console.error('Get performance stats error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get rating descriptions
router.get('/ratings', authJwt, async (req, res) => {
  return res.json({ ratings: RATING_DESCRIPTIONS });
});

module.exports = router;


