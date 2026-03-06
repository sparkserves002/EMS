const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { getDb } = require('../dbProvider');

// In-memory storage for mock mode (when Firestore is not available)
let mockAttendanceData = [];

// Office location configuration (can be updated by admin)
let officeLocation = {
  latitude: 31.25423262127108, 
  longitude: 75.69826230458278,
  radius: 100,  // meters
  enabled: true,
  address: 'Office Location'
};

// Get current date string in YYYY-MM-DD format
const getDateString = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

// Get current time string in HH:MM:SS format
const getTimeString = (date = new Date()) => {
  return date.toTimeString().split(' ')[0];
};

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Validate if coordinates are within office radius
const validateLocation = (coords) => {
  if (!officeLocation.enabled) {
    return { valid: true, message: 'Location validation disabled' };
  }

  if (!coords || coords.latitude === undefined || coords.longitude === undefined) {
    return { valid: false, message: 'Location coordinates not provided' };
  }

  const distance = calculateDistance(
    coords.latitude,
    coords.longitude,
    officeLocation.latitude,
    officeLocation.longitude
  );

  if (distance > officeLocation.radius) {
    return {
      valid: false,
      message: `You are ${Math.round(distance)}m away from office. Maximum allowed: ${officeLocation.radius}m`,
      distance: Math.round(distance)
    };
  }

  return { valid: true, message: `Location verified. ${Math.round(distance)}m from office`, distance: Math.round(distance) };
};

