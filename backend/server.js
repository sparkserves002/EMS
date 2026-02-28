require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const { initializeMongoDbAdapter } = require('./dbProvider');
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const employeesRoutes = require('./routes/employees');
const leavesRoutes = require('./routes/leaves');
const ticketsRoutes = require('./routes/tickets');
const payrollRoutes = require('./routes/payroll');
const messagesRoutes = require('./routes/messages');
const aiRoutes = require('./routes/ai');
const announcementsRoutes = require('./routes/announcements');
const holidaysRoutes = require('./routes/holidays');
const reportsRoutes = require('./routes/reports');
const notificationsRoutes = require('./routes/notifications');
const expensesRoutes = require('./routes/expenses');
const documentsRoutes = require('./routes/documents');
const performanceRoutes = require('./routes/performance');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/public')));

app.get('/', (req, res) => res.json({ status: 'EMS Backend running' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/holidays', holidaysRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/performance', performanceRoutes);

// Handle React Router - serve index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    if (process.env.DB === 'mongodb') {
      await connectDB();
      initializeMongoDbAdapter();
    }

    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();


