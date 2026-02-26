import React, { useState, useEffect } from 'react';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

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
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/api/employees/profile/me');
      setProfile(data.profile);
      setFormData(data.profile);
    } catch (err) {
      console.error('Error loading profile:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await apiCall('/api/employees/profile/me', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setMessage('Profile updated successfully!');
      setEditing(false);
      loadProfile();
    } catch (err) {
      setMessage(err.message || 'Failed to update profile');
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading profile...</div>;
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>My Profile</h2>
        <div>
          {!editing && (
            <button onClick={() => setEditing(true)} style={styles.editBtn}>✏️ Edit Profile</button>
          )}
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.card}>
        {editing ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  style={styles.input}
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Address</label>
              <textarea
                style={styles.textarea}
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
              />
            </div>

            <div style={styles.formActions}>
              <button type="button" onClick={() => { setEditing(false); setFormData(profile); }} style={styles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" style={styles.saveBtn}>Save Changes</button>
            </div>
          </form>
        ) : (
          <div>
            <div style={styles.profileHeader}>
              <div style={styles.avatar}>
                {profile?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{profile?.name || 'User'}</h3>
                <p style={{ margin: '4px 0', color: '#666' }}>{profile?.designation || 'Employee'}</p>
                <span style={styles.badge}>{profile?.role === 'admin' ? 'Admin' : 'Employee'}</span>
              </div>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Email</span>
                <span style={styles.infoValue}>{profile?.email || '-'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Phone</span>
                <span style={styles.infoValue}>{profile?.phone || '-'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Employee ID</span>
                <span style={styles.infoValue}>{profile?.employeeId || '-'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Department</span>
                <span style={styles.infoValue}>{profile?.department || '-'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Designation</span>
                <span style={styles.infoValue}>{profile?.designation || '-'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Date of Joining</span>
                <span style={styles.infoValue}>{formatDate(profile?.joiningDate)}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Status</span>
                <span style={{ ...styles.infoValue, color: profile?.status === 'active' ? '#28a745' : '#dc3545' }}>
                  {profile?.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ ...styles.infoItem, gridColumn: '1 / -1' }}>
                <span style={styles.infoLabel}>Address</span>
                <span style={styles.infoValue}>{profile?.address || '-'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  logoutBtn: { marginLeft: 10, padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  editBtn: { padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  message: { padding: 12, background: '#d4edda', color: '#155724', borderRadius: 4, marginBottom: 20 },
  card: { background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  profileHeader: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30, paddingBottom: 20, borderBottom: '2px solid #eee' },
  avatar: { width: 80, height: 80, borderRadius: '50%', background: '#007bff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold' },
  badge: { display: 'inline-block', padding: '4px 12px', background: '#28a745', color: 'white', borderRadius: 12, fontSize: 12, fontWeight: 'bold' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  infoItem: { padding: 12, background: '#f9f9f9', borderRadius: 8 },
  infoLabel: { display: 'block', fontSize: 12, color: '#999', marginBottom: 4 },
  infoValue: { fontSize: 16, color: '#333', fontWeight: 500 },
  form: { maxWidth: '100%' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', marginBottom: 6, fontWeight: 'bold', color: '#333' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  formActions: { display: 'flex', gap: 12, marginTop: 20 },
  cancelBtn: { padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  saveBtn: { padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
};
