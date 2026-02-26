import React, { useState } from 'react';

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState('email');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  
  // Email Writing State
  const [emailType, setEmailType] = useState('offer');
  const [emailDetails, setEmailDetails] = useState({
    recipientName: '',
    companyName: '',
    position: '',
    startDate: '',
    salary: '',
    additionalInfo: ''
  });

  // Policy Creation State
  const [policyType, setPolicyType] = useState('leave');
  const [policyDetails, setPolicyDetails] = useState({
    companyName: '',
    effectiveDate: '',
    departments: '',
    additionalClause: ''
  });

  // HR Task State
  const [hrTaskType, setHrTaskType] = useState('warning');
  const [hrDetails, setHrDetails] = useState({
    employeeName: '',
    incidentDate: '',
    description: '',
    previousWarnings: ''
  });

  const handleLogout = async () => {
    try {
      const { signOut } = await import('../firebase');
      const { auth } = await import('../firebase');
      await signOut(auth);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('systemType');
      window.location.href = '/employer-login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Mock AI Response Generators
  const generateEmail = () => {
    const templates = {
      offer: `
Subject: Job Offer for ${emailDetails.position} Position

Dear ${emailDetails.recipientName},

We are pleased to offer you the position of ${emailDetails.position} at ${emailDetails.companyName}.

Position Details:
- Job Title: ${emailDetails.position}
- Start Date: ${emailDetails.startDate}
- Salary: ${emailDetails.salary}

Please find the attached documents for your review:
1. Employment Contract
2. Company Policy Handbook
3. Benefits Summary

To accept this offer, please sign and return the contract within 5 business days.

We look forward to having you join our team!

Best regards,
HR Department
${emailDetails.companyName}
      `,
      welcome: `
Subject: Welcome to ${emailDetails.companyName}!

Dear ${emailDetails.recipientName},

Welcome to ${emailDetails.companyName}! We are thrilled to have you join our team as our new ${emailDetails.position}.

Your start date is ${emailDetails.startDate}. On your first day, please report to the main reception at 9:00 AM.

What to bring:
- Government-issued ID
- Banking details for payroll setup
- Completed enrollment forms

If you have any questions before your start date, please don't hesitate to contact us.

We are excited to have you on board!

Warm regards,
HR Team
${emailDetails.companyName}
      `,
      meeting: `
Subject: Meeting Request - ${emailDetails.additionalInfo}

Dear ${emailDetails.recipientName},

I hope this email finds you well. I would like to schedule a meeting to discuss ${emailDetails.additionalInfo || 'important matters regarding your employment'}.

Please let me know your availability for this week.

Thank you for your time.

Best regards,
HR Department
${emailDetails.companyName}
      `,
      termination: `
Subject: Employment Termination Notice

Dear ${emailDetails.recipientName},

This letter serves as formal notice of termination of your employment at ${emailDetails.companyName}, effective ${emailDetails.startDate}.

Please return all company property to HR by your last working day. Your final paycheck will include all accrued benefits.

For any queries regarding your employment records, contact HR at hr@${emailDetails.companyName.toLowerCase().replace(/\s/g, '')}.com

Thank you for your service.

Sincerely,
HR Department
${emailDetails.companyName}
      `
    };
    return templates[emailType] || templates.offer;
  };

  const generatePolicy = () => {
    const templates = {
      leave: `
LEAVE POLICY

Company: ${policyDetails.companyName || '[Company Name]'}
Effective Date: ${policyDetails.effectiveDate || '[Date]'}
Department: ${policyDetails.departments || 'All Departments'}

1. ANNUAL LEAVE
- Full-time employees are entitled to 20 days of paid annual leave per calendar year.
- Leave requests must be submitted at least 2 weeks in advance.
- Unused leave can be carried over to the next year (maximum 5 days).

2. SICK LEAVE
- Employees are entitled to 10 days of paid sick leave per year.
- Medical certificate required for absences exceeding 2 consecutive days.

3. MATERNITY/PATERNITY LEAVE
- Female employees: 12 weeks paid maternity leave
- Male employees: 2 weeks paid paternity leave

4. EMERGENCY LEAVE
- 5 days of emergency leave for immediate family emergencies.

${policyDetails.additionalClause ? `\n5. ADDITIONAL CLAUSES\n${policyDetails.additionalClause}` : ''}

HR Department
      `,
      attendance: `
ATTENDANCE POLICY

Company: ${policyDetails.companyName || '[Company Name]'}
Effective Date: ${policyDetails.effectiveDate || '[Date]'}
Department: ${policyDetails.departments || 'All Departments'}

1. WORKING HOURS
- Standard working hours: 9:00 AM - 6:00 PM
- Flexible hours available with manager approval.

2. ATTENDANCE REQUIREMENTS
- Employees must clock in/out daily.
- Late arrivals (more than 15 minutes) without prior notice will be marked as late.

3. ABSENCE POLICY
- Unexcused absences may result in disciplinary action.
- Three consecutive unexcused absences will be considered voluntary resignation.

4. REMOTE WORK
- Remote work requires prior approval from department head.
- Must maintain productivity standards.

${policyDetails.additionalClause ? `\n5. ADDITIONAL CLAUSES\n${policyDetails.additionalClause}` : ''}

HR Department
      `,
      code: `
CODE OF CONDUCT

Company: ${policyDetails.companyName || '[Company Name]'}
Effective Date: ${policyDetails.effectiveDate || '[Date]'}
Department: ${policyDetails.departments || 'All Departments'}

1. PROFESSIONAL BEHAVIOR
- All employees must maintain professional conduct at all times.
- Respect for colleagues, clients, and partners is mandatory.

2. CONFIDENTIALITY
- Employees must protect company confidential information.
- Non-disclosure agreements must be signed upon employment.

3. CONFLICT OF INTEREST
- Employees must avoid situations where personal interests conflict with company interests.
- Full disclosure required for any potential conflicts.

4. HARASSMENT-FREE WORKPLACE
- Zero tolerance for harassment of any kind.
- All complaints will be investigated promptly.

5. DISCIPLINARY ACTION
- Violations may result in warnings, suspension, or termination.

${policyDetails.additionalClause ? `\n6. ADDITIONAL CLAUSES\n${policyDetails.additionalClause}` : ''}

HR Department
      `,
      data: `
DATA PRIVACY POLICY

Company: ${policyDetails.companyName || '[Company Name]'}
Effective Date: ${policyDetails.effectiveDate || '[Date]'}
Department: ${policyDetails.departments || 'All Departments'}

1. DATA COLLECTION
- We collect only necessary employee data for employment purposes.
- Data includes: personal identification, employment history, performance records.

2. DATA STORAGE
- Employee data stored in secure encrypted systems.
- Access limited to authorized personnel only.

3. DATA USAGE
- Employee data used solely for HR and business purposes.
- No unauthorized sharing with third parties.

4. EMPLOYEE RIGHTS
- Employees can request access to their data.
- Employees can request data correction or deletion.

5. COMPLIANCE
- Policy complies with relevant data protection regulations.

${policyDetails.additionalClause ? `\n6. ADDITIONAL CLAUSES\n${policyDetails.additionalClause}` : ''}

HR Department
      `
    };
    return templates[policyType] || templates.leave;
  };

  const generateHRTask = () => {
    const templates = {
      warning: `
WRITTEN WARNING

Employee Name: ${hrDetails.employeeName}
Date: ${hrDetails.incidentDate}
Incident Date: ${hrDetails.incidentDate}

Dear ${hrDetails.employeeName},

This is a formal written warning regarding the following incident:

${hrDetails.description || '[Describe the incident]'}

This behavior violates company policy and expectations. ${hrDetails.previousWarnings ? `Please note that this is not your first warning (Previous: ${hrDetails.previousWarnings}).` : ''}

You are required to:
1. Cease this behavior immediately
2. Meet with your supervisor within 5 days to discuss improvement plan
3. Maintain satisfactory conduct going forward

Failure to improve may result in further disciplinary action, up to and including termination.

HR Manager
      `,
      promotion: `
PROMOTION LETTER

Date: ${new Date().toLocaleDateString()}

Dear ${hrDetails.employeeName},

Congratulations! We are pleased to inform you of your promotion.

Based on your outstanding performance and contributions to the company, you have been promoted to a higher position.

This promotion is effective immediately. Please meet with HR to discuss your new compensation package and responsibilities.

We believe you will continue to excel in your new role.

Congratulations again!

Best regards,
HR Department
      `,
      increment: `
SALARY INCREMENT LETTER

Date: ${new Date().toLocaleDateString()}

Dear ${hrDetails.employeeName},

We are pleased to announce a salary increase effective from your next pay cycle.

This increment reflects your hard work, dedication, and valuable contributions to the company.

Your new salary will be communicated to you in a separate letter.

Thank you for your continued commitment to excellence.

Best regards,
HR Department
      `,
      experience: `
EXPERIENCE CERTIFICATE

Date: ${new Date().toLocaleDateString()}

This is to certify that ${hrDetails.employeeName} has been employed with our organization from ${hrDetails.incidentDate || '[Start Date]'} to ${new Date().toLocaleDateString()}.

During their employment, they held the position of ${hrDetails.description || '[Position]'} and demonstrated professionalism and dedication.

We wish them success in their future endeavors.

For ${hrDetails.previousWarnings || '[Company Name]'},
HR Manager
      `
    };
    return templates[hrTaskType] || templates.warning;
  };

  const handleGenerate = () => {
    setLoading(true);
    setResult('');
    
    // Simulate AI processing delay
    setTimeout(() => {
      let output = '';
      switch (activeTab) {
        case 'email':
          output = generateEmail();
          break;
        case 'policy':
          output = generatePolicy();
          break;
        case 'hr':
          output = generateHRTask();
          break;
        default:
          output = 'Please select a task type.';
      }
      setResult(output);
      setLoading(false);
    }, 1500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    alert('Copied to clipboard!');
  };

  const downloadDocument = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>🤖 AI Assistant</h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* AI Feature Cards */}
      <div style={styles.featureCards}>
        <div 
          style={activeTab === 'email' ? { ...styles.featureCard, ...styles.activeFeature } : styles.featureCard}
          onClick={() => { setActiveTab('email'); setResult(''); }}
        >
          <span style={styles.featureIcon}>✉️</span>
          <h4>Email Writer</h4>
          <p>Generate professional formal emails</p>
        </div>
        <div 
          style={activeTab === 'policy' ? { ...styles.featureCard, ...styles.activeFeature } : styles.featureCard}
          onClick={() => { setActiveTab('policy'); setResult(''); }}
        >
          <span style={styles.featureIcon}>📋</span>
          <h4>Policy Creator</h4>
          <p>Create company policies & documents</p>
        </div>
        <div 
          style={activeTab === 'hr' ? { ...styles.featureCard, ...styles.activeFeature } : styles.featureCard}
          onClick={() => { setActiveTab('hr'); setResult(''); }}
        >
          <span style={styles.featureIcon}>👥</span>
          <h4>HR Helper</h4>
          <p>Assist with HR tasks & documents</p>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Input Section */}
        <div style={styles.inputSection}>
          <h3 style={styles.sectionTitle}>
            {activeTab === 'email' ? '✉️ Write Formal Email' : 
             activeTab === 'policy' ? '📋 Create Legal Policy' : '👥 HR Task Helper'}
          </h3>

          {activeTab === 'email' && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Type</label>
                <select 
                  style={styles.select}
                  value={emailType}
                  onChange={(e) => setEmailType(e.target.value)}
                >
                  <option value="offer">Job Offer Letter</option>
                  <option value="welcome">Welcome Letter</option>
                  <option value="meeting">Meeting Request</option>
                  <option value="termination">Termination Notice</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Recipient Name</label>
                <input 
                  style={styles.input}
                  type="text"
                  placeholder="Enter recipient name"
                  value={emailDetails.recipientName}
                  onChange={(e) => setEmailDetails({...emailDetails, recipientName: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Company Name</label>
                <input 
                  style={styles.input}
                  type="text"
                  placeholder="Enter company name"
                  value={emailDetails.companyName}
                  onChange={(e) => setEmailDetails({...emailDetails, companyName: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Position</label>
                <input 
                  style={styles.input}
                  type="text"
                  placeholder="Enter position title"
                  value={emailDetails.position}
                  onChange={(e) => setEmailDetails({...emailDetails, position: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Start Date</label>
                <input 
                  style={styles.input}
                  type="date"
                  value={emailDetails.startDate}
                  onChange={(e) => setEmailDetails({...emailDetails, startDate: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Salary/Details</label>
                <input 
                  style={styles.input}
                  type="text"
                  placeholder="Enter salary or additional details"
                  value={emailDetails.salary}
                  onChange={(e) => setEmailDetails({...emailDetails, salary: e.target.value})}
                />
              </div>
            </>
          )}

          {activeTab === 'policy' && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>Policy Type</label>
                <select 
                  style={styles.select}
                  value={policyType}
                  onChange={(e) => setPolicyType(e.target.value)}
                >
                  <option value="leave">Leave Policy</option>
                  <option value="attendance">Attendance Policy</option>
                  <option value="code">Code of Conduct</option>
                  <option value="data">Data Privacy Policy</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Company Name</label>
                <input 
                  style={styles.input}
                  type="text"
                  placeholder="Enter company name"
                  value={policyDetails.companyName}
                  onChange={(e) => setPolicyDetails({...policyDetails, companyName: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Effective Date</label>
                <input 
                  style={styles.input}
                  type="date"
                  value={policyDetails.effectiveDate}
                  onChange={(e) => setPolicyDetails({...policyDetails, effectiveDate: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Departments (comma separated)</label>
                <input 
                  style={styles.input}
                  type="text"
                  placeholder="e.g., All Departments, IT, HR"
                  value={policyDetails.departments}
                  onChange={(e) => setPolicyDetails({...policyDetails, departments: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Additional Clauses (Optional)</label>
                <textarea 
                  style={styles.textarea}
                  placeholder="Enter any additional clauses or specific requirements"
                  value={policyDetails.additionalClause}
                  onChange={(e) => setPolicyDetails({...policyDetails, additionalClause: e.target.value})}
                  rows={3}
                />
              </div>
            </>
          )}

          {activeTab === 'hr' && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>HR Task Type</label>
                <select 
                  style={styles.select}
                  value={hrTaskType}
                  onChange={(e) => setHrTaskType(e.target.value)}
                >
                  <option value="warning">Written Warning</option>
                  <option value="promotion">Promotion Letter</option>
                  <option value="increment">Salary Increment Letter</option>
                  <option value="experience">Experience Certificate</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Employee Name</label>
                <input 
                  style={styles.input}
                  type="text"
                  placeholder="Enter employee name"
                  value={hrDetails.employeeName}
                  onChange={(e) => setHrDetails({...hrDetails, employeeName: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input 
                  style={styles.input}
                  type="date"
                  value={hrDetails.incidentDate}
                  onChange={(e) => setHrDetails({...hrDetails, incidentDate: e.target.value})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description/Position</label>
                <textarea 
                  style={styles.textarea}
                  placeholder="Enter description or position details"
                  value={hrDetails.description}
                  onChange={(e) => setHrDetails({...hrDetails, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Additional Info (Optional)</label>
                <input 
                  style={styles.input}
                  type="text"
                  placeholder="Previous warnings or other details"
                  value={hrDetails.previousWarnings}
                  onChange={(e) => setHrDetails({...hrDetails, previousWarnings: e.target.value})}
                />
              </div>
            </>
          )}

          <button 
            style={styles.generateBtn}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? '🤖 Generating...' : '🚀 Generate with AI'}
          </button>
        </div>

        {/* Output Section */}
        <div style={styles.outputSection}>
          <div style={styles.outputHeader}>
            <h3 style={styles.sectionTitle}>📄 Generated Output</h3>
            {result && (
              <div style={styles.outputActions}>
                <button style={styles.actionBtn} onClick={copyToClipboard}>📋 Copy</button>
                <button style={styles.actionBtn} onClick={downloadDocument}>💾 Download</button>
              </div>
            )}
          </div>
          <div style={styles.outputBox}>
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>AI is generating your document...</p>
              </div>
            ) : result ? (
              <pre style={styles.outputText}>{result}</pre>
            ) : (
              <div style={styles.placeholder}>
                <span style={styles.placeholderIcon}>🤖</span>
                <p>Fill in the details and click "Generate with AI" to create your document</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  logoutBtn: { padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  featureCards: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
  featureCard: { 
    padding: 20, 
    background: 'white', 
    borderRadius: 8, 
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '2px solid transparent',
    textAlign: 'center'
  },
  activeFeature: {
    border: '2px solid #2d5016',
    background: '#f0f7e6'
  },
  featureIcon: { fontSize: 32, display: 'block', marginBottom: 8 },
  mainContent: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  inputSection: { background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  outputSection: { background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  sectionTitle: { marginTop: 0, marginBottom: 20, color: '#333', fontSize: 18 },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', marginBottom: 6, fontWeight: 'bold', color: '#333', fontSize: 14 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  generateBtn: { 
    width: '100%', 
    padding: '14px', 
    background: 'linear-gradient(135deg, #2d5016 0%, #1a3009 100%)', 
    color: 'white', 
    border: 'none', 
    borderRadius: 6, 
    cursor: 'pointer', 
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10
  },
  outputHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  outputActions: { display: 'flex', gap: 8 },
  actionBtn: { padding: '6px 12px', background: '#2d5016', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  outputBox: { 
    minHeight: 400, 
    background: '#f8f9fa', 
    borderRadius: 8, 
    padding: 16, 
    border: '1px solid #e9ecef',
    overflow: 'auto'
  },
  outputText: { 
    whiteSpace: 'pre-wrap', 
    fontFamily: 'monospace', 
    fontSize: 13, 
    color: '#333',
    margin: 0
  },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300 },
  spinner: { 
    width: 40, 
    height: 40, 
    border: '4px solid #f3f3f3', 
    borderTop: '4px solid #2d5016', 
    borderRadius: '50%', 
    animation: 'spin 1s linear infinite',
    marginBottom: 16
  },
  placeholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: '#999' },
  placeholderIcon: { fontSize: 48, marginBottom: 16 },
};
