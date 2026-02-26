import React, { useState, useEffect } from 'react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: '',
    month: '',
    year: new Date().getFullYear(),
    status: ''
  });

  const isAdmin = localStorage.getItem('userRole') === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchReport();
    }
  }, [activeTab, filters]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      let url = `/api/reports/${activeTab}?`;
      
      if (activeTab === 'attendance') {
        if (filters.startDate) url += `startDate=${filters.startDate}&`;
        if (filters.endDate) url += `endDate=${filters.endDate}&`;
        if (filters.department) url += `department=${filters.department}&`;
      } else if (activeTab === 'leaves') {
        if (filters.startDate) url += `startDate=${filters.startDate}&`;
        if (filters.endDate) url += `endDate=${filters.endDate}&`;
        if (filters.status) url += `status=${filters.status}&`;
      } else if (activeTab === 'payroll') {
        if (filters.month) url += `month=${filters.month}&`;
        if (filters.year) url += `year=${filters.year}&`;
        if (filters.department) url += `department=${filters.department}&`;
      } else if (activeTab === 'employees') {
        if (filters.department) url += `department=${filters.department}&`;
        if (filters.status) url += `status=${filters.status}&`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setReportData(data.report);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;
    
    let csvContent = '';
    let filename = `${activeTab}_report.csv`;

    if (activeTab === 'attendance' && reportData.employeeSummary) {
      csvContent = 'Employee,Department,Present,Absent,Late,Total,Attendance %\n';
      Object.entries(reportData.employeeSummary).forEach(([uid, emp]) => {
        const percentage = emp.total > 0 ? Math.round((emp.present / emp.total) * 100) : 0;
        csvContent += `${emp.name},${emp.department},${emp.present},${emp.absent},${emp.late},${emp.total},${percentage}%\n`;
      });
    } else if (activeTab === 'employees' && reportData.employees) {
      csvContent = 'ID,Name,Email,Department,Designation,Status,Joining Date\n';
      reportData.employees.forEach(emp => {
        csvContent += `${emp.id},${emp.name},${emp.email},${emp.department},${emp.designation},${emp.status},${emp.joiningDate}\n`;
      });
    } else {
      alert('CSV export not available for this report format');
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You need admin privileges to view reports.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>📊 Reports & Analytics</h2>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>
        {['attendance', 'leaves', 'payroll', 'employees'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab ? '#3498db' : 'transparent',
              color: activeTab === tab ? 'white' : '#555',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
 Report            {tab}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', padding: 20, borderRadius: 8, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Filters</h3>
        <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
          {activeTab === 'attendance' && (
            <>
              <input
                type="date"
                placeholder="Start Date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                style={{ padding: 8, borderRadius: 5, border: '1px solid #ddd' }}
              />
              <input
                type="date"
                placeholder="End Date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                style={{ padding: 8, borderRadius: 5, border: '1px solid #ddd' }}
              />
            </>
          )}
          {activeTab === 'leaves' && (
            <>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                style={{ padding: 8, borderRadius: 5, border: '1px solid #ddd' }}
              >
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </>
          )}
          {activeTab === 'payroll' && (
            <>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                style={{ padding: 8, borderRadius: 5, border: '1px solid #ddd' }}
              >
                <option value="">All Months</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('en', { month: 'long' })}</option>
                ))}
              </select>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                style={{ padding: 8, borderRadius: 5, border: '1px solid #ddd' }}
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </>
          )}
          <button
            onClick={exportToCSV}
            style={{
              padding: '8px 20px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer'
            }}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading report...</div>
      ) : reportData ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
          {activeTab === 'attendance' && (
            <>
              <StatCard title="Total Records" value={reportData.totalRecords} icon="📋" />
              <StatCard title="Present" value={reportData.present} icon="✅" color="#27ae60" />
              <StatCard title="Absent" value={reportData.absent} icon="❌" color="#e74c3c" />
              <StatCard title="Late" value={reportData.late} icon="⏰" color="#f39c12" />
              <StatCard title="Attendance %" value={`${reportData.presentPercentage}%`} icon="📈" />
              
              {reportData.employeeSummary && (
                <div style={{ gridColumn: '1 / -1', background: 'white', padding: 20, borderRadius: 8 }}>
                  <h3>Employee-wise Summary</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: 10, textAlign: 'left' }}>Employee</th>
                        <th style={{ padding: 10, textAlign: 'left' }}>Department</th>
                        <th style={{ padding: 10, textAlign: 'center' }}>Present</th>
                        <th style={{ padding: 10, textAlign: 'center' }}>Absent</th>
                        <th style={{ padding: 10, textAlign: 'center' }}>Late</th>
                        <th style={{ padding: 10, textAlign: 'center' }}>Total</th>
                        <th style={{ padding: 10, textAlign: 'center' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.employeeSummary).map(([uid, emp]) => (
                        <tr key={uid} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: 10 }}>{emp.name}</td>
                          <td style={{ padding: 10 }}>{emp.department}</td>
                          <td style={{ padding: 10, textAlign: 'center', color: '#27ae60' }}>{emp.present}</td>
                          <td style={{ padding: 10, textAlign: 'center', color: '#e74c3c' }}>{emp.absent}</td>
                          <td style={{ padding: 10, textAlign: 'center', color: '#f39c12' }}>{emp.late}</td>
                          <td style={{ padding: 10, textAlign: 'center' }}>{emp.total}</td>
                          <td style={{ padding: 10, textAlign: 'center' }}>
                            {emp.total > 0 ? Math.round((emp.present / emp.total) * 100) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'leaves' && (
            <>
              <StatCard title="Total Leaves" value={reportData.totalLeaves} icon="📋" />
              <StatCard title="Approved" value={reportData.approved} icon="✅" color="#27ae60" />
              <StatCard title="Pending" value={reportData.pending} icon="⏳" color="#f39c12" />
              <StatCard title="Rejected" value={reportData.rejected} icon="❌" color="#e74c3c" />
            </>
          )}

          {activeTab === 'payroll' && (
            <>
              <StatCard title="Employees" value={reportData.totalEmployees} icon="👥" />
              <StatCard title="Total Salary" value={`₹${(reportData.totalSalary || 0).toLocaleString()}`} icon="💰" />
              <StatCard title="Average Salary" value={`₹${(reportData.averageSalary || 0).toLocaleString()}`} icon="📊" />
              <StatCard title="Total PF" value={`₹${(reportData.totalPf || 0).toLocaleString()}`} icon="🏦" />
              <StatCard title="Total Tax" value={`₹${(reportData.totalTax || 0).toLocaleString()}`} icon="📑" />
            </>
          )}

          {activeTab === 'employees' && (
            <>
              <StatCard title="Total Employees" value={reportData.totalEmployees} icon="👥" />
              <StatCard title="Active" value={reportData.active} icon="✅" color="#27ae60" />
              <StatCard title="Inactive" value={reportData.inactive} icon="❌" color="#e74c3c" />
              
              <div style={{ gridColumn: '1 / -1', background: 'white', padding: 20, borderRadius: 8 }}>
                <h3>By Department</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {reportData.byDepartment && Object.entries(reportData.byDepartment).map(([dept, count]) => (
                    <div key={dept} style={{ background: '#f8f9fa', padding: '10px 20px', borderRadius: 5 }}>
                      <strong>{dept}</strong>: {count}
                    </div>
                  ))}
                </div>
              </div>

              {reportData.employees && (
                <div style={{ gridColumn: '1 / -1', background: 'white', padding: 20, borderRadius: 8, maxHeight: 400, overflow: 'auto' }}>
                  <h3>Employee List</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: 10, textAlign: 'left' }}>Name</th>
                        <th style={{ padding: 10, textAlign: 'left' }}>Email</th>
                        <th style={{ padding: 10, textAlign: 'left' }}>Department</th>
                        <th style={{ padding: 10, textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.employees.map(emp => (
                        <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: 10 }}>{emp.name}</td>
                          <td style={{ padding: 10 }}>{emp.email}</td>
                          <td style={{ padding: 10 }}>{emp.department}</td>
                          <td style={{ padding: 10 }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: 3,
                              background: emp.status === 'active' ? '#d4edda' : '#f8d7da',
                              color: emp.status === 'active' ? '#155724' : '#721c24'
                            }}>
                              {emp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#7f8c8d' }}>
          No data available
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color = '#2c3e50' }) {
  return (
    <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 'bold', color }}>{value}</div>
      <div style={{ color: '#7f8c8d', fontSize: 14 }}>{title}</div>
    </div>
  );
}
