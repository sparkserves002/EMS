import React, { useState, useEffect } from 'react';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium',
    expiresAt: ''
  });
  const systemType = localStorage.getItem('systemType');
  const isAdmin = localStorage.getItem('userRole') === 'admin';

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/announcements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAnnouncement)
      });
      const data = await response.json();
      if (data.success) {
        setAnnouncements([data.announcement, ...announcements]);
        setShowForm(false);
        setNewAnnouncement({
          title: '',
          content: '',
          category: 'general',
          priority: 'medium',
          expiresAt: ''
        });
      }
    } catch (err) {
      console.error('Error creating announcement:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'urgent': return '#e74c3c';
      case 'holiday': return '#9b59b6';
      case 'policy': return '#3498db';
      case 'event': return '#1abc9c';
      default: return '#95a5a6';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p>Loading announcements...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>📢 Announcements</h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '10px 20px',
              background: showForm ? '#6c757d' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer'
            }}
          >
            {showForm ? 'Cancel' : '+ New Announcement'}
          </button>
        )}
      </div>

      {showForm && (
        <div style={{
          background: 'white',
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>Create New Announcement</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Title *</label>
              <input
                type="text"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                required
                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
              />
            </div>
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Content *</label>
              <textarea
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                required
                rows={4}
                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Category</label>
                <select
                  value={newAnnouncement.category}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, category: e.target.value })}
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                >
                  <option value="general">General</option>
                  <option value="holiday">Holiday</option>
                  <option value="policy">Policy</option>
                  <option value="event">Event</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Priority</label>
                <select
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Expires At (Optional)</label>
              <input
                type="date"
                value={newAnnouncement.expiresAt}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, expiresAt: e.target.value })}
                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '10px 30px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: 5,
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              Publish Announcement
            </button>
          </form>
        </div>
      )}

      {announcements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#7f8c8d' }}>
          <p>No announcements yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              style={{
                background: 'white',
                padding: 20,
                borderRadius: 8,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${getPriorityColor(announcement.priority)}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 3,
                        fontSize: 12,
                        background: getCategoryColor(announcement.category),
                        color: 'white',
                        textTransform: 'capitalize'
                      }}
                    >
                      {announcement.category}
                    </span>
                    {announcement.priority === 'high' && (
                      <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: 12 }}>⚠ High Priority</span>
                    )}
                  </div>
                  <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{announcement.title}</h3>
                  <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>{announcement.content}</p>
                  <div style={{ marginTop: 15, fontSize: 13, color: '#7f8c8d' }}>
                    <span>Posted by {announcement.createdByName}</span>
                    <span style={{ margin: '0 10px' }}>•</span>
                    <span>{formatDate(announcement.createdAt)}</span>
                    {announcement.expiresAt && (
                      <>
                        <span style={{ margin: '0 10px' }}>•</span>
                        <span>Expires: {formatDate(announcement.expiresAt)}</span>
                      </>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    style={{
                      padding: '5px 10px',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: 3,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
