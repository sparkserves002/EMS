import React, { useState, useEffect } from 'react';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newDocument, setNewDocument] = useState({
    type: 'other',
    name: '',
    fileName: '',
    fileUrl: '',
    fileSize: 0
  });
  const [filter, setFilter] = useState('all');
  const isAdmin = localStorage.getItem('userRole') === 'admin';

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = isAdmin ? '/api/documents/all' : '/api/documents/my-documents';
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newDocument)
      });
      const data = await response.json();
      if (data.success) {
        setDocuments([data.document, ...documents]);
        setShowForm(false);
        setNewDocument({
          type: 'other',
          name: '',
          fileName: '',
          fileUrl: '',
          fileSize: 0
        });
      }
    } catch (err) {
      console.error('Error uploading document:', err);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/documents/${id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      setDocuments(documents.map(d => 
        d.id === id ? { ...d, status } : d
      ));
    } catch (err) {
      console.error('Error verifying document:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDocuments(documents.filter(d => d.id !== id));
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      offer_letter: 'Offer Letter',
      aadhar: 'Aadhar Card',
      pan: 'PAN Card',
      photo: 'Profile Photo',
      resume: 'Resume/CV',
      experience: 'Experience Letter',
      education: 'Education Certificates',
      other: 'Other'
    };
    return types[type] || type;
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'offer_letter': return '#3498db';
      case 'aadhar': return '#9b59b6';
      case 'pan': return '#e74c3c';
      case 'photo': return '#27ae60';
      case 'resume': return '#f39c12';
      case 'experience': return '#1abc9c';
      case 'education': return '#34495e';
      default: return '#95a5a6';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return '#27ae60';
      case 'rejected': return '#e74c3c';
      default: return '#f39c12';
    }
  };

  const filteredDocuments = filter === 'all' 
    ? documents 
    : documents.filter(d => d.status === filter);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p>Loading documents...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>📁 Document Management</h2>
        {!isAdmin && (
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
            {showForm ? 'Cancel' : '+ Upload Document'}
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
          <h3 style={{ marginTop: 0 }}>Upload Document</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Document Type *</label>
                <select
                  value={newDocument.type}
                  onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                >
                  <option value="offer_letter">Offer Letter</option>
                  <option value="aadhar">Aadhar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="photo">Profile Photo</option>
                  <option value="resume">Resume/CV</option>
                  <option value="experience">Experience Letter</option>
                  <option value="education">Education Certificates</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Document Name *</label>
                <input
                  type="text"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                  required
                  placeholder="Enter document name"
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>File Name *</label>
                <input
                  type="text"
                  value={newDocument.fileName}
                  onChange={(e) => setNewDocument({ ...newDocument, fileName: e.target.value })}
                  required
                  placeholder="e.g., document.pdf"
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>File URL *</label>
                <input
                  type="text"
                  value={newDocument.fileUrl}
                  onChange={(e) => setNewDocument({ ...newDocument, fileUrl: e.target.value })}
                  required
                  placeholder="/uploads/filename.pdf"
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                />
              </div>
            </div>
            <button
              type="submit"
              style={{
                padding: '10px 30px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: 5,
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              Upload Document
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {['all', 'pending', 'verified', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '8px 16px',
              background: filter === status ? '#3498db' : '#f8f9fa',
              color: filter === status ? 'white' : '#555',
              border: '1px solid #ddd',
              borderRadius: 20,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {status} ({status === 'all' ? documents.length : documents.filter(d => d.status === status).length})
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 15 }}>
        {filteredDocuments.map((doc) => (
          <div
            key={doc.id}
            style={{
              background: 'white',
              padding: 20,
              borderRadius: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span
                style={{
                  padding: '3px 12px',
                  borderRadius: 3,
                  fontSize: 12,
                  background: getTypeColor(doc.type),
                  color: 'white'
                }}
              >
                {getTypeLabel(doc.type)}
              </span>
              <span
                style={{
                  padding: '3px 12px',
                  borderRadius: 3,
                  fontSize: 12,
                  background: getStatusColor(doc.status),
                  color: 'white',
                  textTransform: 'capitalize'
                }}
              >
                {doc.status}
              </span>
            </div>
            
            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{doc.name}</h3>
            <p style={{ margin: '0 0 5px 0', color: '#7f8c8d', fontSize: 13 }}>
              📄 {doc.fileName} • {formatFileSize(doc.fileSize)}
            </p>
            <p style={{ margin: '0 0 10px 0', color: '#7f8c8d', fontSize: 13 }}>
              📅 Uploaded: {formatDate(doc.uploadedAt)}
            </p>
            
            {doc.status !== 'pending' && doc.verifiedByName && (
              <p style={{ margin: '0 0 10px 0', color: '#27ae60', fontSize: 13 }}>
                ✓ Verified by {doc.verifiedByName}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              {isAdmin && doc.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleVerify(doc.id, 'verified')}
                    style={{
                      padding: '8px 16px',
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: 5,
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => handleVerify(doc.id, 'rejected')}
                    style={{
                      padding: '8px 16px',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: 5,
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    Reject
                  </button>
                </>
              )}
              {!isAdmin && doc.status === 'pending' && (
                <button
                  onClick={() => handleDelete(doc.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: 5,
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#7f8c8d' }}>
          <p>No documents found</p>
        </div>
      )}
    </div>
  );
}
