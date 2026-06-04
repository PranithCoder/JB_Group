import React, { useState } from 'react';
import { db, TODAY_DATE } from '../lib/db';
import { Phone, Plus, Search, Trash2, X, Clock, Calendar, RefreshCw, Edit } from 'lucide-react';

export default function CallModule({ activeRole, triggerUpdate }) {
  const [calls, setCalls] = useState(db.getCalls());
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingCall, setEditingCall] = useState(null);

  // Form State Helper
  const getCurrentTimeStr = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    callerName: '',
    phoneNumber: '',
    reason: 'Order Status Inquiry',
    reasonOther: '',
    note: '',
    date: TODAY_DATE,
    time: getCurrentTimeStr()
  });

  const refreshList = () => {
    setCalls(db.getCalls());
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredCalls = calls.filter(c => {
    const matchesSearch = 
      c.callerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phoneNumber.includes(searchTerm) ||
      c.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.note && c.note.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = !dateFilter || c.date === dateFilter;

    return matchesSearch && matchesDate;
  });

  const openAddModal = () => {
    setFormData({
      callerName: '',
      phoneNumber: '',
      reason: 'Order Status Inquiry',
      reasonOther: '',
      note: '',
      date: TODAY_DATE,
      time: getCurrentTimeStr()
    });
    setEditingCall(null);
    setShowFormModal(true);
  };

  const openEditModal = (call) => {
    let reasonVal = call.reason;
    let reasonOtherVal = '';
    const standardReasons = ['Order Status Inquiry', 'Fitting Appointment Booking', 'Price Quotation Request', 'Complaint Log'];
    if (!standardReasons.includes(call.reason)) {
      reasonVal = 'Other';
      reasonOtherVal = call.reason.startsWith('Other: ') ? call.reason.replace('Other: ', '') : call.reason;
    }
    setFormData({
      callerName: call.callerName,
      phoneNumber: call.phoneNumber,
      reason: reasonVal,
      reasonOther: reasonOtherVal,
      note: call.note || '',
      date: call.date,
      time: call.time
    });
    setEditingCall(call);
    setShowFormModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.callerName || !formData.phoneNumber || !formData.reason) {
      alert('Caller Name, Phone, and Reason are required.');
      return;
    }

    const finalReason = formData.reason === 'Other' ? `Other: ${formData.reasonOther}` : formData.reason;

    const payload = {
      callerName: formData.callerName,
      phoneNumber: formData.phoneNumber,
      reason: finalReason,
      note: formData.note,
      date: formData.date,
      time: formData.time
    };

    if (editingCall) {
      payload.id = editingCall.id;
    }

    db.saveCall(payload);

    setNotification({
      type: 'success',
      message: `Call log from "${formData.callerName}" ${editingCall ? 'updated' : 'recorded'} successfully!`
    });
    setShowFormModal(false);
    setEditingCall(null);
    refreshList();
    triggerUpdate();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this call log?')) return;
    db.deleteCall(id);
    setNotification({
      type: 'success',
      message: 'Call log deleted.'
    });
    refreshList();
    triggerUpdate();
    setTimeout(() => setNotification(null), 4000);
  };

  const canEditDelete = activeRole === 'manager' || activeRole === 'boss' || activeRole === 'super_admin';

  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <Phone style={{ color: 'var(--color-primary)' }} size={20} />
          Incoming & Outgoing Call Logs
        </h3>
        <button className="btn btn-primary btn-sm" onClick={openAddModal}>
          <Plus size={16} /> Record Call
        </button>
      </div>

      <div className="card-body">
        {notification && (
          <div className="alert-banner info mb-md" style={{ marginBottom: '1.25rem' }}>
            <div className="alert-banner-left">
              <span>{notification.message}</span>
            </div>
            <button className="alert-action-btn" onClick={() => setNotification(null)}>Dismiss</button>
          </div>
        )}

        <div className="toolbar">
          <div className="search-box">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by caller, phone, reason..." 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="filter-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', padding: '0.25rem 0.5rem', backgroundColor: '#fafafa', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Date:</span>
              <input 
                type="date" 
                className="form-input" 
                style={{ padding: '0.125rem 0.375rem', fontSize: '0.75rem', width: 'auto', border: 'none', background: 'none' }}
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <button 
                  onClick={() => setDateFilter('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.725rem', color: 'var(--color-danger)' }}
                >
                  Clear
                </button>
              )}
            </div>

            <button className="btn btn-secondary btn-sm" onClick={refreshList} title="Refresh log">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Caller Name</th>
                <th>Phone Number</th>
                <th>Reason of Call</th>
                <th>Date</th>
                <th>Time</th>
                <th>Notes / Remarks</th>
                {canEditDelete && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={canEditDelete ? 7 : 6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No call logs recorded for the selected period.
                  </td>
                </tr>
              ) : (
                filteredCalls.map(call => (
                  <tr key={call.id}>
                    <td style={{ fontWeight: 600 }}>{call.callerName}</td>
                    <td>{call.phoneNumber}</td>
                    <td>
                      <span className="badge info">{call.reason}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        {call.date}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                        {call.time}
                      </div>
                    </td>
                    <td style={{ maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={call.note}>
                      {call.note || '—'}
                    </td>
                    {canEditDelete && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button className="btn btn-secondary btn-sm text-blue" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openEditModal(call)} title="Edit Log">
                            <Edit size={13} />
                          </button>
                          <button className="btn btn-secondary btn-sm text-red" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(call.id)} title="Delete Log">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Call Modal */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCall ? 'Edit Call Log Details' : 'Record Call Details'}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowFormModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Caller Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={formData.callerName}
                      onChange={e => setFormData({ ...formData, callerName: e.target.value })}
                      placeholder="e.g. Clara Oswald"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Phone Number *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={formData.phoneNumber}
                      onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="e.g. +1 (555) 012-3344"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Call Date *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      required
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Call Time *</label>
                    <input 
                      type="time" 
                      className="form-input" 
                      required
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Reason for Call *</label>
                    <select 
                      className="form-select"
                      value={formData.reason}
                      onChange={e => setFormData({ ...formData, reason: e.target.value, reasonOther: '' })}
                    >
                      <option value="Order Status Inquiry">Order Status Inquiry</option>
                      <option value="Fitting Appointment Booking">Fitting Appointment Booking</option>
                      <option value="Price Quotation Request">Price Quotation Request</option>
                      <option value="Complaint Log">Complaint Log</option>
                      <option value="Other">Other</option>
                    </select>
                    {formData.reason === 'Other' && (
                      <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Please specify reason..."
                      required
                      value={formData.reasonOther}
                      onChange={e => setFormData({ ...formData, reasonOther: e.target.value })}
                      style={{ marginTop: '0.5rem' }}
                    />
                  )}
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Note / Remarks</label>
                  <textarea 
                    className="form-textarea" 
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Enter call notes, reminders, or messages taken..."
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingCall ? 'Save Changes' : 'Save Call'}</button>
            </div>
          </form>
          </div>
        </div>
      )}
    </div>
  );
}
