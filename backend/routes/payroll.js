const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { getDb } = require('../dbProvider');

// In-memory storage for mock mode
let mockPayroll = [];
let mockEmployees = [
  { id: 'emp001', uid: 'admin001', name: 'John Smith', salary: 75000, department: 'Engineering' },
  { id: 'emp002', uid: 'emp002', name: 'Jane Doe', salary: 50000, department: 'HR' },
  { id: 'emp003', uid: 'emp003', name: 'Mike Johnson', salary: 40000, department: 'Sales' },
];

// Default salary structure
const DEFAULT_SALARY_STRUCTURE = {
  basic: 0.6,      // 60% of base
  hra: 0.2,        // 20% of basic
  conveyance: 0.1, // 10% of basic
  special: 0.1,    // 10% of basic
};

// Default deductions
const DEFAULT_DEDUCTIONS = {
  pf: 0.12,        // 12% of basic
  tax: 0.1,        // 10% of basic (simplified)
  insurance: 500,   // Fixed amount
};

// Get salary structure
router.get('/structure', authJwt, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  return res.json({ structure: DEFAULT_SALARY_STRUCTURE, deductions: DEFAULT_DEDUCTIONS });
});

// Calculate salary for an employee
const calculateSalary = (baseSalary, attendance, leaves) => {
  const structure = DEFAULT_SALARY_STRUCTURE;
  const deductions = DEFAULT_DEDUCTIONS;

  // Calculate allowances
  const basic = baseSalary * structure.basic;
  const hra = basic * structure.hra;
  const conveyance = basic * structure.conveyance;
  const special = basic * structure.special;
  const totalAllowances = hra + conveyance + special;

  // Calculate deductions
  const pf = basic * deductions.pf;
  const tax = basic * deductions.tax;
  const insurance = deductions.insurance;
  const totalDeductions = pf + tax + insurance;

  // Calculate working days adjustment
  const workingDays = 30; // Assuming 30 days in month
  const presentDays = attendance?.presentDays || workingDays;
  const absentDays = workingDays - presentDays;
  const perDaySalary = baseSalary / workingDays;
  const salaryAdjustment = -(perDaySalary * absentDays);

  // Calculate net salary
  const grossSalary = baseSalary + totalAllowances + salaryAdjustment;
  const netSalary = grossSalary - totalDeductions;

  return {
    basic: Math.round(basic),
    hra: Math.round(hra),
    conveyance: Math.round(conveyance),
    special: Math.round(special),
    totalAllowances: Math.round(totalAllowances),
    pf: Math.round(pf),
    tax: Math.round(tax),
    insurance,
    totalDeductions: Math.round(totalDeductions),
    grossSalary: Math.round(grossSalary),
    netSalary: Math.round(netSalary),
    presentDays,
    absentDays,
    salaryAdjustment: Math.round(salaryAdjustment),
  };
};

