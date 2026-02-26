import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, signInWithEmailAndPassword } from '../firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Constraint: Trim whitespace from inputs
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    // Constraint: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    
    // Constraint: Minimum password length (at least 6 characters)
    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      
      // Determine role based on email (admin emails contain 'admin')
      const isAdmin = trimmedEmail.toLowerCase().includes('admin') || trimmedEmail.toLowerCase().includes('hr');
      const role = isAdmin ? 'admin' : 'employee';
      
      // Store auth data
      localStorage.setItem('authToken', 'mock-token-' + Date.now());
      localStorage.setItem('userEmail', trimmedEmail);
      localStorage.setItem('userRole', role);
      
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.header}>
          <h1 style={styles.logo}>EMS</h1>
          <p style={styles.subtitle}>Employee Management System</p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div style={styles.footer}>
          <p style={styles.hint}>
            <strong>Demo Credentials:</strong>
          </p>
          <p style={styles.hint}>
            Admin: admin@test.com / any password
          </p>
          <p style={styles.hint}>
            Employee: employee@test.com / any password
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    padding: 20,
  },
  loginBox: {
    width: '100%',
    maxWidth: 400,
    background: 'white',
    borderRadius: 12,
    padding: 40,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1a1a2e',
    margin: 0,
  },
  subtitle: {
    color: '#666',
    margin: '8px 0 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  error: {
    padding: 12,
    background: '#fee',
    color: '#c33',
    borderRadius: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    padding: '14px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 16,
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '16px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: 10,
    transition: 'background 0.2s',
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1px solid #eee',
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    margin: '4px 0',
  },
};
