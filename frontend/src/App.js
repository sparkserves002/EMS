import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployerLogin from './pages/EmployerLogin';
import Dashboard from './pages/Dashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import Tickets from './pages/Tickets';
import Payroll from './pages/Payroll';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import AIAssistant from './pages/AIAssistant';
import Announcements from './pages/Announcements';
import Holidays from './pages/Holidays';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Expenses from './pages/Expenses';
import Documents from './pages/Documents';
import Performance from './pages/Performance';
import Sidebar from './components/Sidebar';

// Protected Route Component
function ProtectedRoute({ children, requiredSystem }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [systemType, setSystemType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const system = localStorage.getItem('systemType');
    setIsAuthenticated(!!token);
    setSystemType(system);
    setLoading(false);
  }, []);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    if (requiredSystem === 'employee') {
      return <Navigate to="/employee-login" replace />;
    } else if (requiredSystem === 'employer') {
      return <Navigate to="/employer-login" replace />;
    }
    return <Navigate to="/employee-login" replace />;
  }

  if (requiredSystem && systemType !== requiredSystem) {
    if (systemType === 'employee') {
      return <Navigate to="/employee/dashboard" replace />;
    } else if (systemType === 'employer') {
      return <Navigate to="/employer/dashboard" replace />;
    }
  }

  return children;
}

// Responsive hook for mobile detection
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Employee Layout Component with Sidebar
function EmployeeLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      const { signOut } = await import('./firebase');
      const { auth } = await import('./firebase');
      await signOut(auth);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('systemType');
      window.location.href = '/employee-login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Mobile-responsive styles
  const contentStyle = isMobile 
    ? { 
        flex: 1, 
        marginLeft: 0, 
        padding: 0, 
        width: '100%',
        paddingTop: 70,
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 20,
      }
    : { 
        flex: 1, 
        marginLeft: 260, 
        padding: 0, 
        width: 'calc(100% - 260px)' 
      };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      <Sidebar system="employee" onLogout={handleLogout} isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
}

