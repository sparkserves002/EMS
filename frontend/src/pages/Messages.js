import React, { useState, useEffect } from 'react';

export default function Messages() {
  const [messages, setMessages] = useState({ sent: [], received: [], broadcasts: [] });
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
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
    loadMessages();
    loadRecipients();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/api/messages');
      setMessages(data);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
    setLoading(false);
  };

  const loadRecipients = async () => {
    try {
      const data = await apiCall('/api/messages/recipients');
      setRecipients(data.employees || []);
    } catch (err) {
      console.error('Error loading recipients:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await apiCall('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: selectedConversation,
          message: newMessage,
        }),
      });
      setNewMessage('');
      setShowCompose(false);
      loadMessages();
      setMessage('Message sent successfully!');
    } catch (err) {
      setMessage(err.message || 'Failed to send message');
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
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const allMessages = [...messages.received, ...messages.broadcasts].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  const unreadCount = messages.received.filter(m => !m.isRead).length + messages.broadcasts.filter(m => !m.isRead).length;

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Messages {unreadCount > 0 && <span style={styles.unreadBadge}>{unreadCount}</span>}</h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.container}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <button onClick={() => setShowCompose(true)} style={styles.composeBtn}>
            ✉️ Compose
          </button>

          <div style={styles.tabs}>
            <button 
              style={activeTab === 'received' ? styles.activeTab : styles.tab} 
              onClick={() => setActiveTab('received')}
            >
              Inbox {unreadCount > 0 && <span style={styles.count}>{unreadCount}</span>}
            </button>
            <button 
              style={activeTab === 'sent' ? styles.activeTab : styles.tab} 
              onClick={() => setActiveTab('sent')}
            >
              Sent
            </button>
          </div>

          <div style={styles.messageList}>
            {loading ? (
              <p style={{ padding: 20, textAlign: 'center' }}>Loading...</p>
            ) : activeTab === 'received' ? (
              allMessages.length > 0 ? (
                allMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    style={msg.isRead ? styles.messageItem : styles.unreadMessageItem}
                    onClick={() => {
                      if (!msg.isRead) {
                        apiCall(`/api/messages/${msg.id}/read`, { method: 'PATCH' });
                        loadMessages();
                      }
                    }}
                  >
                    <div style={styles.msgHeader}>
                      <span style={styles.sender}>{msg.senderName}</span>
                      <span style={styles.date}>{formatDate(msg.createdAt)}</span>
                    </div>
                    <p style={styles.msgPreview}>{msg.message.substring(0, 50)}...</p>
                  </div>
                ))
              ) : (
                <p style={{ padding: 20, textAlign: 'center', color: '#999' }}>No messages</p>
              )
            ) : (
              messages.sent.length > 0 ? (
                messages.sent.map((msg, idx) => (
                  <div key={idx} style={styles.messageItem}>
                    <div style={styles.msgHeader}>
                      <span style={styles.sender}>To: {msg.receiverName}</span>
                      <span style={styles.date}>{formatDate(msg.createdAt)}</span>
                    </div>
                    <p style={styles.msgPreview}>{msg.message.substring(0, 50)}...</p>
                  </div>
                ))
              ) : (
                <p style={{ padding: 20, textAlign: 'center', color: '#999' }}>No sent messages</p>
              )
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.main}>
          {showCompose ? (
            <div style={styles.composeForm}>
              <h3>New Message</h3>
              <form onSubmit={handleSendMessage}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>To:</label>
                  <select
                    style={styles.select}
                    value={selectedConversation || ''}
                    onChange={(e) => setSelectedConversation(e.target.value)}
                    required
                  >
                    <option value="">Select recipient</option>
                    {recipients.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Message:</label>
                  <textarea
                    style={styles.textarea}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={6}
                    required
                  />
                </div>
                <div style={styles.formActions}>
                  <button type="button" onClick={() => setShowCompose(false)} style={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.sendBtn}>Send</button>
                </div>
              </form>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>💬</p>
              <h3>Select a message to read</h3>
              <p style={{ color: '#666' }}>Or compose a new message to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  logoutBtn: { padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  unreadBadge: { background: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  message: { padding: 12, background: '#d4edda', color: '#155724', borderRadius: 4, marginBottom: 20 },
  container: { display: 'flex', gap: 20, height: 'calc(100vh - 150px)' },
  sidebar: { width: 320, background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  composeBtn: { margin: 16, padding: 12, background: '#007bff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  tabs: { display: 'flex', borderBottom: '1px solid #eee' },
  tab: { flex: 1, padding: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', fontSize: 14 },
  activeTab: { flex: 1, padding: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: '#007bff', borderBottom: '2px solid #007bff', fontSize: 14 },
  count: { background: '#dc3545', color: 'white', padding: '2px 6px', borderRadius: 10, fontSize: 10, marginLeft: 4 },
  messageList: { flex: 1, overflowY: 'auto' },
  messageItem: { padding: 16, borderBottom: '1px solid #eee', cursor: 'pointer' },
  unreadMessageItem: { padding: 16, borderBottom: '1px solid #eee', cursor: 'pointer', background: '#f0f7ff' },
  msgHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  sender: { fontWeight: 'bold', color: '#333' },
  date: { fontSize: 12, color: '#999' },
  msgPreview: { margin: 0, color: '#666', fontSize: 13 },
  main: { flex: 1, background: 'white', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: 24 },
  composeForm: { height: '100%', display: 'flex', flexDirection: 'column' },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', marginBottom: 6, fontWeight: 'bold', color: '#333' },
  select: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  formActions: { display: 'flex', gap: 12, marginTop: 'auto' },
  cancelBtn: { padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  sendBtn: { padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  emptyState: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666' },
};
