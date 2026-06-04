import React, { useState } from 'react';
import { db, TODAY_DATE } from '../lib/db';
import { UsersRound, Plus, Edit2, Eye, CheckCircle2, Clock, Calendar, FileText, Check, X, RefreshCw } from 'lucide-react';

export default function StaffModule({ activeRole, triggerUpdate }) {
  const [staff, setStaff] = useState(db.getStaff());
  const [attendance, setAttendance] = useState(db.getAttendance());
  const [activeTab, setActiveTab] = useState('roster'); // roster | attendance | payroll
  const [selectedDate, setSelectedDate] = useState(TODAY_DATE); // Default: current day
  const [selectedMonth, setSelectedMonth] = useState('2026-05'); // Default payroll month
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [viewingPayslip, setViewingPayslip] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployeeDetails, setViewingEmployeeDetails] = useState(null);

  // Helper to calculate age dynamically based on reference date 2026-06-03
  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const dobDate = new Date(dobString);
    const refDate = new Date(TODAY_DATE);
    let age = refDate.getFullYear() - dobDate.getFullYear();
    const monthDiff = refDate.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < dobDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  };

  // Roster form fields
  const [rosterForm, setRosterForm] = useState({
    name: '',
    contact: '',
    role: 'Seamstress',
    salary: '',
    join_date: '2026-01-01',
    dob: '',
    religion: '',
    age: '',
    photo: '',
    permanent_address: '',
    gender: 'Female',
    marital_status: 'Single',
    email: '',
    emergency_name: '',
    emergency_address: '',
    emergency_phone: '',
    emergency_relation: '',
    bank_acc_holder: '',
    bank_name: '',
    bank_acc_number: '',
    bank_branch: '',
    bank_passbook_link: ''
  });

  // Log attendance fields for the selected date
  const [attendanceLog, setAttendanceLog] = useState(() => {
    const list = db.getAttendance().filter(a => a.date === TODAY_DATE);
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
      join_date: rosterForm.join_date,
      dob: rosterForm.dob,
      religion: rosterForm.religion,
      age: rosterForm.dob ? calculateAge(rosterForm.dob) : null,
      photo: rosterForm.photo,
      permanent_address: rosterForm.permanent_address,
      gender: rosterForm.gender,
      marital_status: rosterForm.marital_status,
      email: rosterForm.email,
      emergency_name: rosterForm.emergency_name,
      emergency_address: rosterForm.emergency_address,
      emergency_phone: rosterForm.emergency_phone,
      emergency_relation: rosterForm.emergency_relation,
      bank_acc_holder: rosterForm.bank_acc_holder,
      bank_name: rosterForm.bank_name,
      bank_acc_number: rosterForm.bank_acc_number,
      bank_branch: rosterForm.bank_branch,
      bank_passbook_link: rosterForm.bank_passbook_link
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
      join_date: '2026-01-01',
      dob: '',
      religion: '',
      age: '',
      photo: '',
      permanent_address: '',
      gender: 'Female',
      marital_status: 'Single',
      email: '',
      emergency_name: '',
      emergency_address: '',
      emergency_phone: '',
      emergency_relation: '',
      bank_acc_holder: '',
      bank_name: '',
      bank_acc_number: '',
      bank_branch: '',
      bank_passbook_link: ''
    });
    setEditingEmployee(null);
    setShowRosterModal(true);
  };

  const openEditEmployee = (emp) => {
    setRosterForm({
      name: emp.name || '',
      contact: emp.contact || '',
      role: emp.role || 'Seamstress',
      salary: emp.salary || '',
      join_date: emp.join_date || '2026-01-01',
      dob: emp.dob || '',
      religion: emp.religion || '',
      age: emp.dob ? calculateAge(emp.dob).toString() : (emp.age ? emp.age.toString() : ''),
      photo: emp.photo || '',
      permanent_address: emp.permanent_address || '',
      gender: emp.gender || 'Female',
      marital_status: emp.marital_status || 'Single',
      email: emp.email || '',
      emergency_name: emp.emergency_name || '',
      emergency_address: emp.emergency_address || '',
      emergency_phone: emp.emergency_phone || '',
      emergency_relation: emp.emergency_relation || '',
      bank_acc_holder: emp.bank_acc_holder || '',
      bank_name: emp.bank_name || '',
      bank_acc_number: emp.bank_acc_number || '',
      bank_branch: emp.bank_branch || '',
      bank_passbook_link: emp.bank_passbook_link || ''
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

  const getTailorStats = () => {
    const ordersList = db.getOrders();
    const staffList = db.getStaff();
    const refDate = new Date(TODAY_DATE);

    return staffList.map(s => {
      // Filter orders assigned to this staff member and completed or delivered
      const staffOrders = ordersList.filter(o => o.assigned_staff_id === s.id && (o.status === 'completed' || o.status === 'delivered'));

      let dailyCount = 0;
      let weeklyCount = 0;
      let monthlyCount = 0;

      staffOrders.forEach(o => {
        const compDateStr = o.completed_date || o.delivery_date;
        if (!compDateStr) return;
        
        const compDate = new Date(compDateStr);
        const diffTime = refDate - compDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        // Daily (completed today)
        if (compDateStr === TODAY_DATE) {
          dailyCount++;
        }
        // Weekly (completed in last 7 days)
        if (diffDays >= 0 && diffDays <= 7) {
          weeklyCount++;
        }
        // Monthly (completed in last 30 days)
        if (diffDays >= 0 && diffDays <= 30) {
          monthlyCount++;
        }
      });

      return {
        id: s.id,
        name: s.name,
        role: s.role,
        daily: dailyCount,
        weekly: weeklyCount,
        monthly: monthlyCount,
        total: staffOrders.length
      };
    });
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
            <button 
              className={`role-btn ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              Tailor Performance Stats
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
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setViewingEmployeeDetails(emp)} title="View Profile">
                          <Eye size={14} /> View
                        </button>
                        {!isReadOnly && (
                          <button className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openEditEmployee(emp)} title="Edit Profile">
                            <Edit2 size={14} /> Edit
                          </button>
                        )}
                      </div>
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

        {/* Tab 4: Tailor Performance Stats */}
        {activeTab === 'performance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Tailor Workload & Completed Orders</h4>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Tracking completed stitching and alterations orders per tailor across different periods (Daily, Weekly, Monthly).
                </p>
              </div>
              <div style={{ fontSize: '0.8rem', backgroundColor: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 600 }}>
                Reference Date: {TODAY_DATE}
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tailor Details</th>
                    <th>Role / Designation</th>
                    <th style={{ textAlign: 'center' }}>Daily Finished</th>
                    <th style={{ textAlign: 'center' }}>Weekly Finished</th>
                    <th style={{ textAlign: 'center' }}>Monthly Finished</th>
                    <th style={{ textAlign: 'center' }}>Total Completed</th>
                    <th>Weekly Efficiency Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {getTailorStats().map(tailor => {
                    const weeklyTarget = 5;
                    const pct = Math.min(100, Math.round((tailor.weekly / weeklyTarget) * 100));
                    
                    // Determine rating label
                    let rating = 'Standard';
                    let ratingColor = 'var(--text-muted)';
                    if (tailor.weekly >= 5) {
                      rating = 'Highly Productive';
                      ratingColor = 'var(--color-success)';
                    } else if (tailor.weekly >= 3) {
                      rating = 'Good';
                      ratingColor = 'var(--color-primary)';
                    } else if (tailor.total === 0) {
                      rating = 'Inactive';
                      ratingColor = '#cbd5e1';
                    }

                    return (
                      <tr key={tailor.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{tailor.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {tailor.id}</div>
                        </td>
                        <td>
                          <span className="badge info">{tailor.role}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${tailor.daily > 0 ? 'success' : 'secondary'}`} style={{ minWidth: '36px', display: 'inline-block' }}>
                            {tailor.daily}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${tailor.weekly > 2 ? 'success' : tailor.weekly > 0 ? 'warning' : 'secondary'}`} style={{ minWidth: '36px', display: 'inline-block' }}>
                            {tailor.weekly}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${tailor.monthly > 8 ? 'success' : tailor.monthly > 0 ? 'info' : 'secondary'}`} style={{ minWidth: '36px', display: 'inline-block' }}>
                            {tailor.monthly}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>
                          {tailor.total} orders
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem' }}>
                              <span style={{ color: ratingColor === 'var(--text-muted)' ? 'inherit' : ratingColor, fontWeight: 600 }}>{rating}</span>
                              <span style={{ color: 'var(--text-muted)' }}>{pct}% of target</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: ratingColor === 'var(--text-muted)' ? 'var(--color-warning)' : ratingColor, borderRadius: '3px' }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Roster Edit/Add Modal */}
      {showRosterModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h3>{editingEmployee ? 'Edit Staff Profile' : 'Enroll New Staff Member'}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowRosterModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveRoster}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* 1. Personal Details */}
                <div>
                  <h4 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                    1. Personal Details
                  </h4>
                  <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Full Name *</label>
                      <input 
                        type="text"
                        className="form-input"
                        required
                        value={rosterForm.name}
                        onChange={e => setRosterForm({ ...rosterForm, name: e.target.value })}
                        placeholder="e.g. Master Tailor Ali"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select 
                        className="form-select"
                        value={rosterForm.gender}
                        onChange={e => setRosterForm({ ...rosterForm, gender: e.target.value })}
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input 
                        type="date"
                        className="form-input"
                        value={rosterForm.dob}
                        onChange={(e) => {
                          const dob = e.target.value;
                          setRosterForm({ ...rosterForm, dob, age: calculateAge(dob).toString() });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Age (Auto Calculated)</label>
                      <input 
                        type="text"
                        className="form-input"
                        disabled
                        style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', fontWeight: 600 }}
                        value={rosterForm.age || '—'}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Marital Status</label>
                      <select 
                        className="form-select"
                        value={rosterForm.marital_status}
                        onChange={e => setRosterForm({ ...rosterForm, marital_status: e.target.value })}
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Religion</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={rosterForm.religion}
                        onChange={e => setRosterForm({ ...rosterForm, religion: e.target.value })}
                        placeholder="e.g. Buddhism"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={rosterForm.contact}
                        onChange={e => setRosterForm({ ...rosterForm, contact: e.target.value })}
                        placeholder="+94 (77) 123-4567"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input 
                        type="email"
                        className="form-input"
                        value={rosterForm.email}
                        onChange={e => setRosterForm({ ...rosterForm, email: e.target.value })}
                        placeholder="ali@jbgroup.com"
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Photo (Google Drive Link or URL)</label>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <input 
                          type="text"
                          className="form-input"
                          value={rosterForm.photo}
                          onChange={e => setRosterForm({ ...rosterForm, photo: e.target.value })}
                          placeholder="https://drive.google.com/... or image URL"
                          style={{ flex: 1 }}
                        />
                        {rosterForm.photo && (
                          <img 
                            src={rosterForm.photo} 
                            alt="Preview" 
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-light)', flexShrink: 0 }} 
                            onError={(e) => e.target.style.display = 'none'} 
                          />
                        )}
                      </div>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 3' }}>
                      <label className="form-label">Permanent Address</label>
                      <textarea 
                        className="form-textarea"
                        value={rosterForm.permanent_address}
                        onChange={e => setRosterForm({ ...rosterForm, permanent_address: e.target.value })}
                        placeholder="House No, Street, City"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Job Info */}
                <div>
                  <h4 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                    2. Job Details
                  </h4>
                  <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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
                        placeholder="e.g. 75000"
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

                {/* 3. Emergency Contact Details */}
                <div>
                  <h4 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                    3. Emergency Contact Details
                  </h4>
                  <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Contact Person Name</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={rosterForm.emergency_name}
                        onChange={e => setRosterForm({ ...rosterForm, emergency_name: e.target.value })}
                        placeholder="e.g. Fathima Ali"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={rosterForm.emergency_phone}
                        onChange={e => setRosterForm({ ...rosterForm, emergency_phone: e.target.value })}
                        placeholder="+94 (77) 765-4321"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Relationship</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={rosterForm.emergency_relation}
                        onChange={e => setRosterForm({ ...rosterForm, emergency_relation: e.target.value })}
                        placeholder="e.g. Spouse / Mother / Brother"
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 4' }}>
                      <label className="form-label">Emergency Contact Address</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={rosterForm.emergency_address}
                        onChange={e => setRosterForm({ ...rosterForm, emergency_address: e.target.value })}
                        placeholder="Contact address detail"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Bank Details */}
                <div>
                  <h4 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                    4. Bank Account Details
                  </h4>
                  <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                      <label className="form-label">Account Holder Name</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={rosterForm.bank_acc_holder}
                        onChange={e => setRosterForm({ ...rosterForm, bank_acc_holder: e.target.value })}
                        placeholder="Name on passbook"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bank Name</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={rosterForm.bank_name}
                        onChange={e => setRosterForm({ ...rosterForm, bank_name: e.target.value })}
                        placeholder="e.g. Bank of Ceylon"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Account Number</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={rosterForm.bank_acc_number}
                        onChange={e => setRosterForm({ ...rosterForm, bank_acc_number: e.target.value })}
                        placeholder="Bank Account Number"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Branch Name</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={rosterForm.bank_branch}
                        onChange={e => setRosterForm({ ...rosterForm, bank_branch: e.target.value })}
                        placeholder="e.g. Kollupitiya"
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Signed Bank Passbook Photo / Google Drive Link</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={rosterForm.bank_passbook_link}
                        onChange={e => setRosterForm({ ...rosterForm, bank_passbook_link: e.target.value })}
                        placeholder="https://drive.google.com/file/... link"
                      />
                    </div>
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
                This is a computer-generated document requiring no signature. Generated on {TODAY_DATE}.
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn btn-primary" onClick={() => window.print()} style={{ width: '100%' }}>Print Payslip</button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Profile View Modal */}
      {viewingEmployeeDetails && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Staff Member Profile Card</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewingEmployeeDetails(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Header profile section with avatar */}
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', backgroundColor: 'var(--color-primary-light)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                {viewingEmployeeDetails.photo ? (
                  <img 
                    src={viewingEmployeeDetails.photo} 
                    alt={viewingEmployeeDetails.name} 
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--bg-card)', boxShadow: 'var(--shadow-md)' }} 
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div 
                  style={{ 
                    display: viewingEmployeeDetails.photo ? 'none' : 'flex', 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--color-primary)', 
                    color: 'var(--text-inverse)', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '2rem', 
                    fontWeight: 700,
                    boxShadow: 'var(--shadow-md)',
                    border: '3px solid var(--bg-card)'
                  }}
                >
                  {viewingEmployeeDetails.name.charAt(0).toUpperCase()}
                </div>
                
                <div>
                  <h4 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>
                    {viewingEmployeeDetails.name}
                  </h4>
                  <p style={{ margin: '0.25rem 0 0 0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="badge info">{viewingEmployeeDetails.role}</span>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Hired: {viewingEmployeeDetails.join_date}</span>
                  </p>
                </div>
              </div>

              {/* Grid sections */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                
                {/* Personal Details */}
                <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    Personal Information
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Date of Birth:</span>
                      <span style={{ fontWeight: 500 }}>{viewingEmployeeDetails.dob || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Age:</span>
                      <span style={{ fontWeight: 600 }}>
                        {viewingEmployeeDetails.dob ? calculateAge(viewingEmployeeDetails.dob) : (viewingEmployeeDetails.age || '—')} years
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Gender:</span>
                      <span style={{ fontWeight: 500 }}>{viewingEmployeeDetails.gender || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Marital Status:</span>
                      <span style={{ fontWeight: 500 }}>{viewingEmployeeDetails.marital_status || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Religion:</span>
                      <span style={{ fontWeight: 500 }}>{viewingEmployeeDetails.religion || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                      <span style={{ fontWeight: 600 }}>{viewingEmployeeDetails.contact || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                      <span style={{ fontWeight: 500, wordBreak: 'break-all' }}>{viewingEmployeeDetails.email || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)', marginBottom: '0.125rem' }}>Permanent Address:</span>
                      <span style={{ fontWeight: 500, lineHeight: 1.4 }}>{viewingEmployeeDetails.permanent_address || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Job & Salary & Leave Balances */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      Employment Details
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Role:</span>
                        <span className="badge info" style={{ padding: '0.125rem 0.5rem' }}>{viewingEmployeeDetails.role || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Basic Salary:</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Rs. {Number(viewingEmployeeDetails.salary || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Sick Leaves Left:</span>
                        <span style={{ fontWeight: 500 }}>{viewingEmployeeDetails.leaves?.sick ?? 12} days</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Casual Leaves Left:</span>
                        <span style={{ fontWeight: 500 }}>{viewingEmployeeDetails.leaves?.casual ?? 12} days</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Vacation Leaves Left:</span>
                        <span style={{ fontWeight: 500 }}>{viewingEmployeeDetails.leaves?.vacation ?? 15} days</span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      Emergency Contact Details
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Name:</span>
                        <span style={{ fontWeight: 600 }}>{viewingEmployeeDetails.emergency_name || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                        <span style={{ fontWeight: 600 }}>{viewingEmployeeDetails.emergency_phone || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Relationship:</span>
                        <span style={{ fontWeight: 500 }}>{viewingEmployeeDetails.emergency_relation || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Address:</span>
                        <span style={{ fontWeight: 500 }}>{viewingEmployeeDetails.emergency_address || '—'}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bank Account Section */}
              <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  Bank Details
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>ACC HOLDER</span>
                    <span style={{ fontWeight: 500 }}>{viewingEmployeeDetails.bank_acc_holder || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>BANK</span>
                    <span style={{ fontWeight: 500 }}>{viewingEmployeeDetails.bank_name || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>ACCOUNT NO</span>
                    <span style={{ fontWeight: 600 }}>{viewingEmployeeDetails.bank_acc_number || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>BRANCH</span>
                    <span style={{ fontWeight: 500 }}>{viewingEmployeeDetails.bank_branch || '—'}</span>
                  </div>
                </div>

                {viewingEmployeeDetails.bank_passbook_link && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Signed Bank Passbook Photo Link:</span>
                    <a 
                      href={viewingEmployeeDetails.bank_passbook_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ textDecoration: 'none', color: 'var(--color-primary)', fontWeight: 600 }}
                    >
                      Open Google Drive / Passbook Link
                    </a>
                  </div>
                )}
              </div>

            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setViewingEmployeeDetails(null)}>Close Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
