const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { getDb } = require('../firebaseAdmin');

// In-memory storage for mock mode
let mockHolidays = [
  {
    id: 'hol001',
    name: 'Republic Day',
    date: '2024-01-26',
    day: 'Friday',
    category: 'national',
    isOptional: false,
    description: 'Celebration of Indian Constitution',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'hol002',
    name: 'Holi',
    date: '2024-03-25',
    day: 'Monday',
    category: 'festival',
    isOptional: false,
    description: 'Festival of colors',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'hol003',
    name: 'Good Friday',
    date: '2024-03-29',
    day: 'Friday',
    category: 'religious',
    isOptional: false,
    description: 'Christian holiday',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'hol004',
    name: 'Independence Day',
    date: '2024-08-15',
    day: 'Thursday',
    category: 'national',
    isOptional: false,
    description: 'National holiday',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'hol005',
    name: 'Gandhi Jayanti',
    date: '2024-10-02',
    day: 'Wednesday',
    category: 'national',
    isOptional: false,
    description: 'Birth anniversary of Mahatma Gandhi',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'hol006',
    name: 'Diwali',
    date: '2024-11-01',
    day: 'Friday',
    category: 'festival',
    isOptional: false,
    description: 'Festival of lights',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'hol007',
    name: 'Christmas',
    date: '2024-12-25',
    day: 'Wednesday',
    category: 'religious',
    isOptional: false,
    description: 'Christmas celebration',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

// Holiday categories
const HOLIDAY_CATEGORIES = ['national', 'festival', 'religious', 'company'];

// Get all holidays
router.get('/', authJwt, async (req, res) => {
  try {
    const { year } = req.query;
    const db = getDb();

    if (db) {
      let query = db.collection('Holidays').orderBy('date', 'asc');
      if (year) {
        query = db.collection('Holidays').where('date', '>=', `${year}-01-01`).where('date', '<=', `${year}-12-31`).orderBy('date', 'asc');
      }
      const snapshot = await query.get();
      let holidays = [];
      snapshot.forEach(doc => {
        holidays.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ holidays });
    } else {
      let holidays = [...mockHolidays];
      if (year) {
        holidays = holidays.filter(h => h.date.startsWith(String(year)));
      }
      holidays.sort((a, b) => new Date(a.date) - new Date(b.date));
      return res.json({ holidays });
    }
  } catch (err) {
    console.error('Get holidays error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get holiday by ID
router.get('/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Holidays').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Holiday not found' });
      }
      return res.json({ holiday: { id: doc.id, ...doc.data() } });
    } else {
      const holiday = mockHolidays.find(h => h.id === id);
      if (!holiday) {
        return res.status(404).json({ error: 'Holiday not found' });
      }
      return res.json({ holiday });
    }
  } catch (err) {
    console.error('Get holiday error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Create holiday (admin only)
router.post('/', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { name, date, day, category, isOptional, description } = req.body;

    if (!name || !date || !day) {
      return res.status(400).json({ error: 'Name, date, and day are required' });
    }

    const newHoliday = {
      name,
      date,
      day,
      category: category || 'company',
      isOptional: isOptional || false,
      description: description || '',
      createdAt: new Date().toISOString(),
    };

    const db = getDb();
    if (db) {
      const docRef = await db.collection('Holidays').add(newHoliday);
      return res.json({ success: true, holiday: { id: docRef.id, ...newHoliday } });
    } else {
      newHoliday.id = `hol${Date.now()}`;
      mockHolidays.push(newHoliday);
      return res.json({ success: true, holiday: newHoliday });
    }
  } catch (err) {
    console.error('Create holiday error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update holiday (admin only)
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
      await db.collection('Holidays').doc(id).update(updates);
      return res.json({ success: true });
    } else {
      const index = mockHolidays.findIndex(h => h.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Holiday not found' });
      }
      mockHolidays[index] = { ...mockHolidays[index], ...updates };
      return res.json({ success: true, holiday: mockHolidays[index] });
    }
  } catch (err) {
    console.error('Update holiday error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete holiday (admin only)
router.delete('/:id', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const db = getDb();

    if (db) {
      await db.collection('Holidays').doc(id).delete();
      return res.json({ success: true });
    } else {
      const index = mockHolidays.findIndex(h => h.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Holiday not found' });
      }
      mockHolidays.splice(index, 1);
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Delete holiday error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get holiday categories
router.get('/categories', authJwt, async (req, res) => {
  return res.json({ categories: HOLIDAY_CATEGORIES });
});

// Get upcoming holidays
router.get('/upcoming', authJwt, async (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    if (db) {
      const snapshot = await db.collection('Holidays')
        .where('date', '>=', today)
        .orderBy('date', 'asc')
        .limit(10)
        .get();
      
      let holidays = [];
      snapshot.forEach(doc => {
        holidays.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ holidays });
    } else {
      const holidays = mockHolidays
        .filter(h => h.date >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 10);
      return res.json({ holidays });
    }
  } catch (err) {
    console.error('Get upcoming holidays error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
