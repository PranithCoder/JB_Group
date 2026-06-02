import React, { useState } from 'react';
import { db } from '../lib/db';
import { UsersRound, Plus, Edit2, CheckCircle2, Clock, Calendar, FileText, Check, X, RefreshCw } from 'lucide-react';

export default function StaffModule({ activeRole, triggerUpdate }) {
  const [staff, setStaff] = useState(db.getStaff());
  const [attendance, setAttendance] = useState(db.getAttendance());
  const [activeTab, setActiveTab] = useState('roster'); // roster | attendance | payroll
  const [selectedDate, setSelectedDate] = useState('2026-06-01'); // Default: current day
  const [selectedMonth, setSelectedMonth] = useState('2026-05'); // Default payroll month
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [viewingPayslip, setViewingPayslip] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Roster form fields
  const [rosterForm, setRosterForm] = useState({
    name: '',
    contact: '',
    role: 'Seamstress',
    salary: '',
    join_date: '2026-01-01'
  });

  // Log attendance fields for the selected date
  const [attendanceLog, setAttendanceLog] = useState(() => {
    const list = db.getAttendance().filter(a => a.date === '2026-06-01');
    const initialMap = {};
    db.getStaff().forEach(s => {
      const match = list.find(l => l.staff_id === s.id);
      initialMap[s.id] = {
        hours_worked: match ? match.hours_worked : 8,
        status: match ? match.status : 'Present',
        leave_type: match ? match.leave_type : ''
      };
    });
    return initialMap;
  });

  const refreshData = () => {
    const currentStaff = db.getStaff();
    setStaff(currentStaff);
    const allAttendance = db.getAttendance();
    setAttendance(allAttendance);

    // Sync attendance log map
    const list = allAttendance.filter(a => a.date === selectedDate);
    const newMap = {};
    currentStaff.forEach(s => {
      const match = list.find(l => l.staff_id === s.id);
      newMap[s.id] = {
        hours_worked: match ? match.hours_worked : 8,
        status: match ? match.status : 'Present',
        leave_type: match ? match.leave_type : ''
      };
    });
    setAttendanceLog(newMap);
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    const list = db.getAttendance().filter(a => a.date === date);
    const newMap = {};
    staff.forEach(s => {
      const match = list.find(l => l.staff_id === s.id);
      newMap[s.id] = {
        hours_worked: match ? match.hours_worked : 8,
        status: match ? match.status : 'Present',
        leave_type: match ? match.leave_type : ''
      };
    });
    setAttendanceLog(newMap);
  };

  const saveRoster = (e) => {
    e.preventDefault();
    if (!rosterForm.name || !rosterForm.salary) {
      alert('Required fields missing.');
      return;
    }
    db.saveStaff({
      ...(editingEmployee ? { id: editingEmployee.id } : {}),
      name: rosterForm.name,
      contact: rosterForm.contact,
      role: rosterForm.role,
      salary: Number(rosterForm.salary),
      join_date: rosterForm.join_date
    });
    setShowRosterModal(false);
    refreshData();
    triggerUpdate();
  };

  const openAddEmployee = () => {
    setRosterForm({
      name: '',
      contact: '',
      role: 'Seamstress',
      salary: '',
      join_date: '2026-01-01'
    });
    setEditingEmployee(null);
    setShowRosterModal(true);
  };

  const openEditEmployee = (emp) => {
    setRosterForm({
      name: emp.name,
      contact: emp.contact,
      role: emp.role,
      salary: emp.salary,
      join_date: emp.join_date
    });
    setEditingEmployee(emp);
    setShowRosterModal(true);
  };

  const handleAttendanceChange = (staffId, field, value) => {
    setAttendanceLog(prev => {
      const updatedItem = { ...prev[staffId], [field]: value };
      
      // Auto-set status or hours
      if (field === 'hours_worked') {
        const hours = Number(value);
        updatedItem.status = hours > 0 ? 'Present' : 'Absent';
        if (hours > 0) updatedItem.leave_type = '';
      }
      
      if (field === 'status') {
        if (value === 'Absent') {
          updatedItem.hours_worked = 0;
          updatedItem.leave_type = 'sick'; // Default leave tag
        } else {
          updatedItem.hours_worked = 8;
          updatedItem.leave_type = '';
        }
      }

      return { ...prev, [staffId]: updatedItem };
    });
  };

  const submitAttendance = () => {
    let successCount = 0;
    Object.keys(attendanceLog).forEach(staffId => {
      const log = attendanceLog[staffId];
      db.saveAttendance({
        staff_id: staffId,
        date: selectedDate,
        hours_worked: Number(log.hours_worked),
        status: log.status,
        leave_type: log.status === 'Absent' ? log.leave_type : ''
      });
      successCount++;
    });
    alert(`Successfully logged attendance for ${successCount} employees on ${selectedDate}.`);
    refreshData();
    triggerUpdate();
  };

  const calculatedPayroll = db.generateMonthlyPayroll(selectedMonth);
  const isReadOnly = activeRole === 'boss';

  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <UsersRound style={{ color: 'var(--color-primary)' }} size={20} />
          Staff, Attendance & Payroll System
        </h3>
        {activeTab === 'roster' && !isReadOnly && (
          <button className="btn btn-primary btn-sm" onClick={openAddEmployee}>
            <Plus size={16} /> Enroll Staff
          </button>
        )}
      </div>

      <div className="card-body">
        {/* Tab Buttons */}
        <div className="toolbar" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button 
              className={`role-btn ${activeTab === 'roster' ? 'active' : ''}`}
              onClick={() => setActiveTab('roster')}
            >
              Roster & Leave Balances
            </button>
            <button 
              className={`role-btn ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              Daily Clock-In Tracker
            </button>
            <button 
              className={`role-btn ${activeTab === 'payroll' ? 'active' : ''}`}
              onClick={() => setActiveTab('payroll')}
            >
              Month-End Payroll Sheets
            </button>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={refreshData}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Tab 1: Staff Roster */}
        {activeTab === 'roster' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation / Role</th>
                  <th>Join Date</th>
                  <th>Monthly Salary</th>
                  <th>Sick Leaves Taken</th>
                  <th>Casual Leaves Taken</th>
                  <th>Vacation Leaves Taken</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{emp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.contact}</div>
                    </td>
                    <td>
                      <span className="badge info">{emp.role}</span>
                    </td>
                    <td>{emp.join_date}</td>
                    <td style={{ fontWeight: 600 }}>Rs. {Number(emp.salary || 0).toFixed(2)}</td>
                    <td>{attendance.filter(a => a.staff_id === emp.id && a.status === 'Absent' && a.leave_type === 'sick').length} days</td>
                    <td>{attendance.filter(a => a.staff_id === emp.id && a.status === 'Absent' && a.leave_type === 'casual').length} days</td>
                    <td>{attendance.filter(a => a.staff_id === emp.id && a.status === 'Absent' && a.leave_type === 'vacation').length} days</td>
                    <td>
                      {!isReadOnly ? (
                        <button className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openEditEmployee(emp)}>
                          <Edit2 size={14} /> Edit
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Attendance Logger */}
        {activeTab === 'attendance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ width: '220px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Log Date For Roster</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={selectedDate}
                  onChange={handleDateChange}
                />
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
                Select a date above to input hours. The system automatically marks "Absent" if hours are zero.
              </p>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Role</th>
                    <th>Hours Worked</th>
                    <th>Attendance Status</th>
                    <th>Leave Tag (if Absent)</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(emp => {
                    const log = attendanceLog[emp.id] || { hours_worked: 8, status: 'Present', leave_type: '' };
                    return (
                      <tr key={emp.id}>
                        <td style={{ fontWeight: 600 }}>{emp.name}</td>
                        <td><span className="badge info">{emp.role}</span></td>
                        <td>
                          <input 
                            type="number"
                            min="0"
                            max="16"
                            disabled={isReadOnly}
                            className="form-input"
                            style={{ width: '80px', padding: '0.375rem 0.5rem' }}
                            value={log.hours_worked}
                            onChange={e => handleAttendanceChange(emp.id, 'hours_worked', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className="form-select"
                            disabled={isReadOnly}
                            style={{ width: '120px', padding: '0.375rem 0.5rem' }}
                            value={log.status}
                            onChange={e => handleAttendanceChange(emp.id, 'status', e.target.value)}
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                          </select>
                        </td>
                        <td>
                          {log.status === 'Absent' ? (
                            <select
                              className="form-select"
                              disabled={isReadOnly}
                              style={{ width: '160px', padding: '0.375rem 0.5rem' }}
                              value={log.leave_type}
                              onChange={e => handleAttendanceChange(emp.id, 'leave_type', e.target.value)}
                            >
                              <option value="sick">Sick Leave</option>
                              <option value="casual">Casual Leave</option>
                              <option value="vacation">Vacation Leave</option>
                              <option value="">Unpaid Leave (No tag)</option>
                            </select>
                          ) : (
                            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Present</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!isReadOnly && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={submitAttendance}>
                  <CheckCircle2 size={16} /> Save Attendance Roster
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Payroll calculations */}
        {activeTab === 'payroll' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ width: '220px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Select Payroll Month</label>
                <input 
                  type="month" 
                  className="form-input"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                />
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
                Formula: Basic Salary / 240 hrs base. Overtime hours are compensated at 1.5x hourly rate. Unpaid absences deduct daily salary.
              </p>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Basic Salary</th>
                    <th>Total Hours</th>
                    <th>Overtime Hrs</th>
                    <th>Present / Absent Days</th>
                    <th>Deductions</th>
                    <th>Net Calculated Pay</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedPayroll.map(sheet => (
                    <tr key={sheet.staff_id}>
                      <td style={{ fontWeight: 600 }}>
                        <div>{sheet.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sheet.role}</div>
                      </td>
                      <td>Rs. {Number(sheet.basic_salary || 0).toFixed(2)}</td>
                      <td>{sheet.total_hours} hrs</td>
                      <td>
                        <span className={sheet.overtime_hours > 0 ? 'text-green' : ''} style={{ fontWeight: sheet.overtime_hours > 0 ? '600' : 'normal' }}>
                          {sheet.overtime_hours} hrs
                        </span>
                      </td>
                      <td>
                        <span className="text-green">{sheet.days_present} present</span> / <span className="text-red">{sheet.days_absent} absent</span>
                      </td>
                      <td className={sheet.deductions > 0 ? 'text-red' : ''}>-Rs. {Number(sheet.deductions || 0).toFixed(2)}</td>
  <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Rs. {Number(sheet.net_pay || 0).toFixed(2)}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => setViewingPayslip(sheet)}>
                          <FileText size={14} /> View Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Roster Edit/Add Modal */}
      {showRosterModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingEmployee ? 'Edit Staff Profile' : 'Enroll New Staff Member'}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowRosterModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveRoster}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Employee Name *</label>
                    <input 
                      type="text"
                      className="form-input"
                      required
                      value={rosterForm.name}
                      onChange={e => setRosterForm({ ...rosterForm, name: e.target.value })}
                      placeholder="e.g. Master Ali"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Details</label>
                    <input 
                      type="text"
                      className="form-input"
                      value={rosterForm.contact}
                      onChange={e => setRosterForm({ ...rosterForm, contact: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation / Role</label>
                    <select 
                      className="form-select"
                      value={rosterForm.role}
                      onChange={e => setRosterForm({ ...rosterForm, role: e.target.value })}
                    >
                      <option value="Master Tailor">Master Tailor</option>
                      <option value="Seamstress">Seamstress</option>
                      <option value="Apprentice Stitcher">Apprentice Stitcher</option>
                      <option value="Store Assistant">Store Assistant</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Basic Salary (LKR) *</label>
                    <input 
                      type="number"
                      className="form-input"
                      required
                      value={rosterForm.salary}
                      onChange={e => setRosterForm({ ...rosterForm, salary: e.target.value })}
                      placeholder="e.g. 1000"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Hire</label>
                    <input 
                      type="date"
                      className="form-input"
                      value={rosterForm.join_date}
                      onChange={e => setRosterForm({ ...rosterForm, join_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRosterModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Enrollment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip View Modal */}
      {viewingPayslip && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>JB GROUPS - OFFICIAL PAYSLIP</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewingPayslip(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>JB Groups Tailor Shop</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Statement of Earnings • Period: {selectedMonth}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', borderBottom: '1px dashed var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Employee Name:</span>
                  <span style={{ fontWeight: 600 }}>{viewingPayslip.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Designation:</span>
                  <span style={{ fontWeight: 600 }}>{viewingPayslip.role}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Basic Month Salary:</span>
                  <span style={{ fontWeight: 600 }}>Rs. {Number(viewingPayslip.basic_salary || 0).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', borderBottom: '1px dashed var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Hours Logged:</span>
                  <span>{viewingPayslip.total_hours} hrs</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Overtime Premium:</span>
                  <span className="text-green">+Rs. {(Number(viewingPayslip.overtime_hours * (viewingPayslip.basic_salary / 240) * 1.5 || 0)).toFixed(2)} ({viewingPayslip.overtime_hours}h)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Leave Deductions:</span>
                  <span className="text-red">-Rs. {Number(viewingPayslip.deductions || 0).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                <span>Net Salary Payable:</span>
                <span>Rs. {Number(viewingPayslip.net_pay || 0).toFixed(2)}</span>
              </div>

              <div style={{ marginTop: '2rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                This is a computer-generated document requiring no signature. Generated on 2026-06-01.
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn btn-primary" onClick={() => window.print()} style={{ width: '100%' }}>Print Payslip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
