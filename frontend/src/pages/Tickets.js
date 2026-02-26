import React, { useState, useEffect } from 'react';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ category: 'technical', subject: '', message: '', priority: 'medium' });
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('my-tickets');

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
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/api/tickets/my-tickets');
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error loading tickets:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await apiCall('/api/tickets', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setMessage('Ticket submitted successfully!');
      setShowForm(false);
      setFormData({ category: 'technical', subject: '', message: '', priority: 'medium' });
      loadTickets();
    } catch (err) {
      setMessage(err.message || 'Failed to submit ticket');
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
      case 'open': return '#007bff';
      case 'answered': return '#ffc107';
      case 'closed': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getCategoryLabel = (category) => {
    const labels = { salary: '💰 Salary', technical: '🔧 Technical', hr: '👥 HR', other: '📝 Other' };
    return labels[category] || category;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const categories = [
    { key: 'salary', label: '💰 Salary' },
    { key: 'technical', label: '🔧 Technical' },
    { key: 'hr', label: '👥 HR' },
    { key: 'other', label: '📝 Other' },
  ];

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Support Tickets</h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button style={activeTab === 'my-tickets' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('my-tickets')}>
          My Tickets
        </button>
        <button style={activeTab === 'create' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('create')}>
          Create New Ticket
        </button>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {activeTab === 'my-tickets' && (
        <div style={styles.card}>
          <h3>My Support Tickets</h3>
          {loading ? (
            <p>Loading...</p>
          ) : tickets.length > 0 ? (
            <div style={styles.ticketList}>
              {tickets.map((ticket) => (
                <div key={ticket.id} style={styles.ticketItem}>
                  <div style={styles.ticketHeader}>
                    <div>
                      <span style={styles.category}>{getCategoryLabel(ticket.category)}</span>
                      <span style={{ ...styles.status, background: getStatusColor(ticket.status) }}>
                        {ticket.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={styles.ticketDate}>{formatDate(ticket.createdAt)}</div>
                  </div>
                  <h4 style={styles.ticketSubject}>{ticket.subject}</h4>
                  <p style={styles.ticketMessage}>{ticket.message}</p>
                  {ticket.adminReply && (
                    <div style={styles.adminReply}>
                      <strong>Admin Reply:</strong> {ticket.adminReply}
                      <div style={styles.replyDate}>{formatDate(ticket.repliedAt)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: 40, color: '#666' }}>No tickets found. Create a new ticket to get support.</p>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div style={styles.card}>
          <h3>Create New Ticket</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select
                style={styles.select}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Priority</label>
              <select
                style={styles.select}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Subject</label>
              <input
                type="text"
                style={styles.input}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter subject"
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Message</label>
              <textarea
                style={styles.textarea}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your issue"
                rows={5}
                required
              />
            </div>
            <button type="submit" style={styles.submitBtn}>Submit Ticket</button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  logoutBtn: { padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  tabContainer: { display: 'flex', gap: 10, marginBottom: 20, borderBottom: '2px solid #eee' },
  tab: { padding: '12px 24px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: '#666' },
  activeTab: { padding: '12px 24px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: '#007bff', borderBottom: '2px solid #007bff', marginBottom: -2 },
  message: { padding: 12, background: '#d4edda', color: '#155724', borderRadius: 4, marginBottom: 20 },
  card: { background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  ticketList: { display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 },
  ticketItem: { padding: 20, border: '1px solid #eee', borderRadius: 8, background: '#f9f9f9' },
  ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  category: { marginRight: 8, fontSize: 14 },
  status: { padding: '4px 8px', borderRadius: 4, color: 'white', fontSize: 12, fontWeight: 'bold' },
  ticketDate: { fontSize: 12, color: '#999' },
  ticketSubject: { margin: '0 0 8px 0', color: '#333' },
  ticketMessage: { margin: 0, color: '#666', fontSize: 14 },
  adminReply: { marginTop: 16, padding: 12, background: '#e7f3ff', borderRadius: 4, fontSize: 14 },
  replyDate: { fontSize: 12, color: '#999', marginTop: 4 },
  form: { maxWidth: 500 },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', marginBottom: 6, fontWeight: 'bold', color: '#333' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  select: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  submitBtn: { padding: '12px 24px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 },
};
