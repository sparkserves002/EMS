import React, { useState, useEffect } from 'react';

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    date: '',
    day: '',
    category: 'national',
    isOptional: false,
    description: ''
  });
  const [year, setYear] = useState(new Date().getFullYear());
  const isAdmin = localStorage.getItem('userRole') === 'admin';

  useEffect(() => {
    fetchHolidays();
  }, [year]);

  const fetchHolidays = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/holidays?year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setHolidays(data.holidays || []);
    } catch (err) {
      console.error('Error fetching holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newHoliday)
      });
      const data = await response.json();
      if (data.success) {
        setHolidays([...holidays, data.holiday].sort((a, b) => new Date(a.date) - new Date(b.date)));
        setShowForm(false);
        setNewHoliday({
          name: '',
          date: '',
          day: '',
          category: 'national',
          isOptional: false,
          description: ''
        });
      }
    } catch (err) {
      console.error('Error creating holiday:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/holidays/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setHolidays(holidays.filter(h => h.id !== id));
    } catch (err) {
      console.error('Error deleting holiday:', err);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'national': return '#e74c3c';
      case 'festival': return '#9b59b6';
      case 'religious': return '#f39c12';
      case 'company': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const isUpcoming = (dateString) => {
    const today = new Date();
    const holidayDate = new Date(dateString);
    return holidayDate >= today;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p>Loading holidays...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>📅 Holiday Calendar</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{ padding: 8, borderRadius: 5, border: '1px solid #ddd' }}
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
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
              {showForm ? 'Cancel' : '+ Add Holiday'}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div style={{
          background: 'white',
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>Add New Holiday</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Holiday Name *</label>
                <input
                  type="text"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Date *</label>
                <input
                  type="date"
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  required
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Day *</label>
                <input
                  type="text"
                  value={newHoliday.day}
                  onChange={(e) => setNewHoliday({ ...newHoliday, day: e.target.value })}
                  required
                  placeholder="e.g., Friday"
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Category</label>
                <select
                  value={newHoliday.category}
                  onChange={(e) => setNewHoliday({ ...newHoliday, category: e.target.value })}
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                >
                  <option value="national">National</option>
                  <option value="festival">Festival</option>
                  <option value="religious">Religious</option>
                  <option value="company">Company</option>
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Description</label>
                <input
                  type="text"
                  value={newHoliday.description}
                  onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}>
              <input
                type="checkbox"
                checked={newHoliday.isOptional}
                onChange={(e) => setNewHoliday({ ...newHoliday, isOptional: e.target.checked })}
              />
              Optional Holiday
            </label>
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
              Add Holiday
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 15 }}>
        {holidays.map((holiday) => (
          <div
            key={holiday.id}
            style={{
              background: isUpcoming(holiday.date) ? 'white' : '#f8f9fa',
              padding: 20,
              borderRadius: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${getCategoryColor(holiday.category)}`,
              opacity: isUpcoming(holiday.date) ? 1 : 0.7
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 3,
                    fontSize: 11,
                    background: getCategoryColor(holiday.category),
                    color: 'white',
                    textTransform: 'uppercase'
                  }}
                >
                  {holiday.category}
                </span>
                {holiday.isOptional && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#f39c12' }}>Optional</span>
                )}
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(holiday.id)}
                  style={{
                    padding: '3px 8px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: 3,
                    cursor: 'pointer',
                    fontSize: 11
                  }}
                >
                  Delete
                </button>
              )}
            </div>
            <h3 style={{ margin: '10px 0', color: '#2c3e50' }}>{holiday.name}</h3>
            <p style={{ margin: '5px 0', color: '#555', fontSize: 14 }}>
              📅 {formatDate(holiday.date)} ({holiday.day})
            </p>
            {holiday.description && (
              <p style={{ margin: '5px 0', color: '#7f8c8d', fontSize: 13 }}>{holiday.description}</p>
            )}
          </div>
        ))}
      </div>

      {holidays.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#7f8c8d' }}>
          <p>No holidays found for {year}</p>
        </div>
      )}
    </div>
  );
}
