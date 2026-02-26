import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ leaveBalance: 0, tickets: 0, messages: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('authToken') || 'mock-token';
  const userEmail = localStorage.getItem('userEmail') || 'employee@test.com';

  const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load employee profile
      const profileRes = await apiCall('/api/employees/profile/me');
      setUserData(profileRes.profile);

      // Load stats
      const [leavesRes, ticketsRes] = await Promise.all([
        apiCall('/api/leaves/my'),
        apiCall('/api/tickets/my'),
      ]);

      setStats({
        leaveBalance: 12, // Default leave balance
        tickets: ticketsRes.tickets?.length || 0,
        messages: 0,
      });
    } catch (err) {
      console.error('Error loading dashboard:', err);
      // Set default user data for demo
      setUserData({
        name: 'John Doe',
        email: userEmail,
        department: 'Engineering',
        designation: 'Software Developer',
      });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      const { signOut } = await import('../firebase');
      const { auth } = await import('../firebase');
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

  const quickActions = [
    { path: '/employee/attendance', label: 'Check In/Out', icon: '📅' },
    { path: '/employee/leaves', label: 'Apply Leave', icon: '🏖️' },
    { path: '/employee/tickets', label: 'Raise Ticket', icon: '🎫' },
    { path: '/employee/payroll', label: 'View Payroll', icon: '💰' },
    { path: '/employee/messages', label: 'Messages', icon: '💬' },
    { path: '/employee/profile', label: 'My Profile', icon: '👤' },
  ];

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2>Employee Dashboard</h2>
          <p style={{ color: '#666', margin: 0 }}>
            Welcome back, {loading ? '...' : userData?.name || 'Employee'}!
          </p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* User Info Card */}
      {!loading && userData && (
        <div style={styles.userCard}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>👤</div>
            <div>
              <h3 style={styles.userName}>{userData.name}</h3>
              <p style={styles.userDept}>{userData.designation} - {userData.department}</p>
              <p style={styles.userEmail}>{userData.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🏖️</div>
          <div>
            <div style={styles.statValue}>{stats.leaveBalance}</div>
            <div style={styles.statTitle}>Leave Balance</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎫</div>
          <div>
            <div style={styles.statValue}>{stats.tickets}</div>
            <div style={styles.statTitle}>Open Tickets</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💬</div>
          <div>
            <div style={styles.statValue}>{stats.messages}</div>
            <div style={styles.statTitle}>Unread Messages</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.section}>
        <h3>Quick Actions</h3>
        <div style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <div 
              key={index} 
              style={styles.actionCard} 
              onClick={() => navigate(action.path)}
            >
              <span style={styles.actionIcon}>{action.icon}</span>
              <span style={styles.actionLabel}>{action.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div style={styles.section}>
        <h3>Recent Activity</h3>
        <div style={styles.activityCard}>
          <p style={{ color: '#666', textAlign: 'center', padding: 20 }}>
            No recent activity. Start by marking your attendance or applying for leave.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  logoutBtn: { padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  userCard: { background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: 24, marginBottom: 24 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 20 },
  avatar: { width: 60, height: 60, borderRadius: '50%', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 },
  userName: { margin: 0, color: '#333' },
  userDept: { margin: '4px 0', color: '#666', fontSize: 14 },
  userEmail: { margin: 0, color: '#999', fontSize: 12 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 },
  statCard: { display: 'flex', alignItems: 'center', gap: 16, padding: 24, background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  statIcon: { fontSize: 32 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  statTitle: { fontSize: 14, color: '#666', margin: 0 },
  section: { marginBottom: 30 },
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginTop: 16 },
  actionCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 24, background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s' },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: 14, color: '#333', fontWeight: '500' },
  activityCard: { background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: 8 },
};