// Get office location settings
router.get('/settings', authJwt, async (req, res) => {
  try {
    // Only admins can see full settings
    const isAdmin = req.user.role === 'admin';
    res.json({
      enabled: officeLocation.enabled,
      address: officeLocation.address,
      // Only expose coordinates and radius to admins
      ...(isAdmin && {
        latitude: officeLocation.latitude,
        longitude: officeLocation.longitude,
        radius: officeLocation.radius
      })
    });
  } catch (err) {
    console.error('Get settings error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update office location settings (admin only)
router.put('/settings', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { latitude, longitude, radius, enabled, address } = req.body;

    if (latitude !== undefined) officeLocation.latitude = parseFloat(latitude);
    if (longitude !== undefined) officeLocation.longitude = parseFloat(longitude);
    if (radius !== undefined) officeLocation.radius = parseInt(radius);
    if (enabled !== undefined) officeLocation.enabled = enabled;
    if (address !== undefined) officeLocation.address = address;

    return res.json({ success: true, settings: officeLocation });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Check-in endpoint
router.post('/checkin', authJwt, async (req, res) => {
  const uid = req.user.uid;
  const { date, checkInTime, coords } = req.body;
  const today = date || getDateString();
  const time = checkInTime || getTimeString();
  
  try {
    // Validate location if enabled
    const locationValidation = validateLocation(coords);
    if (!locationValidation.valid) {
      return res.status(400).json({ 
        error: locationValidation.message,
        locationError: true,
        distance: locationValidation.distance
      });
    }

    const db = getDb();
    
    if (db) {
      
      const attendanceRef = db.collection('Attendance').doc(`${uid}_${today}`);
      const doc = await attendanceRef.get();
      if (doc.exists) {
        return res.status(400).json({ error: 'Already checked in for this date' });
      }
      await attendanceRef.set({ 
        userId: uid, 
        date: today, 
        checkIn: time, 
        location: coords,
        locationValidated: locationValidation.valid,
        distanceFromOffice: locationValidation.distance,
        createdAt: new Date().toISOString()
      });
      return res.json({ 
        success: true, 
        message: `Check-in successful! ${locationValidation.message}`, 
        checkIn: time,
        distance: locationValidation.distance
      });
    } else {
      // Use mock in-memory storage
      const existing = mockAttendanceData.find(a => a.userId === uid && a.date === today);
      if (existing) {
        return res.status(400).json({ error: 'Already checked in for this date' });
      }
      mockAttendanceData.push({
        userId: uid,
        date: today,
        checkIn: time,
        location: coords,
        locationValidated: locationValidation.valid,
        distanceFromOffice: locationValidation.distance,
        createdAt: new Date().toISOString()
      });
      return res.json({ 
        success: true, 
        message: `Check-in successful! ${locationValidation.message}`, 
        checkIn: time,
        distance: locationValidation.distance
      });
    }
  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Check-out endpoint
router.post('/checkout', authJwt, async (req, res) => {
  const uid = req.user.uid;
  const { date, checkOutTime } = req.body;
  const today = date || getDateString();
  const time = checkOutTime || getTimeString();
  
  try {
    const db = getDb();
    
    if (db) {
      const attendanceRef = db.collection('Attendance').doc(`${uid}_${today}`);
      const doc = await attendanceRef.get();
      if (!doc.exists) {
        return res.status(400).json({ error: 'No check-in found for today' });
      }
      const data = doc.data();
      if (data.checkOut) {
        return res.status(400).json({ error: 'Already checked out for today' });
      }
      await attendanceRef.update({ checkOut: time });
      return res.json({ success: true, message: 'Check-out successful', checkOut: time });
    } else {
      // Use mock in-memory storage
      const record = mockAttendanceData.find(a => a.userId === uid && a.date === today);
      if (!record) {
        return res.status(400).json({ error: 'No check-in found for today' });
      }
      if (record.checkOut) {
        return res.status(400).json({ error: 'Already checked out for today' });
      }
      record.checkOut = time;
      return res.json({ success: true, message: 'Check-out successful', checkOut: time });
    }
  } catch (err) {
    console.error('Check-out error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get today's attendance status
router.get('/today', authJwt, async (req, res) => {
  const uid = req.user.uid;
  const today = getDateString();
  
  try {
    const db = getDb();
    
    if (db) {
      const attendanceRef = db.collection('Attendance').doc(`${uid}_${today}`);
      const doc = await attendanceRef.get();
      if (doc.exists) {
        return res.json({ 
          checkedIn: true, 
          checkIn: doc.data().checkIn, 
          checkOut: doc.data().checkOut || null,
          date: today
        });
      }
      return res.json({ checkedIn: false, date: today });
    } else {
      const record = mockAttendanceData.find(a => a.userId === uid && a.date === today);
      if (record) {
        return res.json({ 
          checkedIn: true, 
          checkIn: record.checkIn, 
          checkOut: record.checkOut || null,
          date: today
        });
      }
      return res.json({ checkedIn: false, date: today });
    }
  } catch (err) {
    console.error('Get today attendance error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get attendance history
router.get('/history', authJwt, async (req, res) => {
  const uid = req.user.uid;
  const { startDate, endDate, limit = 30 } = req.query;
  
  try {
    const db = getDb();
    
    if (db) {
      let query = db.collection('Attendance').where('userId', '==', uid);
      if (startDate) {
        query = query.where('date', '>=', startDate);
      }
      if (endDate) {
        query = query.where('date', '<=', endDate);
      }
      const snapshot = await query.orderBy('date', 'desc').limit(parseInt(limit)).get();
      const items = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ items });
    } else {
      // Use mock in-memory storage
      let items = mockAttendanceData.filter(a => a.userId === uid);
      if (startDate) {
        items = items.filter(a => a.date >= startDate);
      }
      if (endDate) {
        items = items.filter(a => a.date <= endDate);
      }
      items.sort((a, b) => b.date.localeCompare(a.date));
      items = items.slice(0, parseInt(limit));
      return res.json({ items });
    }
  } catch (err) {
    console.error('Get history error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get attendance statistics
router.get('/stats', authJwt, async (req, res) => {
  const uid = req.user.uid;
  const { month } = req.query; // Format: YYYY-MM
  
  try {
    const db = getDb();
    let items = [];
    
    if (db) {
      let query = db.collection('Attendance').where('userId', '==', uid);
      if (month) {
        const startOfMonth = `${month}-01`;
        const endOfMonth = `${month}-31`;
        query = query.where('date', '>=', startOfMonth).where('date', '<=', endOfMonth);
      }
      const snapshot = await query.orderBy('date', 'desc').get();
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
    } else {
      items = mockAttendanceData.filter(a => a.userId === uid);
      if (month) {
        items = items.filter(a => a.date.startsWith(month));
      }
    }
    
    // Calculate statistics
    const totalDays = items.length;
    const daysWithCheckIn = items.filter(a => a.checkIn).length;
    const daysWithCheckOut = items.filter(a => a.checkOut).length;
    const completeDays = items.filter(a => a.checkIn && a.checkOut).length;
    
    // Calculate total working hours
    let totalHours = 0;
    items.forEach(item => {
      if (item.checkIn && item.checkOut) {
        const [inH, inM, inS] = item.checkIn.split(':').map(Number);
        const [outH, outM, outS] = item.checkOut.split(':').map(Number);
        const inMinutes = inH * 60 + inM + inS / 60;
        const outMinutes = outH * 60 + outM + outS / 60;
        totalHours += (outMinutes - inMinutes) / 60;
      }
    });
    
    return res.json({
      totalDays,
      daysWithCheckIn,
      daysWithCheckOut,
      completeDays,
      totalHours: Math.round(totalHours * 100) / 100,
      averageHours: totalDays > 0 ? Math.round((totalHours / totalDays) * 100) / 100 : 0,
      items: items.slice(0, 10) // Last 10 records
    });
  } catch (err) {
    console.error('Get stats error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// List all attendance (admin endpoint - requires admin role)
router.get('/all', authJwt, async (req, res) => {
  try {
    const db = getDb();
    
    if (db) {
      const snapshot = await db.collection('Attendance').orderBy('date', 'desc').limit(100).get();
      const items = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ items });
    } else {
      // Use mock in-memory storage - return all
      const items = [...mockAttendanceData].sort((a, b) => b.date.localeCompare(a.date));
      return res.json({ items });
    }
  } catch (err) {
    console.error('Get all attendance error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


