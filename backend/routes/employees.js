const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { getDb } = require('../dbProvider');

// In-memory storage for mock mode
let mockEmployees = [
  {
    id: 'emp001',
    uid: 'admin001',
    name: 'John Smith',
    email: 'john.smith@company.com',
    phone: '+1234567890',
    department: 'Engineering',
    designation: 'Senior Developer',
    joiningDate: '2023-01-15',
    role: 'admin',
    status: 'active',
    employeeId: 'EMP001',
    aadharNumber: '123456789012',
    address: '123 Main Street, City',
    salary: 75000,
    photoURL: null,
    aadharURL: null,
  },
  {
    id: 'emp002',
    uid: 'emp002',
    name: 'Jane Doe',
    email: 'jane.doe@company.com',
    phone: '+1234567891',
    department: 'HR',
    designation: 'HR Manager',
    joiningDate: '2023-03-20',
    role: 'employee',
    status: 'active',
    employeeId: 'EMP002',
    aadharNumber: '123456789013',
    address: '456 Oak Avenue, City',
    salary: 50000,
    photoURL: null,
    aadharURL: null,
  },
  {
    id: 'emp003',
    uid: 'emp003',
    name: 'Mike Johnson',
    email: 'mike.johnson@company.com',
    phone: '+1234567892',
    department: 'Sales',
    designation: 'Sales Executive',
    joiningDate: '2023-06-01',
    role: 'employee',
    status: 'active',
    employeeId: 'EMP003',
    aadharNumber: '123456789014',
    address: '789 Pine Road, City',
    salary: 40000,
    photoURL: null,
    aadharURL: null,
  },

  {
    id: 'emp004',
    uid: 'emp004',
    name: 'Emily Carter',
    email: 'emily.carter@company.com',
    phone: '+1234567893',
    department: 'Finance',
    designation: 'Accountant',
    joiningDate: '2022-11-10',
    role: 'employee',
    status: 'active',
    employeeId: 'EMP004',
    aadharNumber: '123456789015',
    address: '22 Lake View, City',
    salary: 52000,
    photoURL: null,
    aadharURL: null,
  },
  {
    id: 'emp005',
    uid: 'emp005',
    name: 'David Lee',
    email: 'david.lee@company.com',
    phone: '+1234567894',
    department: 'Engineering',
    designation: 'Frontend Developer',
    joiningDate: '2024-02-05',
    role: 'employee',
    status: 'active',
    employeeId: 'EMP005',
    aadharNumber: '123456789016',
    address: '15 River Street, City',
    salary: 68000,
    photoURL: null,
    aadharURL: null,
  },
  {
    id: 'emp006',
    uid: 'emp006',
    name: 'Sophia Turner',
    email: 'sophia.turner@company.com',
    phone: '+1234567895',
    department: 'Marketing',
    designation: 'Marketing Specialist',
    joiningDate: '2023-08-18',
    role: 'employee',
    status: 'active',
    employeeId: 'EMP006',
    aadharNumber: '123456789017',
    address: '8 Garden Lane, City',
    salary: 47000,
    photoURL: null,
    aadharURL: null,
  },
  {
    id: 'emp007',
    uid: 'emp007',
    name: 'Rahul Verma',
    email: 'rahul.verma@company.com',
    phone: '+1234567896',
    department: 'Support',
    designation: 'Support Engineer',
    joiningDate: '2021-12-01',
    role: 'employee',
    status: 'active',
    employeeId: 'EMP007',
    aadharNumber: '123456789018',
    address: '91 Elm Avenue, City',
    salary: 43000,
    photoURL: null,
    aadharURL: null,
  },
  {
    id: 'emp008',
    uid: 'emp008',
    name: 'Olivia Martinez',
    email: 'olivia.martinez@company.com',
    phone: '+1234567897',
    department: 'Operations',
    designation: 'Operations Manager',
    joiningDate: '2020-07-14',
    role: 'employee',
    status: 'active',
    employeeId: 'EMP008',
    aadharNumber: '123456789019',
    address: '40 Central Park, City',
    salary: 78000,
    photoURL: null,
    aadharURL: null,
  },
  {
    id: 'emp009',
    uid: 'emp009',
    name: 'Noah Kim',
    email: 'noah.kim@company.com',
    phone: '+1234567898',
    department: 'Engineering',
    designation: 'Backend Developer',
    joiningDate: '2022-04-27',
    role: 'employee',
    status: 'active',
    employeeId: 'EMP009',
    aadharNumber: '123456789020',
    address: '11 Sunset Boulevard, City',
    salary: 71000,
    photoURL: null,
    aadharURL: null,
  },
  {
    id: 'emp010',
    uid: 'emp010',
    name: 'Priya Nair',
    email: 'priya.nair@company.com',
    phone: '+1234567899',
    department: 'HR',
    designation: 'Recruiter',
    joiningDate: '2024-01-09',
    role: 'employee',
    status: 'active',
    employeeId: 'EMP010',
    aadharNumber: '123456789021',
    address: '77 Maple Drive, City',
    salary: 46000,
    photoURL: null,
    aadharURL: null,
  },
];

