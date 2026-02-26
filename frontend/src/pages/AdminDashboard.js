import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ employees: 0, attendance: {}, leaves: {}, tickets: {} });
  const [loading, setLoading] = useState(true);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('authToken') || 'mock-token';

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
      const [empRes, attRes, leavesRes, ticketsRes] = await Promise.all([
        apiCall('/api/employees'),
        apiCall('/api/attendance/today'),
        apiCall('/api/leaves/all?status=pending'),
        apiCall('/api/tickets/stats'),
      ]);

      setStats({
        employees: empRes.employees?.length || 0,
        attendance: attRes,
        leaves: leavesRes.leaves || [],
        tickets: ticketsRes.stats || {},
      });
      setRecentLeaves(leavesRes.leaves?.slice(0, 5) || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
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
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statCards = [
    { title: 'Total Employees', value: stats.employees, icon: '👥', color: '#007bff' },
    { title: 'Checked In Today', value: stats.attendance.checkedIn ? '1' : '0', icon: '✓', color: '#28a745' },
    { title: 'Pending Leaves', value: stats.leaves.length || 0, icon: '🏖️', color: '#ffc107' },
    { title: 'Open Tickets', value: stats.tickets.open || 0, icon: '🎫', color: '#dc3545' },
  ];

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Stats Cards */}
           <div style={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <div key={index} style={{ ...styles.statCard, borderLeft: `4px solid ${stat.color}` }}>
            <div style={styles.statIcon}>{stat.icon}</div>
            <div>
              <div style={styles.statValue}>{loading ? '...' : stat.value}</div>
              <div style={styles.statTitle}>{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={styles.section}>
        <h3>Quick Actions</h3>
        <div style={styles.actionsGrid}>
          <div style={styles.actionCard} onClick={() => navigate('/admin/employees')}>
            <span style={styles.actionIcon}>👥</span>
            <span>Manage Employees</span>
          </div>
          <div style={styles.actionCard} onClick={() => navigate('/admin/leaves')}>
            <span style={styles.actionIcon}>🏖️</span>
            <span>Leave Approvals</span>
          </div>
          <div style={styles.actionCard} onClick={() => navigate('/admin/tickets')}>
            <span style={styles.actionIcon}>🎫</span>
            <span>Support Tickets</span>
          </div>
          <div style={styles.actionCard} onClick={() => navigate('/admin/payroll')}>
            <span style={styles.actionIcon}>💰</span>
            <span>Generate Payroll</span>
          </div>
          <div style={styles.actionCard} onClick={() => navigate('/admin/attendance')}>
            <span style={styles.actionIcon}>📊</span>
            <span>Attendance Records</span>
          </div>
          <div style={styles.actionCard} onClick={() => navigate('/admin/reports')}>
            <span style={styles.actionIcon}>📈</span>
            <span>Reports & Analytics</span>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div style={styles.section}>
        <h3>Pending Approvals</h3>
        {loading ? (
          <p>Loading...</p>
        ) : recentLeaves.length > 0 ? (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Dates</th>
                  <th style={styles.th}>Reason</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentLeaves.map((leave) => (
                  <tr key={leave.id} style={styles.tr}>
                    <td style={styles.td}>{leave.userId}</td>
                    <td style={styles.td}>{leave.type}</td>
                    <td style={styles.td}>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</td>
                    <td style={styles.td}>{leave.reason?.substring(0, 30) || '-'}...</td>
                    <td style={styles.td}>
                      <button 
                        onClick={() => navigate('/admin/leaves')}
                        style={styles.viewBtn}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#666' }}>No pending approvals</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  logoutBtn: { padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 30 },
  statCard: { display: 'flex', alignItems: 'center', gap: 16, padding: 24, background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  statIcon: { fontSize: 32 },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  statTitle: { fontSize: 14, color: '#666' },
  section: { marginBottom: 30 },
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 16 },
  actionCard: { display: 'flex', alignItems: 'center', gap: 12, padding: 20, background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s' },
  actionIcon: { fontSize: 24 },
  tableCard: { background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#333' },
  td: { padding: '14px 16px', borderBottom: '1px solid #eee' },
  tr: { borderBottom: '1px solid #eee' },
  viewBtn: { padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
};
