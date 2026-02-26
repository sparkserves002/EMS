import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';

export default function Attendance() {
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  
  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationSettings, setLocationSettings] = useState({ enabled: true });

  // Get the stored token from localStorage (set by mock auth)
  const getToken = () => {
    return localStorage.getItem('authToken') || 'mock-token';
  };

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

  const fetchTodayStatus = async () => {
    try {
      const data = await apiCall('/api/attendance/today');
      setTodayStatus(data);
    } catch (err) {
      console.error('Error fetching today status:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await apiCall('/api/attendance/history?limit=30');
      setHistory(data.items || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

const fetchStats = async () => {
    try {
      const data = await apiCall('/api/attendance/stats');
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchLocationSettings = async () => {
    try {
      const data = await apiCall('/api/attendance/settings');
      setLocationSettings(data);
    } catch (err) {
      console.error('Error fetching location settings:', err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchTodayStatus(), fetchHistory(), fetchStats(), fetchLocationSettings()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      setLocationLoading(true);
      setLocationError('');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setUserLocation(coords);
          setLocationLoading(false);
          resolve(coords);
        },
        (error) => {
          let errorMessage = 'Unable to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          setLocationError(errorMessage);
          setLocationLoading(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    setMessage('');
    setLocationError('');

    try {
      let coords = null;
      if (locationSettings.enabled) {
        try {
          coords = await getCurrentLocation();
        } catch (locErr) {
          setMessage(locErr.message);
          setCheckingIn(false);
          return;
        }
      }

      const data = await apiCall('/api/attendance/checkin', {
        method: 'POST',
        body: JSON.stringify({ coords }),
      });
      
      if (data.distance) {
        setMessage(`${data.message} (${data.distance}m from office)`);
      } else {
        setMessage(data.message || 'Check-in successful!');
      }
      await loadAllData();
    } catch (err) {
      setMessage(err.message || 'Check-in failed');
    }
    setCheckingIn(false);
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    setMessage('');
    setLocationError('');

    try {
      let coords = null;
      if (locationSettings.enabled) {
        try {
          coords = await getCurrentLocation();
        } catch (locErr) {
          setMessage(locErr.message);
          setCheckingOut(false);
          return;
        }
      }

      const data = await apiCall('/api/attendance/checkout', {
        method: 'POST',
        body: JSON.stringify({ coords }),
      });
      setMessage('Check-out successful!');
      await loadAllData();
    } catch (err) {
      setMessage(err.message || 'Check-out failed');
    }
    setCheckingOut(false);
  };

  const handleLogout = async () => {
    try {
      const { signOut } = await import('../firebase');
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
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-';
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const minutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (minutes < 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>Loading attendance data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Attendance System</h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabContainer}>
        <button 
          style={activeTab === 'today' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('today')}
        >
          Today's Status
        </button>
        <button 
          style={activeTab === 'history' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button 
          style={activeTab === 'stats' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      {/* Today's Status Tab */}
      {activeTab === 'today' && (
        <div style={styles.card}>
          <h3>Today's Attendance</h3>
          <p style={{ marginBottom: 20, color: '#666' }}>
            Date: {todayStatus?.date ? formatDate(todayStatus.date) : formatDate(new Date())}
          </p>

          {todayStatus?.checkedIn ? (
            <div>
              <div style={styles.statusBox}>
                <div style={styles.statusItem}>
                  <span style={styles.label}>Check-in Time:</span>
                  <span style={styles.value}>{todayStatus.checkIn}</span>
                </div>
                <div style={styles.statusItem}>
                  <span style={styles.label}>Check-out Time:</span>
                  <span style={styles.value}>
                    {todayStatus.checkOut || 'Not yet checked out'}
                  </span>
                </div>
                {todayStatus.checkIn && todayStatus.checkOut && (
                  <div style={styles.statusItem}>
                    <span style={styles.label}>Duration:</span>
                    <span style={styles.value}>
                      {calculateDuration(todayStatus.checkIn, todayStatus.checkOut)}
                    </span>
                  </div>
                )}
              </div>

              {!todayStatus.checkOut ? (
                <button 
                  onClick={handleCheckOut} 
                  disabled={checkingOut}
                  style={styles.checkoutBtn}
                >
                  {checkingOut ? 'Checking out...' : 'Check Out'}
                </button>
              ) : (
                <div style={styles.completedMessage}>
                  ✓ You have completed your attendance for today
                </div>
              )}
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: 20 }}>You haven't checked in yet today.</p>
              <button 
                onClick={handleCheckIn} 
                disabled={checkingIn}
                style={styles.checkinBtn}
              >
                {checkingIn ? 'Checking in...' : 'Check In'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={styles.card}>
          <h3>Attendance History</h3>
          {history.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Check-in</th>
                  <th style={styles.th}>Check-out</th>
                  <th style={styles.th}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record, index) => (
                  <tr key={index} style={styles.tr}>
                    <td style={styles.td}>{formatDate(record.date)}</td>
                    <td style={styles.td}>{record.checkIn || '-'}</td>
                    <td style={styles.td}>{record.checkOut || '-'}</td>
                    <td style={styles.td}>
                      {calculateDuration(record.checkIn, record.checkOut)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: 40 }}>
              No attendance records found.
            </p>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && stats && (
        <div style={styles.card}>
          <h3>Attendance Statistics</h3>
          
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <div style={styles.statValue}>{stats.totalDays}</div>
              <div style={styles.statLabel}>Total Days</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statValue}>{stats.daysWithCheckIn}</div>
              <div style={styles.statLabel}>Days Checked In</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statValue}>{stats.completeDays}</div>
              <div style={styles.statLabel}>Complete Days</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statValue}>{stats.totalHours}h</div>
              <div style={styles.statLabel}>Total Hours</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statValue}>{stats.averageHours}h</div>
              <div style={styles.statLabel}>Average Hours/Day</div>
            </div>
          </div>

          <h4 style={{ marginTop: 30 }}>Recent Records</h4>
          {stats.items && stats.items.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Check-in</th>
                  <th style={styles.th}>Check-out</th>
                  <th style={styles.th}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {stats.items.map((record, index) => (
                  <tr key={index} style={styles.tr}>
                    <td style={styles.td}>{formatDate(record.date)}</td>
                    <td style={styles.td}>{record.checkIn || '-'}</td>
                    <td style={styles.td}>{record.checkOut || '-'}</td>
                    <td style={styles.td}>
                      {calculateDuration(record.checkIn, record.checkOut)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: 20 }}>
              No records available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  logoutBtn: {
    padding: '8px 16px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  tabContainer: {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
    borderBottom: '2px solid #eee',
  },
  tab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    color: '#666',
  },
  activeTab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    color: '#007bff',
    borderBottom: '2px solid #007bff',
    marginBottom: -2,
  },
  message: {
    padding: 12,
    background: '#d4edda',
    color: '#155724',
    borderRadius: 4,
    marginBottom: 20,
  },
  card: {
    background: 'white',
    borderRadius: 8,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  statusBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },
  statusItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #eee',
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    color: '#666',
  },
  checkinBtn: {
    padding: '16px 32px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    fontSize: 16,
    cursor: 'pointer',
  },
  checkoutBtn: {
    padding: '16px 32px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    fontSize: 16,
    cursor: 'pointer',
  },
  completedMessage: {
    padding: 16,
    background: '#d4edda',
    color: '#155724',
    borderRadius: 4,
    textAlign: 'center',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 16,
  },
  th: {
    textAlign: 'left',
    padding: '12px 8px',
    borderBottom: '2px solid #ddd',
    fontWeight: 'bold',
    color: '#333',
  },
  td: {
    padding: '12px 8px',
    borderBottom: '1px solid #eee',
  },
  tr: {
    borderBottom: '1px solid #eee',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 16,
    marginTop: 16,
  },
  statBox: {
    padding: 20,
    background: '#f8f9fa',
    borderRadius: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
};
