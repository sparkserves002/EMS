import React, { useState, useEffect } from 'react';

export default function Performance() {
  const [activeTab, setActiveTab] = useState('reviews');
  const [reviews, setReviews] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    dueDate: ''
  });
  const isAdmin = localStorage.getItem('userRole') === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      const [reviewsRes, goalsRes] = await Promise.all([
        fetch(isAdmin ? '/api/performance/all' : '/api/performance/my-reviews', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/performance/my-goals', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const reviewsData = await reviewsRes.json();
      const goalsData = await goalsRes.json();

      setReviews(reviewsData.reviews || []);
      setGoals(goalsData.goals || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/performance/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newGoal)
      });
      const data = await response.json();
      if (data.success) {
        setGoals([...goals, data.goal]);
        setShowGoalForm(false);
        setNewGoal({ title: '', description: '', dueDate: '' });
      }
    } catch (err) {
      console.error('Error creating goal:', err);
    }
  };

  const handleUpdateGoalProgress = async (goalId, progress, status) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/performance/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progress, status })
      });
      setGoals(goals.map(g => 
        g.id === goalId ? { ...g, progress, status } : g
      ));
    } catch (err) {
      console.error('Error updating goal:', err);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/performance/goals/${goalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return '#27ae60';
    if (rating >= 3) return '#f39c12';
    return '#e74c3c';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#27ae60';
      case 'in_progress': return '#3498db';
      case 'pending': return '#f39c12';
      default: return '#95a5a6';
    }
  };

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
        <p>Loading performance data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>⭐ Performance Reviews</h2>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('reviews')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'reviews' ? '#3498db' : 'transparent',
            color: activeTab === 'reviews' ? 'white' : '#555',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer'
          }}
        >
          📋 My Reviews
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'goals' ? '#3498db' : 'transparent',
            color: activeTab === 'goals' ? 'white' : '#555',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer'
          }}
        >
          🎯 My Goals
        </button>
      </div>

      {activeTab === 'reviews' && (
        <div>
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#7f8c8d' }}>
              <p>No performance reviews yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    background: 'white',
                    padding: 20,
                    borderRadius: 8,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span
                          style={{
                            padding: '3px 12px',
                            borderRadius: 3,
                            fontSize: 12,
                            background: '#3498db',
                            color: 'white'
                          }}
                        >
                          {review.reviewPeriod}
                        </span>
                        <span style={{ fontSize: 13, color: '#7f8c8d' }}>
                          Reviewed by {review.reviewerName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                        <span style={{ fontSize: 24, fontWeight: 'bold', color: getRatingColor(review.overallRating) }}>
                          {review.overallRating}/5
                        </span>
                        <div style={{ display: 'flex' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} style={{ color: star <= review.overallRating ? '#f39c12' : '#ddd', fontSize: 18 }}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', color: '#7f8c8d', fontSize: 13 }}>
                      {formatDate(review.reviewDate)}
                    </div>
                  </div>

                  {review.goals && review.goals.length > 0 && (
                    <div style={{ marginBottom: 15 }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Goals Assessment</h4>
                      {review.goals.map((goal, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                          <span>{goal.title}</span>
                          <span style={{ color: getStatusColor(goal.status), textTransform: 'capitalize' }}>
                            {goal.status} ({goal.rating}/5)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {review.strengths && (
                    <div style={{ marginBottom: 10 }}>
                      <strong style={{ color: '#27ae60' }}>Strengths:</strong>
                      <p style={{ margin: '5px 0', color: '#555' }}>{review.strengths}</p>
                    </div>
                  )}

                  {review.improvements && (
                    <div style={{ marginBottom: 10 }}>
                      <strong style={{ color: '#e74c3c' }}>Areas for Improvement:</strong>
                      <p style={{ margin: '5px 0', color: '#555' }}>{review.improvements}</p>
                    </div>
                  )}

                  {review.comments && (
                    <div>
                      <strong>Comments:</strong>
                      <p style={{ margin: '5px 0', color: '#555' }}>{review.comments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'goals' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>My Goals</h3>
            <button
              onClick={() => setShowGoalForm(!showGoalForm)}
              style={{
                padding: '10px 20px',
                background: showGoalForm ? '#6c757d' : '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: 5,
                cursor: 'pointer'
              }}
            >
              {showGoalForm ? 'Cancel' : '+ Add Goal'}
            </button>
          </div>

          {showGoalForm && (
            <div style={{
              background: 'white',
              padding: 20,
              borderRadius: 8,
              marginBottom: 20,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginTop: 0 }}>Create New Goal</h3>
              <form onSubmit={handleCreateGoal}>
                <div style={{ marginBottom: 15 }}>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Goal Title *</label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    required
                    style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                  />
                </div>
                <div style={{ marginBottom: 15 }}>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Description</label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    rows={3}
                    style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 5 }}
                  />
                </div>
                <div style={{ marginBottom: 15 }}>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Due Date *</label>
                  <input
                    type="date"
                    value={newGoal.dueDate}
                    onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })}
                    required
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
                  Create Goal
                </button>
              </form>
            </div>
          )}

          {goals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#7f8c8d' }}>
              <p>No goals set yet. Create your first goal!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {goals.map((goal) => (
                <div
                  key={goal.id}
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
                            background: getStatusColor(goal.status),
                            color: 'white',
                            textTransform: 'capitalize'
                          }}
                        >
                          {goal.status.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: 13, color: '#7f8c8d' }}>
                          Due: {formatDate(goal.dueDate)}
                        </span>
                      </div>
                      <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{goal.title}</h3>
                      {goal.description && (
                        <p style={{ margin: '0 0 15px 0', color: '#555' }}>{goal.description}</p>
                      )}
                      
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 13, color: '#7f8c8d' }}>Progress</span>
                          <span style={{ fontSize: 13, fontWeight: 'bold' }}>{goal.progress}%</span>
                        </div>
                        <div style={{ background: '#eee', borderRadius: 10, height: 10, overflow: 'hidden' }}>
                          <div
                            style={{
                              background: goal.progress === 100 ? '#27ae60' : '#3498db',
                              width: `${goal.progress}%`,
                              height: '100%',
                              borderRadius: 10,
                              transition: 'width 0.3s'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={goal.progress}
                          onChange={(e) => handleUpdateGoalProgress(goal.id, parseInt(e.target.value), goal.status)}
                          style={{ flex: 1, minWidth: 100 }}
                        />
                        <select
                          value={goal.status}
                          onChange={(e) => handleUpdateGoalProgress(goal.id, goal.progress, e.target.value)}
                          style={{ padding: 5, borderRadius: 3, border: '1px solid #ddd' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          style={{
                            padding: '5px 10px',
                            background: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: 3,
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
