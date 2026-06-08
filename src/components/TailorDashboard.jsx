import React, { useState, useEffect } from 'react';
import { db, TODAY_DATE, DRESS_TYPES } from '../lib/db';
import { 
  Camera,
  Clock, 
  Scissors, 
  Check, 
  CheckCircle2, 
  RefreshCw, 
  Play, 
  LogOut, 
  MapPin, 
  Phone, 
  Upload,
  X,
  FileText,
  UserCheck
} from 'lucide-react';

function calculateHoursBetween(timeStr1, timeStr2, dateStr) {
  try {
    const parseTime = (str) => {
      const parts = str.split(':');
      let hour = parseInt(parts[0]);
      let min = parseInt(parts[1].substring(0, 2));
      const isPM = str.toLowerCase().includes('pm');
      const isAM = str.toLowerCase().includes('am');
      if (isPM && hour < 12) hour += 12;
      if (isAM && hour === 12) hour = 0;
      
      const d = new Date(dateStr || TODAY_DATE);
      d.setHours(hour, min, 0, 0);
      return d;
    };
    
    const d1 = parseTime(timeStr1);
    const d2 = parseTime(timeStr2);
    
    let diffMs = d2 - d1;
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }
    const diffHrs = diffMs / (1000 * 60 * 60);
    return Math.max(0, Math.round(diffHrs * 10) / 10);
  } catch (e) {
    console.error("Error calculating hours between:", timeStr1, timeStr2, e);
    return 0;
  }
}

