const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { getDb } = require('../firebaseAdmin');

// In-memory storage for mock mode
let mockEmployees = [
  { id: 'emp001', uid: 'admin001', name: 'John Smith', department: 'Engineering', status: 'active' },
  { id: 'emp002', uid: 'emp002', name: 'Jane Doe', department: 'HR', status: 'active' },
  { id: 'emp003', uid: 'emp003', name: 'Mike Johnson', department: 'Sales', status: 'active' },
];

let mockAttendance = [
  { id: 'att001', userId: 'emp002', userName: 'Jane Doe', date: '2024-01-15', checkIn: '09:00', checkOut: '18:00', status: 'present' },
  { id: 'att002', userId: 'emp003', userName: 'Mike Johnson', date: '2024-01-15', checkIn: '09:15', checkOut: '18:00', status: 'present' },
  { id: 'att003', userId: 'emp002', userName: 'Jane Doe', date: '2024-01-16', checkIn: '09:00', checkOut: '18:00', status: 'present' },
];

let mockLeaves = [
  { id: 'leave001', userId: 'emp002', userName: 'Jane Doe', leaveType: 'sick', startDate: '2024-01-20', endDate: '2024-01-21', status: 'approved', days: 2 },
  { id: 'leave002', userId: 'emp003', userName: 'Mike Johnson', leaveType: 'casual', startDate: '2024-01-25', endDate: '2024-01-25', status: 'pending', days: 1 },
];

let mockPayroll = [
  { id: 'pay001', employeeId: 'emp001', employeeName: 'John Smith', department: 'Engineering', month: 1, year: 2024, netSalary: 75000, basic: 45000, hra: 9000, pf: 5400, tax: 4500 },
  { id: 'pay002', employeeId: 'emp002', employeeName: 'Jane Doe', department: 'HR', month: 1, year: 2024, netSalary: 45000, basic: 27000, hra: 5400, pf: 3240, tax: 2700 },
  { id: 'pay003', employeeId: 'emp003', employeeName: 'Mike Johnson', department: 'Sales', month: 1, year: 2024, netSalary: 36000, basic: 21600, hra: 4320, pf: 2592, tax: 2160 },
];

