import React, { useState, useEffect } from 'react';

export default function Payroll() {
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [viewMode, setViewMode] = useState('list'); // list or detail
  const [selectedPayroll, setSelectedPayroll] = useState(null);

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
    loadPayroll();
  }, []);

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/api/payroll/my-salary');
      setPayroll(data.payroll || []);
    } catch (err) {
      console.error('Error loading payroll:', err);
    }
    setLoading(false);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  const formatMonth = (month, year) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const filteredPayroll = selectedMonth 
    ? payroll.filter(p => `${p.year}-${String(p.month).padStart(2, '0')}` === selectedMonth)
    : payroll;

  const viewDetails = (p) => {
    setSelectedPayroll(p);
    setViewMode('detail');
  };

  const getMonthOptions = () => {
    const options = [];
    const months = new Set(payroll.map(p => `${p.year}-${String(p.month).padStart(2, '0')}`));
    months.forEach(m => options.push(m));
    return options.sort().reverse();
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Payroll & Salary</h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Filter */}
      <div style={styles.filterBar}>
        <label style={{ marginRight: 10 }}>Filter by Month:</label>
        <select 
          style={styles.select} 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="">All Months</option>
          {getMonthOptions().map(m => (
            <option key={m} value={m}>{formatMonth(parseInt(m.split('-')[1]), parseInt(m.split('-')[0]))}</option>
          ))}
        </select>
      </div>

      {viewMode === 'detail' && selectedPayroll ? (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3>Salary Slip - {formatMonth(selectedPayroll.month, selectedPayroll.year)}</h3>
            <button onClick={() => setViewMode('list')} style={styles.backBtn}>← Back to List</button>
          </div>

          <div style={styles.salarySlip}>
            <div style={styles.slipHeader}>
              <h4>Employee Management System</h4>
              <p>Salary Slip for {formatMonth(selectedPayroll.month, selectedPayroll.year)}</p>
            </div>

            <div style={styles.empDetails}>
              <p><strong>Employee Name:</strong> {selectedPayroll.employeeName}</p>
              <p><strong>Department:</strong> {selectedPayroll.department}</p>
              <p><strong>Base Salary:</strong> {formatCurrency(selectedPayroll.baseSalary)}</p>
            </div>

            <table style={styles.slipTable}>
              <tbody>
                <tr>
                  <td style={styles.slipLabel}>Present Days</td>
                  <td style={styles.slipValue}>{selectedPayroll.presentDays} days</td>
                </tr>
                <tr>
                  <td style={styles.slipLabel}>Absent Days</td>
                  <td style={styles.slipValue}>{selectedPayroll.absentDays} days</td>
                </tr>
              </tbody>
            </table>

            <table style={styles.slipTable}>
              <thead>
                <tr>
                  <th style={styles.slipTh}>Earnings</th>
                  <th style={styles.slipTh}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.slipTd}>Basic Salary</td>
                  <td style={styles.slipTd}>{formatCurrency(selectedPayroll.basic)}</td>
                </tr>
                <tr>
                  <td style={styles.slipTd}>House Rent Allowance (HRA)</td>
                  <td style={styles.slipTd}>{formatCurrency(selectedPayroll.hra)}</td>
                </tr>
                <tr>
                  <td style={styles.slipTd}>Conveyance</td>
                  <td style={styles.slipTd}>{formatCurrency(selectedPayroll.conveyance)}</td>
                </tr>
                <tr>
                  <td style={styles.slipTd}>Special Allowance</td>
                  <td style={styles.slipTd}>{formatCurrency(selectedPayroll.special)}</td>
                </tr>
                <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
                  <td style={styles.slipTd}>Gross Salary</td>
                  <td style={styles.slipTd}>{formatCurrency(selectedPayroll.grossSalary)}</td>
                </tr>
              </tbody>
            </table>

            <table style={styles.slipTable}>
              <thead>
                <tr>
                  <th style={styles.slipTh}>Deductions</th>
                  <th style={styles.slipTh}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.slipTd}>Provident Fund (PF)</td>
                  <td style={styles.slipTd}>-{formatCurrency(selectedPayroll.pf)}</td>
                </tr>
                <tr>
                  <td style={styles.slipTd}>Income Tax</td>
                  <td style={styles.slipTd}>-{formatCurrency(selectedPayroll.tax)}</td>
                </tr>
                <tr>
                  <td style={styles.slipTd}>Insurance</td>
                  <td style={styles.slipTd}>-{formatCurrency(selectedPayroll.insurance)}</td>
                </tr>
                <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
                  <td style={styles.slipTd}>Total Deductions</td>
                  <td style={styles.slipTd}>-{formatCurrency(selectedPayroll.totalDeductions)}</td>
                </tr>
              </tbody>
            </table>

            <div style={styles.netSalary}>
              <span>Net Salary:</span>
              <span style={styles.netAmount}>{formatCurrency(selectedPayroll.netSalary)}</span>
            </div>
          </div>

          <button onClick={() => window.print()} style={styles.printBtn}>🖨️ Print / Save as PDF</button>
        </div>
      ) : (
        <div style={styles.card}>
          <h3>Salary History</h3>
          {loading ? (
            <p>Loading...</p>
          ) : filteredPayroll.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Month</th>
                  <th style={styles.th}>Base Salary</th>
                  <th style={styles.th}>Gross Salary</th>
                  <th style={styles.th}>Deductions</th>
                  <th style={styles.th}>Net Salary</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayroll.map((p) => (
                  <tr key={p.id} style={styles.tr}>
                    <td style={styles.td}>{formatMonth(p.month, p.year)}</td>
                    <td style={styles.td}>{formatCurrency(p.baseSalary)}</td>
                    <td style={styles.td}>{formatCurrency(p.grossSalary)}</td>
                    <td style={styles.td}>-{formatCurrency(p.totalDeductions)}</td>
                    <td style={{ ...styles.td, fontWeight: 'bold', color: '#28a745' }}>{formatCurrency(p.netSalary)}</td>
                    <td style={styles.td}>
                      <button onClick={() => viewDetails(p)} style={styles.viewBtn}>View Slip</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', padding: 40, color: '#666' }}>No salary records found.</p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  logoutBtn: { padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  filterBar: { display: 'flex', alignItems: 'center', marginBottom: 20, padding: 16, background: 'white', borderRadius: 8 },
  select: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 },
  card: { background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  backBtn: { padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 16 },
  th: { textAlign: 'left', padding: '12px 8px', borderBottom: '2px solid #ddd', fontWeight: 'bold', color: '#333' },
  td: { padding: '12px 8px', borderBottom: '1px solid #eee' },
  tr: { borderBottom: '1px solid #eee' },
  viewBtn: { padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  salarySlip: { border: '1px solid #ddd', borderRadius: 8, padding: 24, marginBottom: 20 },
  slipHeader: { textAlign: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #333' },
  empDetails: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 },
  slipTable: { width: '100%', marginBottom: 16, borderCollapse: 'collapse' },
  slipTh: { textAlign: 'left', padding: '8px 12px', background: '#f5f5f5', borderBottom: '1px solid #ddd' },
  slipTd: { padding: '8px 12px', borderBottom: '1px solid #eee' },
  slipLabel: { padding: '8px 12px', fontWeight: 'bold' },
  slipValue: { padding: '8px 12px' },
  netSalary: { display: 'flex', justifyContent: 'space-between', padding: 16, background: '#28a745', color: 'white', borderRadius: 8, fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  netAmount: { fontSize: 24 },
  printBtn: { padding: '12px 24px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 },
};