// Generate salary for a month
router.post('/generate', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { month, year, employeeId } = req.body; // month: 1-12, year: YYYY

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
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

    // Get attendance for the month
    let attendanceRecords = [];
    if (db) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      const attSnap = await db.collection('Attendance')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get();
      attSnap.forEach(doc => {
        attendanceRecords.push({ id: doc.id, ...doc.data() });
      });
    }

    // Get leaves for the month
    let leaveRecords = [];
    if (db) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      const leaveSnap = await db.collection('Leaves')
        .where('status', '==', 'approved')
        .get();
      leaveSnap.forEach(doc => {
        leaveRecords.push({ id: doc.id, ...doc.data() });
      });
    }

    const generatedPayroll = [];

    for (const emp of employees) {
      if (employeeId && emp.id !== employeeId) continue;

      const empAttendance = attendanceRecords.filter(a => a.userId === emp.uid);
      const presentDays = empAttendance.length;

      const salaryData = calculateSalary(emp.salary || 30000, { presentDays }, leaveRecords);

      const payrollRecord = {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        baseSalary: emp.salary || 30000,
        month,
        year,
        ...salaryData,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.uid,
      };

      if (db) {
        // Check if payroll already exists
        const existing = await db.collection('Payroll')
          .where('employeeId', '==', emp.id)
          .where('month', '==', month)
          .where('year', '==', year)
          .get();
        
        if (!existing.empty) {
          // Update existing
          existing.forEach(doc => {
            db.collection('Payroll').doc(doc.id).update(payrollRecord);
          });
        } else {
          await db.collection('Payroll').add(payrollRecord);
        }
      } else {
        // Check if exists in mock
        const existingIndex = mockPayroll.findIndex(p => 
          p.employeeId === emp.id && p.month === month && p.year === year
        );
        if (existingIndex >= 0) {
          mockPayroll[existingIndex] = { ...mockPayroll[existingIndex], ...payrollRecord, id: mockPayroll[existingIndex].id };
        } else {
          payrollRecord.id = `payroll${Date.now()}_${emp.id}`;
          mockPayroll.push(payrollRecord);
        }
      }

      generatedPayroll.push(payrollRecord);
    }

    return res.json({ success: true, payroll: generatedPayroll });
  } catch (err) {
    console.error('Generate payroll error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get payroll for current user
router.get('/my-salary', authJwt, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      // Find employee by uid
      const empSnap = await db.collection('Users').where('uid', '==', uid).limit(1).get();
      let empId;
      empSnap.forEach(doc => empId = doc.id);

      if (!empId) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const snapshot = await db.collection('Payroll')
        .where('employeeId', '==', empId)
        .orderBy('year', 'desc')
        .orderBy('month', 'desc')
        .get();
      
      const payroll = [];
      snapshot.forEach(doc => {
        payroll.push({ id: doc.id, ...doc.data() });
      });
      return res.json({ payroll });
    } else {
      const emp = mockEmployees.find(e => e.uid === uid);
      if (!emp) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      const payroll = mockPayroll.filter(p => p.employeeId === emp.id);
      return res.json({ payroll });
    }
  } catch (err) {
    console.error('Get my salary error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all payroll (admin only)
router.get('/all', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { month, year } = req.query;
    const db = getDb();

    if (db) {
      let query = db.collection('Payroll').orderBy('generatedAt', 'desc');
      const snapshot = await query.get();
      let payroll = [];
      snapshot.forEach(doc => {
        payroll.push({ id: doc.id, ...doc.data() });
      });
      
      if (month) payroll = payroll.filter(p => p.month === parseInt(month));
      if (year) payroll = payroll.filter(p => p.year === parseInt(year));
      
      return res.json({ payroll });
    } else {
      let payroll = [...mockPayroll];
      if (month) payroll = payroll.filter(p => p.month === parseInt(month));
      if (year) payroll = payroll.filter(p => p.year === parseInt(year));
      return res.json({ payroll });
    }
  } catch (err) {
    console.error('Get all payroll error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get payroll by ID
router.get('/:id', authJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    if (db) {
      const doc = await db.collection('Payroll').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Payroll not found' });
      }
      return res.json({ payroll: { id: doc.id, ...doc.data() } });
    } else {
      const payroll = mockPayroll.find(p => p.id === id);
      if (!payroll) {
        return res.status(404).json({ error: 'Payroll not found' });
      }
      return res.json({ payroll });
    }
  } catch (err) {
    console.error('Get payroll error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update payroll (admin only)
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
      await db.collection('Payroll').doc(id).update(updates);
      return res.json({ success: true });
    } else {
      const index = mockPayroll.findIndex(p => p.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Payroll not found' });
      }
      mockPayroll[index] = { ...mockPayroll[index], ...updates };
      return res.json({ success: true, payroll: mockPayroll[index] });
    }
  } catch (err) {
    console.error('Update payroll error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get payroll statistics (admin)
router.get('/stats', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const db = getDb();
    let payroll = [];

    if (db) {
      const snapshot = await db.collection('Payroll').get();
      snapshot.forEach(doc => {
        payroll.push({ id: doc.id, ...doc.data() });
      });
    } else {
      payroll = mockPayroll;
    }

    const totalSalary = payroll.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const totalAllowances = payroll.reduce((sum, p) => sum + (p.totalAllowances || 0), 0);
    const totalDeductions = payroll.reduce((sum, p) => sum + (p.totalDeductions || 0), 0);

    // By department
    const byDepartment = {};
    payroll.forEach(p => {
      const dept = p.department || 'Unassigned';
      if (!byDepartment[dept]) {
        byDepartment[dept] = { total: 0, count: 0 };
      }
      byDepartment[dept].total += p.netSalary || 0;
      byDepartment[dept].count++;
    });

    return res.json({
      stats: {
        totalRecords: payroll.length,
        totalSalary: Math.round(totalSalary),
        totalAllowances: Math.round(totalAllowances),
        totalDeductions: Math.round(totalDeductions),
        averageSalary: payroll.length > 0 ? Math.round(totalSalary / payroll.length) : 0,
        byDepartment,
      }
    });
  } catch (err) {
    console.error('Get payroll stats error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