// Get all employees (admin only)
router.get('/', authJwt, async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const db = getDb();
    if (db) {
      const snapshot = await db.collection('Users').get();
      const employees = [];
      snapshot.forEach(doc => {
        employees.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ employees });
    } else {
      return res.json({ employees: mockEmployees });
    }
  } catch (err) {
    console.error('Get employees error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get employee by ID
router.get('/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Users').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      return res.json({ employee: { id: doc.id, ...doc.data() } });
    } else {
      const employee = mockEmployees.find(e => e.id === id || e.uid === id);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      return res.json({ employee });
    }
  } catch (err) {
    console.error('Get employee error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add new employee (admin only)
router.post('/', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { name, email, phone, department, designation, salary, joiningDate, address, aadharNumber } = req.body;
    
    // Generate employee ID
    const employeeId = `EMP${String(mockEmployees.length + 1).padStart(3, '0')}`;
    const newEmployee = {
      name,
      email,
      phone,
      department,
      designation,
      salary: salary || 0,
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      role: 'employee',
      status: 'active',
      employeeId,
      address: address || '',
      aadharNumber: aadharNumber || '',
      createdAt: new Date().toISOString(),
    };

    const db = getDb();
    if (db) {
      const docRef = await db.collection('Users').add(newEmployee);
      return res.json({ success: true, employee: { id: docRef.id, ...newEmployee } });
    } else {
      newEmployee.id = `emp${Date.now()}`;
      newEmployee.uid = newEmployee.id;
      mockEmployees.push(newEmployee);
      return res.json({ success: true, employee: newEmployee });
    }
  } catch (err) {
    console.error('Add employee error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update employee
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
      await db.collection('Users').doc(id).update(updates);
      return res.json({ success: true });
    } else {
      const index = mockEmployees.findIndex(e => e.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      mockEmployees[index] = { ...mockEmployees[index], ...updates };
      return res.json({ success: true, employee: mockEmployees[index] });
    }
  } catch (err) {
    console.error('Update employee error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete employee (admin only)
router.delete('/:id', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const db = getDb();

    if (db) {
      await db.collection('Users').doc(id).delete();
      return res.json({ success: true });
    } else {
      const index = mockEmployees.findIndex(e => e.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      mockEmployees.splice(index, 1);
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Delete employee error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Activate/Deactivate employee
router.patch('/:id/status', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const db = getDb();
    if (db) {
      await db.collection('Users').doc(id).update({ status });
      return res.json({ success: true });
    } else {
      const index = mockEmployees.findIndex(e => e.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      mockEmployees[index].status = status;
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get current user profile
router.get('/profile/me', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      const snapshot = await db.collection('Users').where('uid', '==', uid).limit(1).get();
      if (snapshot.empty) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      let profile = null;
      snapshot.forEach(doc => {
        profile = { id: doc.id, ...doc.data() };
      });
      return res.json({ profile });
    } else {
      const profile = mockEmployees.find(e => e.uid === uid);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      return res.json({ profile });
    }
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update current user profile
router.put('/profile/me', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const updates = req.body;
    delete updates.uid; // Prevent uid change
    delete updates.role; // Prevent role change
    updates.updatedAt = new Date().toISOString();

    const db = getDb();
    if (db) {
      const snapshot = await db.collection('Users').where('uid', '==', uid).limit(1).get();
      if (snapshot.empty) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      let docId;
      snapshot.forEach(doc => {
        docId = doc.id;
      });
      await db.collection('Users').doc(docId).update(updates);
      return res.json({ success: true });
    } else {
      const index = mockEmployees.findIndex(e => e.uid === uid);
      if (index === -1) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      mockEmployees[index] = { ...mockEmployees[index], ...updates };
      return res.json({ success: true, profile: mockEmployees[index] });
    }
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get employees count by department
router.get('/stats/by-department', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const db = getDb();
    let employees = [];

    if (db) {
      const snapshot = await db.collection('Users').get();
      snapshot.forEach(doc => {
        employees.push({ id: doc.id, ...doc.data() });
      });
    } else {
      employees = mockEmployees;
    }

    const deptStats = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      if (!deptStats[dept]) {
        deptStats[dept] = { total: 0, active: 0, inactive: 0 };
      }
      deptStats[dept].total++;
      if (emp.status === 'active') {
        deptStats[dept].active++;
      } else {
        deptStats[dept].inactive++;
      }
    });

    return res.json({ stats: deptStats });
  } catch (err) {
    console.error('Get dept stats error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


