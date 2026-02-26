import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ type: 'casual', startDate: '', endDate: '', reason: '' });
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('my-leaves');
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
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leavesRes, balanceRes] = await Promise.all([
        apiCall('/api/leaves/my-leaves'),
        apiCall('/api/leaves/balance'),
      ]);
      setLeaves(leavesRes.leaves || []);
      setBalance(balanceRes.balance || {});
    } catch (err) {
      console.error('Error loading leaves:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    // Constraint: Parse dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for comparison
    
    // Constraint: Validate dates are not in the past
    if (startDate < today) {
      setMessage('Error: Start date cannot be in the past');
      return;
    }
    if (endDate < today) {
      setMessage('Error: End date cannot be in the past');
      return;
    }
    
    // Constraint: End date must be after start date
    if (endDate < startDate) {
      setMessage('Error: End date must be after start date');
      return;
    }
    
    // Constraint: Maximum leave duration (max 30 days)
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    if (durationDays > 30) {
      setMessage('Error: Leave duration cannot exceed 30 days');
      return;
    }
    
    // Constraint: Advance notice requirement (at least 1 day in advance)
    const advanceNoticeDays = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    if (advanceNoticeDays < 1) {
      setMessage('Error: Leave must be applied at least 1 day in advance');
      return;
    }
    
    // Constraint: Minimum reason length (at least 10 characters)
    const trimmedReason = formData.reason.trim();
    if (trimmedReason.length < 10) {
      setMessage('Error: Reason must be at least 10 characters long');
      return;
    }
    
    try {
      await apiCall('/api/leaves', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setMessage('Leave application submitted successfully!');
      setShowForm(false);
      setFormData({ type: 'casual', startDate: '', endDate: '', reason: '' });
      loadData();
    } catch (err) {
      setMessage(err.message || 'Failed to submit leave');
    }
  };

  const handleCancel = async (leaveId) => {
    try {
      await apiCall(`/api/leaves/${leaveId}`, { method: 'DELETE' });
      setMessage('Leave cancelled successfully');
      loadData();
    } catch (err) {
      setMessage(err.message || 'Failed to cancel leave');
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const leaveTypes = [
    { key: 'casual', name: 'Casual Leave', color: '#007bff' },
    { key: 'sick', name: 'Sick Leave', color: '#dc3545' },
    { key: 'paid', name: 'Paid Leave', color: '#28a745' },
    { key: 'unpaid', name: 'Unpaid Leave', color: '#6c757d' },
  ];

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Leave Management</h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Leave Balance Cards */}
      <div style={styles.balanceGrid}>
        {leaveTypes.map((type) => (
          <div key={type.key} style={{ ...styles.balanceCard, borderLeft: `4px solid ${type.color}` }}>
            <div style={styles.balanceTitle}>{type.name}</div>
            <div style={styles.balanceValue}>{balance[type.key]?.remaining || 0}</div>
            <div style={styles.balanceLabel}>days remaining (of {balance[type.key]?.balance || 0})</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button style={activeTab === 'my-leaves' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('my-leaves')}>
          My Leaves
        </button>
        <button style={activeTab === 'apply' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('apply')}>
          Apply Leave
        </button>
      </div>

      {message && <div style={message.includes('Error') ? styles.errorMessage : styles.message}>{message}</div>}

      {activeTab === 'my-leaves' && (
        <div style={styles.card}>
          <h3>My Leave History</h3>
          {loading ? (
            <p>Loading...</p>
          ) : leaves.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Start Date</th>
                  <th style={styles.th}>End Date</th>
                  <th style={styles.th}>Reason</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id} style={styles.tr}>
                    <td style={styles.td}>{leaveTypes.find(t => t.key === leave.type)?.name || leave.type}</td>
                    <td style={styles.td}>{formatDate(leave.startDate)}</td>
                    <td style={styles.td}>{formatDate(leave.endDate)}</td>
                    <td style={styles.td}>{leave.reason || '-'}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: getStatusColor(leave.status) }}>
                        {leave.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {leave.status === 'pending' && (
                        <button onClick={() => handleCancel(leave.id)} style={styles.cancelBtn}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', padding: 40, color: '#666' }}>No leave records found.</p>
          )}
        </div>
      )}

      {activeTab === 'apply' && (
        <div style={styles.card}>
          <h3>Apply for Leave</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Leave Type</label>
              <select
                style={styles.select}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {leaveTypes.map((type) => (
                  <option key={type.key} value={type.key}>{type.name}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Start Date</label>
              <input
                type="date"
                style={styles.input}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>End Date</label>
              <input
                type="date"
                style={styles.input}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Reason (minimum 10 characters)</label>
              <textarea
                style={styles.textarea}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter reason for leave (minimum 10 characters)"
                rows={3}
              />
            </div>
            <button type="submit" style={styles.submitBtn}>Submit Application</button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  logoutBtn: { padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  balanceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
  balanceCard: { padding: 20, background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  balanceTitle: { fontSize: 14, color: '#666', marginBottom: 8 },
  balanceValue: { fontSize: 36, fontWeight: 'bold', color: '#333' },
  balanceLabel: { fontSize: 12, color: '#999' },
  tabContainer: { display: 'flex', gap: 10, marginBottom: 20, borderBottom: '2px solid #eee' },
  tab: { padding: '12px 24px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: '#666' },
  activeTab: { padding: '12px 24px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: '#007bff', borderBottom: '2px solid #007bff', marginBottom: -2 },
  message: { padding: 12, background: '#d4edda', color: '#155724', borderRadius: 4, marginBottom: 20 },
  errorMessage: { padding: 12, background: '#f8d7da', color: '#721c24', borderRadius: 4, marginBottom: 20 },
  card: { background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 16 },
  th: { textAlign: 'left', padding: '12px 8px', borderBottom: '2px solid #ddd', fontWeight: 'bold', color: '#333' },
  td: { padding: '12px 8px', borderBottom: '1px solid #eee' },
  tr: { borderBottom: '1px solid #eee' },
  badge: { padding: '4px 8px', borderRadius: 4, color: 'white', fontSize: 12, fontWeight: 'bold' },
  cancelBtn: { padding: '4px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  form: { maxWidth: 500 },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', marginBottom: 6, fontWeight: 'bold', color: '#333' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  select: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  submitBtn: { padding: '12px 24px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 },
};