// Generate attendance report
router.get('/attendance', authJwt, async (req, res) => {
  try {
    const { startDate, endDate, department, employeeId } = req.query;
    const db = getDb();

    let attendance = [];
    let employees = [];

    if (db) {
      const empSnap = await db.collection('Users').get();
      empSnap.forEach(doc => employees.push({ id: doc.id, ...doc.data() }));
      
      let attQuery = db.collection('Attendance');
      if (startDate && endDate) {
        attQuery = attQuery.where('date', '>=', startDate).where('date', '<=', endDate);
      }
      const attSnap = await attQuery.orderBy('date', 'desc').get();
      attSnap.forEach(doc => attendance.push({ id: doc.id, ...doc.data() }));
    } else {
      employees = mockEmployees;
      attendance = mockAttendance;
      
      if (startDate) {
        attendance = attendance.filter(a => a.date >= startDate);
      }
      if (endDate) {
        attendance = attendance.filter(a => a.date <= endDate);
      }
    }

    // Filter by employee
    if (employeeId) {
      attendance = attendance.filter(a => a.userId === employeeId || a.employeeId === employeeId);
    }

    // Filter by department
    if (department) {
      const deptEmployees = employees.filter(e => e.department === department).map(e => e.uid);
      attendance = attendance.filter(a => deptEmployees.includes(a.userId));
    }

    // Calculate statistics
    const totalRecords = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;

    // Employee-wise summary
    const employeeSummary = {};
    employees.forEach(emp => {
      const empAttendance = attendance.filter(a => a.userId === emp.uid || a.employeeId === emp.id);
      employeeSummary[emp.uid] = {
        name: emp.name,
        department: emp.department,
        present: empAttendance.filter(a => a.status === 'present').length,
        absent: empAttendance.filter(a => a.status === 'absent').length,
        late: empAttendance.filter(a => a.status === 'late').length,
        total: empAttendance.length,
      };
    });

    return res.json({
      report: {
        period: { startDate, endDate },
        totalRecords,
        present,
        absent,
        late,
        presentPercentage: totalRecords > 0 ? Math.round((present / totalRecords) * 100) : 0,
        employeeSummary,
      }
    });
  } catch (err) {
    console.error('Get attendance report error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Generate leave report
router.get('/leaves', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { startDate, endDate, department, status } = req.query;
    const db = getDb();

    let leaves = [];
    let employees = [];

    if (db) {
      const empSnap = await db.collection('Users').get();
      empSnap.forEach(doc => employees.push({ id: doc.id, ...doc.data() }));
      
      let leaveQuery = db.collection('Leaves');
      const leaveSnap = await leaveQuery.orderBy('startDate', 'desc').get();
      leaveSnap.forEach(doc => leaves.push({ id: doc.id, ...doc.data() }));
    } else {
      employees = mockEmployees;
      leaves = mockLeaves;

      if (startDate) {
        leaves = leaves.filter(l => l.startDate >= startDate);
      }
      if (endDate) {
        leaves = leaves.filter(l => l.endDate <= endDate);
      }
    }

    // Filter by status
    if (status) {
      leaves = leaves.filter(l => l.status === status);
    }

    // Filter by department
    if (department) {
      const deptEmployeeIds = employees.filter(e => e.department === department).map(e => e.uid);
      leaves = leaves.filter(l => deptEmployeeIds.includes(l.userId));
    }

    // Calculate statistics
    const totalLeaves = leaves.length;
    const approved = leaves.filter(l => l.status === 'approved').length;
    const pending = leaves.filter(l => l.status === 'pending').length;
    const rejected = leaves.filter(l => l.status === 'rejected').length;

    // By leave type
    const byType = {};
    leaves.forEach(leave => {
      const type = leave.leaveType || 'other';
      if (!byType[type]) {
        byType[type] = { count: 0, days: 0 };
      }
      byType[type].count++;
      byType[type].days += leave.days || 1;
    });

    // By department
    const byDepartment = {};
    leaves.forEach(leave => {
      const emp = employees.find(e => e.uid === leave.userId);
      const dept = emp?.department || 'Unknown';
      if (!byDepartment[dept]) {
        byDepartment[dept] = { count: 0, days: 0 };
      }
      byDepartment[dept].count++;
      byDepartment[dept].days += leave.days || 1;
    });

    return res.json({
      report: {
        period: { startDate, endDate },
        totalLeaves,
        approved,
        pending,
        rejected,
        byType,
        byDepartment,
      }
    });
  } catch (err) {
    console.error('Get leave report error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Generate payroll report
router.get('/payroll', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { month, year, department } = req.query;
    const db = getDb();

    let payroll = [];
    let employees = [];

    if (db) {
      const empSnap = await db.collection('Users').get();
      empSnap.forEach(doc => employees.push({ id: doc.id, ...doc.data() }));
      
      let payrollQuery = db.collection('Payroll');
      if (month && year) {
        payrollQuery = payrollQuery.where('month', '==', parseInt(month)).where('year', '==', parseInt(year));
      }
      const payrollSnap = await payrollQuery.orderBy('generatedAt', 'desc').get();
      payrollSnap.forEach(doc => payroll.push({ id: doc.id, ...doc.data() }));
    } else {
      employees = mockEmployees;
      payroll = mockPayroll;

      if (month) {
        payroll = payroll.filter(p => p.month === parseInt(month));
      }
      if (year) {
        payroll = payroll.filter(p => p.year === parseInt(year));
      }
    }

    // Filter by department
    if (department) {
      payroll = payroll.filter(p => p.department === department);
    }

    // Calculate statistics
    const totalEmployees = payroll.length;
    const totalSalary = payroll.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const totalBasic = payroll.reduce((sum, p) => sum + (p.basic || 0), 0);
    const totalHra = payroll.reduce((sum, p) => sum + (p.hra || 0), 0);
    const totalPf = payroll.reduce((sum, p) => sum + (p.pf || 0), 0);
    const totalTax = payroll.reduce((sum, p) => sum + (p.tax || 0), 0);

    // By department
    const byDepartment = {};
    payroll.forEach(p => {
      const dept = p.department || 'Unknown';
      if (!byDepartment[dept]) {
        byDepartment[dept] = { employees: 0, totalSalary: 0, avgSalary: 0 };
      }
      byDepartment[dept].employees++;
      byDepartment[dept].totalSalary += p.netSalary || 0;
    });

    // Calculate averages
    Object.keys(byDepartment).forEach(dept => {
      byDepartment[dept].avgSalary = Math.round(byDepartment[dept].totalSalary / byDepartment[dept].employees);
    });

    return res.json({
      report: {
        period: { month, year },
        totalEmployees,
        totalSalary,
        totalBasic,
        totalHra,
        totalPf,
        totalTax,
        averageSalary: totalEmployees > 0 ? Math.round(totalSalary / totalEmployees) : 0,
        byDepartment,
      }
    });
  } catch (err) {
    console.error('Get payroll report error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Generate employee summary report
router.get('/employees', authJwt, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { department, status } = req.query;
    const db = getDb();

    let employees = [];

    if (db) {
      const snap = await db.collection('Users').get();
      snap.forEach(doc => employees.push({ id: doc.id, ...doc.data() }));
    } else {
      employees = mockEmployees;
    }

    // Filter by department
    if (department) {
      employees = employees.filter(e => e.department === department);
    }

    // Filter by status
    if (status) {
      employees = employees.filter(e => e.status === status);
    }

    // Calculate statistics
    const totalEmployees = employees.length;
    const active = employees.filter(e => e.status === 'active').length;
    const inactive = employees.filter(e => e.status === 'inactive').length;

    // By department
    const byDepartment = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      if (!byDepartment[dept]) {
        byDepartment[dept] = 0;
      }
      byDepartment[dept]++;
    });

    // By designation (if available)
    const byDesignation = {};
    employees.forEach(emp => {
      const desig = emp.designation || 'Unassigned';
      if (!byDesignation[desig]) {
        byDesignation[desig] = 0;
      }
      byDesignation[desig]++;
    });

    return res.json({
      report: {
        totalEmployees,
        active,
        inactive,
        byDepartment,
        byDesignation,
        employees: employees.map(e => ({
          id: e.id,
          name: e.name,
          email: e.email,
          department: e.department,
          designation: e.designation,
          status: e.status,
          joiningDate: e.joiningDate,
        })),
      }
    });
  } catch (err) {
    console.error('Get employee report error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
