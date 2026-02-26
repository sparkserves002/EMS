import React, { useState, useEffect } from 'react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'travel',
    amount: '',
    description: '',
    date: ''
  });
  const [filter, setFilter] = useState('all');
  const isAdmin = localStorage.getItem('userRole') === 'admin';

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = isAdmin ? '/api/expenses/all' : '/api/expenses/my-expenses';
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setExpenses(data.expenses || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newExpense)
      });
      const data = await response.json();
      if (data.success) {
        setExpenses([data.expense, ...expenses]);
        setShowForm(false);
        setNewExpense({
          category: 'travel',
          amount: '',
          description: '',
          date: ''
        });
      }
    } catch (err) {
      console.error('Error creating expense:', err);
    }
  };

  const handleReview = async (id, status) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/expenses/${id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      setExpenses(expenses.map(e => 
        e.id === id ? { ...e, status } : e
      ));
    } catch (err) {
      console.error('Error reviewing expense:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'travel': return '#3498db';
      case 'food': return '#e74c3c';
      case 'supplies': return '#27ae60';
      case 'equipment': return '#9b59b6';
      case 'communication': return '#f39c12';
      case 'training': return '#1abc9c';
      default: return '#95a5a6';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#27ae60';
      case 'rejected': return '#e74c3c';
      default: return '#f39c12';
    }
  };

  const filteredExpenses = filter === 'all' 
    ? expenses 
    : expenses.filter(e => e.status === filter);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p>Loading expenses...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>💰 Expense Management</h2>
        {!isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '10px 20px',
              background: showForm ? '#6c757d' : '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer'
            }}
          >
            {showForm ? 'Cancel' : '+ New Claim'}
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
          <h3 style={{ marginTop: 0 }}>Submit Expense Claim</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Category *</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                >
                  <option value="travel">Travel</option>
                  <option value="food">Food</option>
                  <option value="supplies">Supplies</option>
                  <option value="equipment">Equipment</option>
                  <option value="communication">Communication</option>
                  <option value="training">Training</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Amount (₹) *</label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Date *</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  required
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                />
              </div>
            </div>
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Description *</label>
              <textarea
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                required
                rows={3}
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
              Submit Claim
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {['all', 'pending', 'approved', 'rejected'].map(status => (
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
            {status} ({status === 'all' ? expenses.length : expenses.filter(e => e.status === status).length})
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {filteredExpenses.map((expense) => (
          <div
            key={expense.id}
            style={{
              background: 'white',
              padding: 20,
              borderRadius: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span
                    style={{
                      padding: '3px 12px',
                      borderRadius: 3,
                      fontSize: 12,
                      background: getCategoryColor(expense.category),
                      color: 'white',
                      textTransform: 'capitalize'
                    }}
                  >
                    {expense.category}
                  </span>
                  <span
                    style={{
                      padding: '3px 12px',
                      borderRadius: 3,
                      fontSize: 12,
                      background: getStatusColor(expense.status),
                      color: 'white',
                      textTransform: 'capitalize'
                    }}
                  >
                    {expense.status}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>₹{parseFloat(expense.amount).toLocaleString()}</h3>
                <p style={{ margin: '0 0 10px 0', color: '#555' }}>{expense.description}</p>
                <div style={{ fontSize: 13, color: '#7f8c8d' }}>
                  <span>📅 {formatDate(expense.date)}</span>
                  {!isAdmin && <span style={{ margin: '0 10px' }}>•</span>}
                  {!isAdmin && <span>By {expense.userName}</span>}
                  {isAdmin && expense.reviewedByName && (
                    <>
                      <span style={{ margin: '0 10px' }}>•</span>
                      <span>Reviewed by {expense.reviewedByName}</span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {isAdmin && expense.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleReview(expense.id, 'approved')}
                      style={{
                        padding: '8px 16px',
                        background: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: 5,
                        cursor: 'pointer'
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(expense.id, 'rejected')}
                      style={{
                        padding: '8px 16px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: 5,
                        cursor: 'pointer'
                      }}
                    >
                      Reject
                    </button>
                  </>
                )}
                {!isAdmin && expense.status === 'pending' && (
                  <button
                    onClick={() => handleDelete(expense.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: 5,
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredExpenses.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#7f8c8d' }}>
          <p>No expenses found</p>
        </div>
      )}
    </div>
  );
}
