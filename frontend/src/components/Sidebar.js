import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ system = 'employee', onLogout, isOpen, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const employeeMenu = [
    { path: '/employee/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/employee/announcements', label: 'Announcements', icon: '📢' },
    { path: '/employee/holidays', label: 'Holiday Calendar', icon: '📅' },
    { path: '/employee/attendance', label: 'Attendance', icon: '📍' },
    { path: '/employee/leaves', label: 'Leave Management', icon: '🏖️' },
    { path: '/employee/tickets', label: 'Support Tickets', icon: '🎫' },
    { path: '/employee/expenses', label: 'Expenses', icon: '💰' },
    { path: '/employee/documents', label: 'Documents', icon: '📁' },
    { path: '/employee/performance', label: 'Performance', icon: '⭐' },
    { path: '/employee/messages', label: 'Messages', icon: '💬' },
    { path: '/employee/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/employee/payroll', label: 'Payroll', icon: '💵' },
    { path: '/employee/profile', label: 'My Profile', icon: '👤' },
  ];

  const employerMenu = [
    { path: '/employer/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/employer/announcements', label: 'Announcements', icon: '📢' },
    { path: '/employer/holidays', label: 'Holiday Calendar', icon: '📅' },
    { path: '/employer/employees', label: 'Employees', icon: '👥' },
    { path: '/employer/attendance', label: 'Attendance Records', icon: '📊' },
    { path: '/employer/leaves', label: 'Leave Approvals', icon: '✅' },
    { path: '/employer/tickets', label: 'Ticket Management', icon: '🎫' },
    { path: '/employer/expenses', label: 'Expense Management', icon: '💰' },
    { path: '/employer/documents', label: 'Document Verification', icon: '📁' },
    { path: '/employer/performance', label: 'Performance Reviews', icon: '⭐' },
    { path: '/employer/payroll', label: 'Payroll Management', icon: '💵' },
    { path: '/employer/messages', label: 'Messages', icon: '💬' },
    { path: '/employer/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/employer/ai-assistant', label: 'AI Assistant', icon: '🤖' },
    { path: '/employer/reports', label: 'Reports & Analytics', icon: '📈' },
    { path: '/employer/profile', label: 'My Profile', icon: '👤' },
  ];

  const menuItems = system === 'employer' ? employerMenu : employeeMenu;
  const isEmployer = system === 'employer';
  
  const accentColor = isEmployer ? '#2d5016' : '#007bff';
  const gradientStart = isEmployer ? '#2d5016' : '#1a1a2e';
  const gradientEnd = isEmployer ? '#1a3009' : '#16213e';

  const isActive = (path) => {
    if (path === '/employee/dashboard' || path === '/employer/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Handle navigation - close sidebar on mobile after navigation
  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile && isOpen) {
      onToggle();
    }
  };

  // Close sidebar when clicking overlay on mobile
  const handleOverlayClick = () => {
    if (isMobile && isOpen) {
      onToggle();
    }
  };

  return (
    <>
      {/* Burger Menu Button - Only visible on mobile */}
      {isMobile && (
        <button 
          onClick={onToggle}
          style={styles.burgerButton}
        >
          {isOpen ? '✕' : '☰'}
        </button>
      )}
      
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          style={styles.overlay} 
          onClick={handleOverlayClick}
        />
      )}
      
      {/* Sidebar */}
      <div style={{
        ...styles.sidebar, 
        background: `linear-gradient(180deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
        transform: isMobile 
          ? (isOpen ? 'translateX(0)' : 'translateX(-100%)')
          : 'translateX(0)',
        width: isMobile ? 260 : 260,
        position: isMobile ? 'fixed' : 'fixed',
        zIndex: isMobile ? 1000 : 'auto',
      }}>
        <div style={styles.logo}>
          <h2 style={{...styles.logoText, color: accentColor}}>EMS</h2>
          <p style={styles.logoSubtitle}>{isEmployer ? 'Employer Portal' : 'Employee Portal'}</p>
        </div>
        
        <nav style={styles.nav}>
          {menuItems.map((item, index) => (
            <div
              key={index}
              style={isActive(item.path) ? {
                ...styles.activeItem,
                background: `${accentColor}26`,
                borderLeft: `3px solid ${accentColor}`,
              } : styles.item}
              onClick={() => handleNavigate(item.path)}
            >
              <span style={styles.icon}>{item.icon}</span>
              <span style={styles.label}>{item.label}</span>
            </div>
          ))}
        </nav>

        <div style={styles.footer}>
          <div style={styles.userInfo}>
            <span style={styles.userIcon}>👤</span>
            <span style={styles.userRole}>{isEmployer ? 'Employer' : 'Employee'}</span>
          </div>
          <button onClick={onLogout} style={{...styles.logoutBtn, background: `${accentColor}33`}}>
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  );
}

const styles = {
  sidebar: {
    width: 260,
    height: '100vh',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    boxShadow: '2px 0 10px rgba(0,0,0,0.2)',
    transition: 'transform 0.3s ease-in-out',
  },
  burgerButton: {
    position: 'fixed',
    top: 16,
    left: 16,
    zIndex: 1001,
    width: 44,
    height: 44,
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    border: 'none',
    borderRadius: 8,
    color: 'white',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  logo: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center',
  },
  logoText: {
    margin: 0,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007bff',
  },
  logoSubtitle: {
    margin: '4px 0 0',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  nav: {
    flex: 1,
    padding: '20px 0',
    overflowY: 'auto',
  },
  item: {
    padding: '14px 20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: 'rgba(255,255,255,0.7)',
    transition: 'all 0.2s',
    borderLeft: '3px solid transparent',
  },
  activeItem: {
    padding: '14px 20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(0,123,255,0.15)',
    borderLeft: '3px solid #007bff',
    color: 'white',
  },
  icon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  userIcon: {
    fontSize: 20,
  },
  userRole: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  logoutBtn: {
    width: '100%',
    padding: '12px',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    transition: 'background 0.2s',
  },
};
