import React, { useState } from 'react';
import { db, TODAY_DATE } from '../lib/db';
import { MapPin, Plus, Search, Trash2, X, Clock, Calendar, RefreshCw, Edit } from 'lucide-react';

export default function VisitModule({ activeRole, triggerUpdate }) {
  const [visits, setVisits] = useState(db.getVisits());
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingVisit, setEditingVisit] = useState(null);

  // Form State Helper
  const getCurrentTimeStr = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    visitorName: '',
    reason: 'Order Placement',
    reasonOther: '',
    date: TODAY_DATE,
    time: getCurrentTimeStr(),
    notes: ''
  });

  const refreshList = () => {
    setVisits(db.getVisits());
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredVisits = visits.filter(v => {
    const matchesSearch = 
      v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.notes && v.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = !dateFilter || v.date === dateFilter;

    return matchesSearch && matchesDate;
  });

  const openAddModal = () => {
    setFormData({
      visitorName: '',
      reason: 'Order Placement',
      reasonOther: '',
      date: TODAY_DATE,
      time: getCurrentTimeStr(),
      notes: ''
    });
    setEditingVisit(null);
    setShowFormModal(true);
  };

  const openEditModal = (visit) => {
    let reasonVal = visit.reason;
    let reasonOtherVal = '';
    const standardReasons = ['Order Placement', 'Fitting / Alteration', 'Complaint / Feedback', 'Payment / Billing', 'Inquiry'];
    if (!standardReasons.includes(visit.reason)) {
      reasonVal = 'Other';
      reasonOtherVal = visit.reason.startsWith('Other: ') ? visit.reason.replace('Other: ', '') : visit.reason;
    }
    setFormData({
      visitorName: visit.visitorName,
      reason: reasonVal,
      reasonOther: reasonOtherVal,
      date: visit.date,
      time: visit.time,
      notes: visit.notes || ''
    });
    setEditingVisit(visit);
    setShowFormModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.visitorName || !formData.reason) {
      alert('Visitor Name and Reason are required.');
      return;
    }

    const finalReason = formData.reason === 'Other' ? `Other: ${formData.reasonOther}` : formData.reason;

    const payload = {
      visitorName: formData.visitorName,
      reason: finalReason,
      date: formData.date,
      time: formData.time,
      notes: formData.notes
    };

    if (editingVisit) {
      payload.id = editingVisit.id;
    }

    db.saveVisit(payload);

    setNotification({
      type: 'success',
      message: `Visit for "${formData.visitorName}" ${editingVisit ? 'updated' : 'logged'} successfully!`
    });
    setShowFormModal(false);
    setEditingVisit(null);
    refreshList();
    triggerUpdate();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this visit log?')) return;
    db.deleteVisit(id);
    setNotification({
      type: 'success',
      message: 'Visit log deleted.'
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
          <MapPin style={{ color: 'var(--color-primary)' }} size={20} />
          Branch Visits Logsheet
        </h3>
        <button className="btn btn-primary btn-sm" onClick={openAddModal}>
          <Plus size={16} /> Log Visitor
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
              placeholder="Search by visitor name or reason..." 
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
                <th>Visitor Name</th>
                <th>Reason of Visit</th>
                <th>Date</th>
                <th>Time</th>
                <th>Additional Notes</th>
                {canEditDelete && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={canEditDelete ? 6 : 5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No visits recorded for the selected period.
                  </td>
                </tr>
              ) : (
                filteredVisits.map(visit => (
                  <tr key={visit.id}>
                    <td style={{ fontWeight: 600 }}>{visit.visitorName}</td>
                    <td>
                      <span className="badge info">{visit.reason}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        {visit.date}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                        {visit.time}
                      </div>
                    </td>
                    <td style={{ maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={visit.notes}>
                      {visit.notes || '—'}
                    </td>
                    {canEditDelete && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button className="btn btn-secondary btn-sm text-blue" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openEditModal(visit)} title="Edit Log">
                            <Edit size={13} />
                          </button>
                          <button className="btn btn-secondary btn-sm text-red" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(visit.id)} title="Delete Log">
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

      {/* Log Visit Modal */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingVisit ? 'Edit Branch Visitor Log' : 'Log Branch Visitor'}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowFormModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Visitor Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={formData.visitorName}
                      onChange={e => setFormData({ ...formData, visitorName: e.target.value })}
                      placeholder="e.g. Amelia Watson"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Visit Date *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      required
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Visit Time *</label>
                    <input 
                      type="time" 
                      className="form-input" 
                      required
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Reason of Visit *</label>
                    <select 
                      className="form-select"
                      value={formData.reason}
                      onChange={e => setFormData({ ...formData, reason: e.target.value, reasonOther: '' })}
                    >
                      <option value="Order Placement">Order Placement</option>
                      <option value="Fitting / Alteration">Fitting / Alteration</option>
                      <option value="Complaint / Feedback">Complaint / Feedback</option>
                      <option value="Payment / Billing">Payment / Billing</option>
                      <option value="Inquiry">General Inquiry</option>
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
                  <label className="form-label">Additional Notes</label>
                  <textarea 
                    className="form-textarea" 
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any specific instructions, fitting notes, or details about the visit..."
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingVisit ? 'Save Changes' : 'Save Visit'}</button>
            </div>
          </form>
          </div>
        </div>
      )}
    </div>
  );
}