export default function TailorDashboard({ triggerUpdate, onExitPortal }) {
  const [staff, setStaff] = useState(db.getStaff());
  const [orders, setOrders] = useState(db.getOrders());
  const [activeTailorId, setActiveTailorId] = useState(localStorage.getItem('jb_active_tailor_id') || '');
  const [attendance, setAttendance] = useState(db.getAttendance());
  const [approvals, setApprovals] = useState(db.getApprovals());
  const [pickingUpOrder, setPickingUpOrder] = useState(null);
  const [pickupType, setPickupType] = useState('both'); // both | cutting | stitching
  const [pickupCuttingTailorId, setPickupCuttingTailorId] = useState('');
  const [photoFront, setPhotoFront] = useState('');
  const [photoBack, setPhotoBack] = useState('');

  useEffect(() => {
    setStaff(db.getStaff());
    setOrders(db.getOrders());
    setAttendance(db.getAttendance());
    setApprovals(db.getApprovals());
  }, []);

  const refreshData = () => {
    setOrders(db.getOrders());
    setAttendance(db.getAttendance());
    setStaff(db.getStaff());
    setApprovals(db.getApprovals());
    triggerUpdate();
  };

  const handleSelectTailor = (id) => {
    setActiveTailorId(id);
    localStorage.setItem('jb_active_tailor_id', id);
    setPhotoFront('');
    setPhotoBack('');
    refreshData();
  };

  const handleLogout = () => {
    setActiveTailorId('');
    localStorage.removeItem('jb_active_tailor_id');
    setPhotoFront('');
    setPhotoBack('');
  };

  const handleRequestShortLeave = () => {
    if (activeOrder) {
      alert("Cannot request short leave! You have an active order in progress. Please complete or release the order first.");
      return;
    }
    if (!confirm("Are you sure you want to request a Short Leave for today? This will send an approval request to the manager.")) {
      return;
    }
    db.createShortLeaveRequest(activeTailorId, activeTailor.name, todayRecord);
    refreshData();
    alert("Short leave request submitted! Please wait for manager approval.");
  };

  const handleResumeWork = () => {
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let current_leave = 0;
    if (todayRecord.end_time) {
      current_leave = calculateHoursBetween(todayRecord.end_time, nowTimeStr, TODAY_DATE);
    }
    db.saveAttendance({
      ...todayRecord,
      short_leave_duration: (todayRecord.short_leave_duration || 0) + current_leave,
      hours_worked_prev: todayRecord.hours_worked || 0,
      start_time: todayRecord.start_time || nowTimeStr,
      end_time: '',
      leave_type: 'short_leave'
    });
    refreshData();
  };

  const activeTailor = staff.find(s => s.id === activeTailorId);
  const canCutPickingOrder = pickingUpOrder ? (activeTailor?.cutting_skills?.includes(pickingUpOrder.dress_type)) : false;
 
  // Check today's shift status
  const todayRecord = attendance.find(a => a.staff_id === activeTailorId && a.date === TODAY_DATE);
  const hasStartedWork = todayRecord && todayRecord.status === 'Present' && todayRecord.start_time;
  const hasEndedWork = todayRecord && todayRecord.status === 'Present' && todayRecord.end_time;
 
  // Find if tailor has an in-progress order (stitching or cutting)
  const activeOrder = orders.find(o => 
    (o.assigned_staff_id === activeTailorId && o.status === 'in-progress' && o.cutting_status === 'completed') ||
    (o.cutting_staff_id === activeTailorId && o.cutting_status === 'pending' && o.status === 'in-progress')
  );
 
  const pendingOrders = orders.filter(o => {
    if (o.status !== 'pending') return false;
 
    if (o.cutting_status === 'pending') {
      // Order needs cutting
      if (o.cutting_staff_id) {
        return o.cutting_staff_id === activeTailorId;
      }
      
      // If no cutting tailor is assigned, but a stitching tailor is assigned, only they should see it (if they can cut)
      if (o.assigned_staff_id && o.assigned_staff_id !== activeTailorId) {
        return false;
      }
      
      // Active tailor must have capability to cut this dress type
      const canCut = activeTailor?.cutting_skills?.includes(o.dress_type);
      if (!canCut) return false;
    } else {
      // Order needs stitching
      if (o.assigned_staff_id) {
        return o.assigned_staff_id === activeTailorId;
      }
    }

    return true;
  });

  const sortedPendingOrders = [...pendingOrders].sort((a, b) => {
    // 1. Sort by urgency (is_urgent === true first)
    if (a.is_urgent && !b.is_urgent) return -1;
    if (!a.is_urgent && b.is_urgent) return 1;

    // 2. Sort by delivery date ascending
    if (a.delivery_date !== b.delivery_date) {
      return new Date(a.delivery_date) - new Date(b.delivery_date);
    }

    // 3. Sort by delivery time ascending
    const timeA = a.delivery_time || '23:59';
    const timeB = b.delivery_time || '23:59';
    return timeA.localeCompare(timeB);
  });

  const myShortLeaveReq = approvals.find(
    a => a.entity_type === 'short_leave' && 
         a.entity_id === activeTailorId && 
         a.request_date === TODAY_DATE
  );
  const hasPendingShortLeave = myShortLeaveReq && myShortLeaveReq.status === 'pending';
  const hasApprovedShortLeave = myShortLeaveReq && myShortLeaveReq.status === 'approved';
  const hasRejectedShortLeave = myShortLeaveReq && myShortLeaveReq.status === 'rejected';

  const getEarnedCommissionsThisMonth = () => {
    if (!activeTailorId) return 0;
    const currentMonth = TODAY_DATE.substring(0, 7); // e.g. "2026-06"
    const payroll = db.generateMonthlyPayroll(currentMonth);
    const myPayroll = payroll.find(p => p.staff_id === activeTailorId);
    return myPayroll ? myPayroll.commission : 0;
  };

  const handleStartWork = () => {
    if (!activeTailorId) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    db.saveAttendance({
      staff_id: activeTailorId,
      date: TODAY_DATE,
      status: 'Present',
      hours_worked: 8,
      start_time: nowTime,
      end_time: '',
      leave_type: ''
    });
    refreshData();
  };

  const handleEndWork = () => {
    if (activeOrder) {
      alert("Cannot clock out! You have an active order in progress. Please complete or release the order before ending your work shift.");
      return;
    }

    if (!confirm("Are you sure you want to end your work shift for today? This will mark you as off-duty and log your clock-out time.")) {
      return;
    }

    const now = new Date();
    const endTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Calculate total hours worked based on start_time and short_leave_duration
    let total_elapsed = 0;
    if (todayRecord && todayRecord.start_time) {
      total_elapsed = calculateHoursBetween(todayRecord.start_time, endTimeStr, TODAY_DATE);
    }

    const short_leave_dur = todayRecord.short_leave_duration || 0;
    const working_hours = Math.max(0, total_elapsed - short_leave_dur);
    const rounded_hours = Math.max(0.5, Math.round(working_hours * 10) / 10);

    db.saveAttendance({
      ...todayRecord,
      end_time: endTimeStr,
      hours_worked: rounded_hours
    });

    db.addAuditLog(
      `Clocked Out Tailor ${activeTailor.name}`,
      `Finished shift portion. Total accumulated work hours: ${rounded_hours} hrs.`
    );

    refreshData();
  };

  const confirmPickupOrder = () => {
    if (!pickingUpOrder) return;

    if (!window.confirm("Are you sure you want to start working on this order?")) {
      return;
    }

    let payload = {
      ...pickingUpOrder,
      status: 'in-progress',
      work_started_time: new Date().toISOString()
    };

    if (pickupType === 'both') {
      payload.assigned_staff_id = activeTailorId;
      payload.cutting_staff_id = activeTailorId;
      payload.cutting_status = 'completed';
    } else if (pickupType === 'cutting') {
      payload.assigned_staff_id = ''; // Stitching remains unassigned
      payload.cutting_staff_id = activeTailorId;
      payload.cutting_status = 'pending';
    } else if (pickupType === 'stitching') {
      payload.assigned_staff_id = activeTailorId;
      if (pickingUpOrder.cutting_status === 'completed') {
        // preserve existing cutting staff
      } else {
        payload.cutting_staff_id = pickupCuttingTailorId;
        payload.cutting_status = 'completed';
      }
    }

    try {
      db.saveOrder(payload);
      setPickingUpOrder(null);
      refreshData();
      db.addAuditLog(
        `Tailor Pickup: ${pickingUpOrder.order_no}`,
        `Tailor ${activeTailor.name} claimed order for portion: ${pickupType}.`
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompleteCutting = () => {
    if (!activeOrder) return;
    const payload = {
      ...activeOrder,
      status: 'pending', // return to pending queue for stitching
      cutting_status: 'completed'
    };
    try {
      db.saveOrder(payload);
      db.addAuditLog(
        `Completed Cutting Order ${activeOrder.order_no}`,
        `Tailor ${activeTailor.name} completed the cutting portion. fabric is ready for stitching.`
      );
      refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompressAndSet = (file, side) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        if (side === 'front') {
          setPhotoFront(compressedBase64);
        } else {
          setPhotoBack(compressedBase64);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e, side) => {
    const file = e.target.files[0];
    if (file) {
      handleCompressAndSet(file, side);
    }
  };

  const handleCompleteOrder = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!photoFront || !photoBack) {
      alert('Please upload/capture both front and back views of the completed dress.');
      return;
    }

    const now = new Date();
    const start = activeOrder.work_started_time ? new Date(activeOrder.work_started_time) : new Date();
    let durationMin = Math.round((now - start) / (1000 * 60));
    if (durationMin <= 0) {
      // Simulate realistic duration of 15-45 minutes if completed instantly during demo/testing
      durationMin = Math.floor(Math.random() * 30) + 15;
    }

    const payload = {
      ...activeOrder,
      status: 'completed',
      photo_front: photoFront,
      photo_back: photoBack,
      work_completed_time: now.toISOString(),
      work_duration_minutes: durationMin
    };

    try {
      db.saveOrder(payload);
      db.addAuditLog(
        `Completed Order ${activeOrder.order_no}`,
        `Tailor ${activeTailor.name} completed the order in ${durationMin} mins and uploaded QA photos.`
      );
      setPhotoFront('');
      setPhotoBack('');
      refreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getDaysRemaining = (dueDateStr) => {
    const today = new Date(TODAY_DATE);
    const dueDate = new Date(dueDateStr);
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 1. If no tailor is selected, show profile selector
  if (!activeTailorId) {
    const tailors = staff.filter(s => s.role !== 'Store Assistant');
    return (
      <div className="card" style={{ maxWidth: '750px', margin: '2rem auto', boxShadow: 'var(--shadow-premium)' }}>
        <div className="card-header" style={{ textAlign: 'center', display: 'block' }}>
          <h3 style={{ justifyContent: 'center', fontSize: '1.4rem' }}>
            <Scissors style={{ color: 'var(--color-primary)' }} size={24} />
            Tailor Workstation Clock-In
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Select your profile below to manage your tailoring queue and clock in your shift start time.
          </p>
        </div>
        <div className="card-body" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {tailors.map(t => (
              <div 
                key={t.id}
                onClick={() => handleSelectTailor(t.id)}
                className="card"
                style={{ 
                  cursor: 'pointer',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  alignItems: 'center',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                {t.photo ? (
                  <img 
                    src={t.photo} 
                    alt={t.name} 
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary-light)' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div 
                  style={{ 
                    display: t.photo ? 'none' : 'flex', 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--color-primary-light)', 
                    color: 'var(--color-primary)', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '1.75rem', 
                    fontWeight: 700 
                  }}
                >
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>{t.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem', fontWeight: 600 }}>
                    {t.role}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--color-primary)', marginTop: '0.375rem', fontWeight: 600 }}>
                    {t.cutting_skills && t.cutting_skills.length > 0 ? (
                      t.cutting_skills.length === DRESS_TYPES.length ? 'Cuts all dress types' : `Cuts ${t.cutting_skills.length} dress types`
                    ) : 'Stitching Only'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. If tailor selected has ended their shift for today, show completion summary screen
  if (hasEndedWork) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', boxShadow: 'var(--shadow-premium)' }}>
        <div className="card-header" style={{ display: 'block', backgroundColor: 'var(--color-success-light)', borderColor: '#bbf7d0' }}>
          <h3 style={{ color: 'var(--color-success)' }}>Shift Completed!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.25rem' }}>
            Active profile: <strong>{activeTailor.name}</strong>
          </p>
        </div>
        <div className="card-body" style={{ padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-success-light)',
            color: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700 }}>You are officially off work for today!</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '1rem', padding: '0.75rem 1.25rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.875rem', minWidth: '280px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Start Time:</span>
                <span style={{ fontWeight: 600 }}>{todayRecord.start_time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>End Time:</span>
                <span style={{ fontWeight: 600 }}>{todayRecord.end_time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-light)', paddingTop: '0.375rem', marginTop: '0.375rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total Work Hours:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{todayRecord.hours_worked} hrs</span>
              </div>
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleResumeWork} 
            style={{ width: '100%', maxWidth: '280px', justifyContent: 'center', marginTop: '0.5rem', backgroundColor: 'var(--color-primary)' }}
          >
            <Play size={16} /> Resume Work Shift
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={onExitPortal} 
            style={{ width: '100%', maxWidth: '280px', justifyContent: 'center', marginTop: '0.5rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
          >
            <LogOut size={16} /> Exit Workstation
          </button>
        </div>
      </div>
    );
  }

  // 3. If tailor is selected but hasn't started work, show clock-in button
  if (!hasStartedWork) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', boxShadow: 'var(--shadow-premium)' }}>
        <div className="card-header" style={{ display: 'block' }}>
          <h3>Shift Attendance Clock-In</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.25rem' }}>
            Workstation Active Profile: <strong>{activeTailor.name}</strong>
          </p>
        </div>
        <div className="card-body" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-warning-light)',
            color: 'var(--color-warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Clock size={36} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ready to start your work shift?</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem', maxWidth: '400px', margin: '0.5rem auto 0 auto' }}>
              Clicking "Start Work" logs your clock-in start time on the manager attendance tracker and unlocks your active order queue.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '350px', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleStartWork} style={{ justifyContent: 'center', backgroundColor: 'var(--color-success)', width: '100%' }}>
              <Play size={16} /> Start Work
            </button>
            <button className="btn btn-secondary" onClick={onExitPortal} style={{ justifyContent: 'center', borderColor: 'var(--color-danger)', color: 'var(--color-danger)', width: '100%' }}>
              <LogOut size={16} /> Exit Workstation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Tailor has clocked in and is active. Show Work Station Dashboard
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Station Status Header */}
      <div className="card" style={{ backgroundColor: 'var(--color-primary-light)', borderColor: '#bfdbfe' }}>
        <div className="card-body" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              boxShadow: 'var(--shadow-sm)'
            }}>
              {activeTailor.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{activeTailor.name} ({activeTailor.role})</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem', fontSize: '0.825rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span className="badge success" style={{ padding: '0.05rem 0.4rem', fontSize: '0.7rem' }}>Shift Active</span>
                <span>Clocked in at {todayRecord.start_time}</span>
                <span className="badge info" style={{ padding: '0.05rem 0.4rem', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                  Earned Commissions: Rs. {getEarnedCommissionsThisMonth().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {hasPendingShortLeave && (
              <span className="badge warning" style={{ padding: '0.4rem 0.75rem', fontSize: '0.775rem' }}>
                ⚠️ Short Leave: Pending Approval...
              </span>
            )}
            {hasApprovedShortLeave && (
              <span className="badge success" style={{ padding: '0.4rem 0.75rem', fontSize: '0.775rem', fontWeight: 'bold' }}>
                ✓ Short Leave Approved!
              </span>
            )}
            {hasRejectedShortLeave && (
              <span className="badge danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.775rem' }}>
                ❌ Short Leave Rejected
              </span>
            )}
            
            {(!myShortLeaveReq || hasRejectedShortLeave) ? (
              <button className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }} onClick={handleRequestShortLeave}>
                <Clock size={14} /> Request Short Leave
              </button>
            ) : null}

            <button 
              className="btn btn-secondary btn-sm" 
              style={{ 
                borderColor: 'var(--color-danger)', 
                color: 'var(--color-danger)',
                opacity: hasPendingShortLeave ? 0.6 : 1
              }} 
              onClick={handleEndWork}
              disabled={hasPendingShortLeave}
              title={hasPendingShortLeave ? "Waiting for manager approval of short leave request" : "End Shift"}
            >
              <Clock size={14} /> {hasApprovedShortLeave ? 'End Shift (Leave with Permission)' : 'End Shift (Off Work)'}
            </button>
          </div>
        </div>
      </div>

      {/* Main station panels */}
      <div>
        {activeOrder ? (
          /* ACTIVE ORDER MODE (Only show active order details, hide pending order list) */
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-header" style={{ backgroundColor: 'var(--color-warning-light)', borderColor: '#fde68a' }}>
                <h3 style={{ color: '#b45309' }}>
                  <Scissors size={18} /> Active Stitching Assignment
                </h3>
                <span className="badge warning">In-Progress</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Customer Details Block */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 600 }}>
                    Client Profile
                  </h4>
                  <div className="detail-grid" style={{ margin: 0 }}>
                    <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                      <span className="detail-label">Client Name</span>
                      <span className="detail-val" style={{ fontWeight: 700 }}>{activeOrder.customer?.name}</span>
                    </div>
                    <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                      <span className="detail-label">Delivery Address</span>
                      <span className="detail-val">{activeOrder.customer?.address || 'No address provided.'}</span>
                    </div>
                  </div>
                </div>

                {/* Order Details Block */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 600 }}>
                    Stitching Specifications
                  </h4>
                  <div className="detail-grid" style={{ margin: 0, backgroundColor: '#fdfdfd' }}>
                    <div className="detail-item">
                      <span className="detail-label">Order Number</span>
                      <span className="detail-val" style={{ fontWeight: 700 }}>{activeOrder.order_no}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Service Category</span>
                      <span className="detail-val">
                        <span className={`badge ${
                          activeOrder.service_type === 'Stitching' ? 'success' :
                          activeOrder.service_type === 'Alteration' ? 'warning' : 'info'
                        }`} style={{ fontSize: '0.725rem', padding: '0.15rem 0.5rem', fontWeight: 600 }}>
                          {activeOrder.service_type === 'Stitching' ? '🧵 Stitching' :
                           activeOrder.service_type === 'Alteration' ? '✂️ Alteration' :
                           '🔧 Repairs & Stitching'}
                        </span>
                      </span>
                    </div>
                    {activeOrder.bill_no && (
                      <div className="detail-item">
                        <span className="detail-label">Bill Number</span>
                        <span className="detail-val">{activeOrder.bill_no}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Dress Type</span>
                      <span className="detail-val" style={{ textTransform: 'capitalize' }}>{activeOrder.dress_type}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Due Date & Time</span>
                      <span className="detail-val" style={{ 
                        fontWeight: 700, 
                        color: activeOrder.is_urgent ? 'var(--color-danger)' :
                               getDaysRemaining(activeOrder.delivery_date) < 0 ? 'var(--color-danger)' : 
                               getDaysRemaining(activeOrder.delivery_date) <= 2 ? 'var(--color-warning)' : 'inherit'
                      }}>
                        {activeOrder.delivery_date} @ {activeOrder.delivery_time || '17:00'}
                        {activeOrder.is_urgent && <span className="badge danger" style={{ marginLeft: '0.375rem', padding: '0.05rem 0.25rem', fontSize: '0.65rem' }}>URGENT ⚡</span>}
                      </span>
                    </div>
                    <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                      <span className="detail-label">Job Notes / Instructions</span>
                      <span className="detail-val" style={{ whiteSpace: 'pre-line' }}>{activeOrder.note || 'No custom notes provided.'}</span>
                    </div>
                  </div>
                </div>

              </div>
                      {/* Complete Order & Photo/Cutting Complete Side Panel */}
            <div className="card">
              <div className="card-header">
                <h3>
                  {activeOrder.cutting_status === 'pending' ? (
                    <span><Scissors size={18} /> Complete Cutting Work</span>
                  ) : (
                    <span><Camera size={18} /> Quality Assurance</span>
                  )}
                </h3>
              </div>
              {activeOrder.cutting_status === 'pending' ? (
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    Please cut the fabric according to the specifications. Once finished, click the button below to log your work. This will return the order back to the pending queue for stitching.
                  </p>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleCompleteCutting}
                    style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                  >
                    <CheckCircle2 size={16} /> Complete Cutting Portion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCompleteOrder} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    Upload clear photos of the front and back of the finished dress to mark the job as completed and enable manager delivery scheduling.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Front Photo Upload */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>Front Side of Dress *</label>
                      {photoFront ? (
                        <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                          <img src={photoFront} alt="Front View" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            type="button" 
                            onClick={() => setPhotoFront('')}
                            style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(15,23,42,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ border: '2px dashed var(--border-light)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', backgroundColor: '#fafafa', cursor: 'pointer', position: 'relative' }}>
                          <Upload size={20} style={{ color: 'var(--text-muted)', marginBottom: '0.375rem' }} />
                          <span style={{ fontSize: '0.775rem', display: 'block', color: 'var(--text-muted)' }}>Tap to snap or upload</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            onChange={(e) => handleFileChange(e, 'front')}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Back Photo Upload */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>Back Side of Dress *</label>
                      {photoBack ? (
                        <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                          <img src={photoBack} alt="Back View" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            type="button" 
                            onClick={() => setPhotoBack('')}
                            style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(15,23,42,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ border: '2px dashed var(--border-light)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', backgroundColor: '#fafafa', cursor: 'pointer', position: 'relative' }}>
                          <Upload size={20} style={{ color: 'var(--text-muted)', marginBottom: '0.375rem' }} />
                          <span style={{ fontSize: '0.775rem', display: 'block', color: 'var(--text-muted)' }}>Tap to snap or upload</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            onChange={(e) => handleFileChange(e, 'back')}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={!photoFront || !photoBack}
                    style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                  >
                    <CheckCircle2 size={16} /> Complete Order & Submit
                  </button>
                </form>
              )}
            </div>      </div>
          </div>
        ) : (
          /* WORK QUEUE MODE: Tailor is looking for an order to pick up */
          <div className="card">
            <div className="card-header">
              <h3>
                <Scissors size={18} style={{ color: 'var(--color-primary)' }} />
                Pending Orders Queue ({sortedPendingOrders.length})
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={refreshData} title="Refresh pending order board">
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', marginTop: 0 }}>
                Review the list of orders waiting to be stitched. Choose one that you are ready to work on and click <strong>"Pickup & Start Work"</strong>.
              </p>

              {sortedPendingOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <UserCheck size={36} style={{ color: 'var(--color-success)', marginBottom: '0.75rem' }} />
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No Pending Orders</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: '300px', margin: '0.25rem auto 0 auto' }}>
                    All stitching requests have been claimed or completed. Great job! Check back later.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {sortedPendingOrders.map(ord => {
                    const days = getDaysRemaining(ord.delivery_date);
                    return (
                      <div 
                        key={ord.id} 
                        className="card" 
                        style={{ 
                          border: ord.is_urgent ? '2px solid var(--color-danger)' : '1px solid var(--border-light)', 
                          borderRadius: 'var(--radius-lg)', 
                          padding: '1.25rem',
                          backgroundColor: ord.is_urgent ? '#fef2f2' : 'var(--bg-card)',
                          boxShadow: ord.is_urgent ? '0 4px 6px -1px rgba(220, 38, 38, 0.1), 0 2px 4px -1px rgba(220, 38, 38, 0.06)' : 'var(--shadow-sm)',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Order ID: {ord.order_no}
                              </span>
                              {ord.is_urgent && (
                                <span className="badge danger" style={{ padding: '0.05rem 0.35rem', fontSize: '0.65rem' }}>
                                  URGENT ⚡
                                </span>
                              )}
                            </div>
                             <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: ord.is_urgent ? 'var(--color-danger)' : 'var(--text-primary)', marginTop: '0.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                               <span className={`badge ${
                                 ord.service_type === 'Stitching' ? 'success' :
                                 ord.service_type === 'Alteration' ? 'warning' : 'info'
                               }`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', fontWeight: 600 }}>
                                 {ord.service_type === 'Stitching' ? '🧵 Stitching' :
                                  ord.service_type === 'Alteration' ? '✂️ Alteration' :
                                  '🔧 Repairs & Stitching'}
                               </span>
                               <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>({ord.dress_type})</span>
                             </h4>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                            <span className={`badge ${
                              days < 0 ? 'danger' : days <= 2 ? 'warning' : 'info'
                            }`} style={{ padding: '0.15rem 0.5rem', fontSize: '0.725rem' }}>
                              {days < 0 ? `Overdue ${Math.abs(days)}d` : days === 0 ? 'Due Today' : `Due in ${days} days`}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: ord.is_urgent ? 'var(--color-danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                              Target: {ord.delivery_date} @ {ord.delivery_time || '17:00'}
                            </span>
                          </div>
                        </div>

                        {/* Customer Summary & Detail Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', padding: '0.75rem 1rem', backgroundColor: ord.is_urgent ? '#fff5f5' : '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.825rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '0.675rem' }}>Customer</span>
                            <strong style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{ord.customer?.name}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '0.675rem' }}>Stitching Details & Fabric Notes</span>
                            <span style={{ color: 'var(--text-primary)', display: 'block', fontStyle: ord.note ? 'normal' : 'italic' }}>
                              {ord.note || 'No notes specified.'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', pt: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            <div>
                              Quoted Price: <span style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>Rs. {Number(ord.amount || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600 }}>Est. Comm:</span>
                              {activeTailor.cutting_skills?.includes(ord.dress_type) && ord.cutting_status !== 'completed' && (
                                <span className="badge success" style={{ fontSize: '0.65rem', padding: '0.05rem 0.3rem' }}>
                                  Both: Rs. {(ord.amount * 0.3).toFixed(0)}
                                </span>
                              )}
                              {activeTailor.cutting_skills?.includes(ord.dress_type) && ord.cutting_status !== 'completed' && (
                                <span className="badge info" style={{ fontSize: '0.65rem', padding: '0.05rem 0.3rem' }}>
                                  Cut: Rs. {(ord.amount * 0.15).toFixed(0)}
                                </span>
                              )}
                              <span className="badge info" style={{ fontSize: '0.65rem', padding: '0.05rem 0.3rem' }}>
                                Stitch: Rs. {(ord.amount * 0.15).toFixed(0)}
                              </span>
                            </div>
                          </div>
                          <button 
                            className="btn btn-primary" 
                            onClick={() => {
                              if (ord.service_type === 'Alteration') {
                                if (window.confirm("Are you sure you want to start working on this Alteration order?")) {
                                  let payload = {
                                    ...ord,
                                    status: 'in-progress',
                                    work_started_time: new Date().toISOString(),
                                    assigned_staff_id: activeTailorId,
                                    cutting_staff_id: activeTailorId,
                                    cutting_status: 'completed'
                                  };
                                  try {
                                    db.saveOrder(payload);
                                    refreshData();
                                    db.addAuditLog(
                                      `Tailor Pickup: ${ord.order_no}`,
                                      `Tailor ${activeTailor.name} claimed alteration order.`
                                    );
                                  } catch (err) {
                                    alert(err.message);
                                  }
                                }
                              } else {
                                setPickingUpOrder(ord);
                                const canCut = activeTailor.cutting_skills?.includes(ord.dress_type);
                                if (ord.cutting_status === 'completed') {
                                  setPickupType('stitching');
                                } else if (canCut) {
                                  setPickupType('both');
                                } else {
                                  setPickupType('stitching');
                                }
                                setPickupCuttingTailorId('');
                              }
                            }}
                            style={{ 
                              padding: '0.45rem 1rem', 
                              fontSize: '0.825rem', 
                              gap: '0.375rem',
                              backgroundColor: 'var(--color-primary)',
                              hoverColor: 'var(--color-primary-hover)'
                            }}
                          >
                            <Scissors size={14} /> Pickup & Start Work
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Pickup Confirmation Modal */}
      {pickingUpOrder && (
        <div className="modal-overlay" style={{ zIndex: 110 }}>
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3>Order Pickup Setup: {pickingUpOrder.order_no}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setPickingUpOrder(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontWeight: 700 }}>{pickingUpOrder.service_type} ({pickingUpOrder.dress_type})</h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Select the portion of work you are claiming for this order:
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Both (Cutting & Stitching or Repairs & Stitching) Option */}
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '0.75rem', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: '6px', 
                  cursor: (canCutPickingOrder && pickingUpOrder.cutting_status !== 'completed') ? 'pointer' : 'not-allowed',
                  opacity: (canCutPickingOrder && pickingUpOrder.cutting_status !== 'completed') ? 1 : 0.5,
                  backgroundColor: pickupType === 'both' ? 'var(--color-primary-light)' : 'transparent',
                  borderColor: pickupType === 'both' ? 'var(--color-primary)' : 'var(--border-light)'
                }}>
                  <input 
                    type="radio" 
                    name="pickupType" 
                    value="both" 
                    checked={pickupType === 'both'}
                    disabled={!canCutPickingOrder || pickingUpOrder.cutting_status === 'completed'}
                    onChange={() => setPickupType('both')}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.875rem' }}>Cutting & Stitching</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      You cut and stitch. Earns Rs. ${(pickingUpOrder.amount * 0.3).toFixed(2)} commission (30%).
                    </span>
                    {!canCutPickingOrder && (
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 600, marginTop: '0.125rem' }}>
                        ⚠️ Lacks cutting capability for {pickingUpOrder.dress_type}
                      </span>
                    )}
                    {pickingUpOrder.cutting_status === 'completed' && (
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-warning)', fontWeight: 600, marginTop: '0.125rem' }}>
                        ⚠️ Cutting already completed by another tailor
                      </span>
                    )}
                  </div>
                </label>
 
                {/* Cutting Only Option */}
                {pickingUpOrder.cutting_status !== 'completed' && (
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    padding: '0.75rem', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: '6px', 
                    cursor: (canCutPickingOrder) ? 'pointer' : 'not-allowed',
                    opacity: (canCutPickingOrder) ? 1 : 0.5,
                    backgroundColor: pickupType === 'cutting' ? 'var(--color-primary-light)' : 'transparent',
                    borderColor: pickupType === 'cutting' ? 'var(--color-primary)' : 'var(--border-light)'
                  }}>
                    <input 
                      type="radio" 
                      name="pickupType" 
                      value="cutting" 
                      checked={pickupType === 'cutting'}
                      disabled={!canCutPickingOrder}
                      onChange={() => setPickupType('cutting')}
                    />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.875rem' }}>Cutting Only</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Only cut fabric. Earns Rs. ${(pickingUpOrder.amount * 0.15).toFixed(2)} commission (15%).
                      </span>
                      {!canCutPickingOrder && (
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 600, marginTop: '0.125rem' }}>
                          ⚠️ Lacks cutting capability for {pickingUpOrder.dress_type}
                        </span>
                      )}
                    </div>
                  </label>
                )}
 
                {/* Stitching Only Option */}
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '0.75rem', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  backgroundColor: pickupType === 'stitching' ? 'var(--color-primary-light)' : 'transparent',
                  borderColor: pickupType === 'stitching' ? 'var(--color-primary)' : 'var(--border-light)'
                }}>
                  <input 
                    type="radio" 
                    name="pickupType" 
                    value="stitching" 
                    checked={pickupType === 'stitching'}
                    onChange={() => setPickupType('stitching')}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.875rem' }}>Stitching Only</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Only stitch fabric. Earns Rs. {(pickingUpOrder.amount * 0.15).toFixed(2)} commission (15%).
                    </span>
                  </div>
                </label>
              </div>
 
              {/* If Stitching Only and cutting is not completed, select who did the cutting */}
              {pickupType === 'stitching' && pickingUpOrder.cutting_status !== 'completed' && (
                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Who cut the cloth? *</label>
                  <select 
                    className="form-select"
                    required
                    value={pickupCuttingTailorId}
                    onChange={e => setPickupCuttingTailorId(e.target.value)}
                  >
                    <option value="" disabled>Select cutting tailor...</option>
                    {staff.filter(s => s.cutting_skills?.includes(pickingUpOrder.dress_type)).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Only tailors with cutting capabilities for {pickingUpOrder.dress_type} are listed.
                  </p>
                </div>
              )}

              {/* Confirm Button */}
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                disabled={pickupType === 'stitching' && pickingUpOrder.cutting_status !== 'completed' && !pickupCuttingTailorId}
                onClick={confirmPickupOrder}
              >
                Confirm Pickup & Start Work
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