// Employer Layout Component with Sidebar
function EmployerLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      const { signOut } = await import('./firebase');
      const { auth } = await import('./firebase');
      await signOut(auth);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('systemType');
      window.location.href = '/employer-login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Mobile-responsive styles
  const contentStyle = isMobile 
    ? { 
        flex: 1, 
        marginLeft: 0, 
        padding: 0, 
        width: '100%',
        paddingTop: 70,
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 20,
      }
    : { 
        flex: 1, 
        marginLeft: 260, 
        padding: 0, 
        width: 'calc(100% - 260px)' 
      };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      <Sidebar system="employer" onLogout={handleLogout} isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Login Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/employee-login" element={<EmployeeLogin />} />
      <Route path="/employer-login" element={<EmployerLogin />} />
      
      {/* Employee System Routes */}
      <Route path="/employee/dashboard" element={
        <ProtectedRoute requiredSystem="employee">
          <EmployeeLayout>
            <Dashboard />
          </EmployeeLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/employee/attendance" element={
        <ProtectedRoute requiredSystem="employee">
          <EmployeeLayout>
            <Attendance />
          </EmployeeLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/employee/leaves" element={
        <ProtectedRoute requiredSystem="employee">
          <EmployeeLayout>
            <LeaveManagement />
          </EmployeeLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/employee/tickets" element={
        <ProtectedRoute requiredSystem="employee">
          <EmployeeLayout>
            <Tickets />
          </EmployeeLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/employee/payroll" element={
        <ProtectedRoute requiredSystem="employee">
          <EmployeeLayout>
            <Payroll />
          </EmployeeLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/employee/messages" element={
        <ProtectedRoute requiredSystem="employee">
          <EmployeeLayout>
            <Messages />
          </EmployeeLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/employee/profile" element={
        <ProtectedRoute requiredSystem="employee">
          <EmployeeLayout>
            <Profile />
          </EmployeeLayout>
        </ProtectedRoute>
      } />

      <Route path="/employee/announcements" element={
        <ProtectedRoute requiredSystem="employee">
          <EmployeeLayout>
            <Announcements />
          </EmployeeLayout>
        </ProtectedRoute>
      } />

      <Route path="/employee/holidays" element={
        <ProtectedRoute requiredSystem="employee">
          <EmployeeLayout>
            <Holidays />
          </EmployeeLayout>
        </ProtectedRoute>
      } />

      <Route path="/employee/notifications" element={
        <ProtectedRoute requiredSystem="employee">
          <EmployeeLayout>
            <Notifications />
          </EmployeeLayout>
        </ProtectedRoute>
      } />

      <Route path="/employee/expenses" element={
        <ProtectedRoute requiredSystem="employee">
          <EmployeeLayout>
            <Expenses />
          </EmployeeLayout>
        </ProtectedRoute>
      } />

      <Route path="/employee/documents" element={
        <ProtectedRoute requiredSystem="employee">
          <EmployeeLayout>
            <Documents />
          </EmployeeLayout>
        </ProtectedRoute>
      } />

      <Route path="/employee/performance" element={
        <ProtectedRoute requiredSystem="employee">
          <EmployeeLayout>
            <Performance />
          </EmployeeLayout>
        </ProtectedRoute>
      } />

      {/* Employer System Routes */}
      <Route path="/employer/dashboard" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <EmployerDashboard />
          </EmployerLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/employer/attendance" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <Attendance />
          </EmployerLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/employer/leaves" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <LeaveManagement />
          </EmployerLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/employer/tickets" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <Tickets />
          </EmployerLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/employer/payroll" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <Payroll />
          </EmployerLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/employer/messages" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <Messages />
          </EmployerLayout>
        </ProtectedRoute>
      } />

      <Route path="/employer/ai-assistant" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <AIAssistant />
          </EmployerLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/employer/profile" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <Profile />
          </EmployerLayout>
        </ProtectedRoute>
      } />

      <Route path="/employer/announcements" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <Announcements />
          </EmployerLayout>
        </ProtectedRoute>
      } />

      <Route path="/employer/holidays" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <Holidays />
          </EmployerLayout>
        </ProtectedRoute>
      } />

      <Route path="/employer/notifications" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <Notifications />
          </EmployerLayout>
        </ProtectedRoute>
      } />

      <Route path="/employer/expenses" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <Expenses />
          </EmployerLayout>
        </ProtectedRoute>
      } />

      <Route path="/employer/documents" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <Documents />
          </EmployerLayout>
        </ProtectedRoute>
      } />

      <Route path="/employer/performance" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <Performance />
          </EmployerLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/employer/employees" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <div style={{ padding: 20 }}><h2>Employee Management</h2><p>Manage all employees here</p></div>
          </EmployerLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/employer/reports" element={
        <ProtectedRoute requiredSystem="employer">
          <EmployerLayout>
            <Reports />
          </EmployerLayout>
        </ProtectedRoute>
      } />

      {/* Legacy Routes - Redirect to appropriate system */}
      <Route path="/dashboard" element={<Navigate to="/employee/dashboard" replace />} />
      <Route path="/attendance" element={<Navigate to="/employee/attendance" replace />} />
      <Route path="/leaves" element={<Navigate to="/employee/leaves" replace />} />
      <Route path="/tickets" element={<Navigate to="/employee/tickets" replace />} />
      <Route path="/payroll" element={<Navigate to="/employee/payroll" replace />} />
      <Route path="/messages" element={<Navigate to="/employee/messages" replace />} />
      <Route path="/profile" element={<Navigate to="/employee/profile" replace />} />
      
      {/* Admin Routes - Redirect to employer */}
      <Route path="/admin/*" element={<Navigate to="/employer/dashboard" replace />} />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/employee-login" replace />} />
    </Routes>
  );
}
