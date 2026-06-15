import React, { useState } from 'react';
import { db } from '../lib/db';
import { AlertTriangle, Plus, CheckCircle2, MessageSquare, Image, X, RefreshCw } from 'lucide-react';

export default function ComplaintModule({ activeRole, triggerUpdate }) {
  const [complaints, setComplaints] = useState(db.getComplaints());
  const [customers] = useState(db.getCustomers());
  const [orders] = useState(db.getOrders());
  const [staff] = useState(db.getStaff());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  
  // Form States
  const [formFields, setFormFields] = useState({
    customer_id: '',
    order_id: '',
    description: '',
    assigned_staff_id: '',
    evidence_url: ''
  });

  const [resolutionFields, setResolutionFields] = useState({
    status: 'In Review',
    resolution_notes: ''
  });

  const refreshList = () => {
    setComplaints(db.getComplaints());
  };

  const handleRegisterComplaint = (e) => {
    e.preventDefault();
    if (!formFields.customer_id || !formFields.description) {
      alert('Customer and description are required.');
      return;
    }

    db.saveComplaint({
      customer_id: formFields.customer_id,
      order_id: formFields.order_id || null,
      description: formFields.description,
      assigned_staff_id: formFields.assigned_staff_id || null,
      evidence_url: '',
      status: 'In Review',
      resolution_notes: ''
    });

    setShowAddModal(false);
    refreshList();
    triggerUpdate();
  };

  const openResolutionModal = (comp) => {
    setEditingComplaint(comp);
    setResolutionFields({
      status: comp.status,
      resolution_notes: comp.resolution_notes || ''
    });
  };

  const handleSaveResolution = (e) => {
    e.preventDefault();
    if (!editingComplaint) return;

    db.saveComplaint({
      ...editingComplaint,
      status: resolutionFields.status,
      resolution_notes: resolutionFields.resolution_notes
    });

    setEditingComplaint(null);
    refreshList();
    triggerUpdate();
  };

  const isReadOnly = activeRole === 'boss';

  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <AlertTriangle style={{ color: 'var(--color-danger)' }} size={20} />
          Customer Complaints & Fit Adjustments
        </h3>
        {!isReadOnly && (
          <button className="btn btn-primary btn-sm" onClick={() => {
            setFormFields({
              customer_id: customers[0]?.id || '',
              order_id: '',
              description: '',
              assigned_staff_id: staff[0]?.id || '',
              evidence_url: ''
            });
            setShowAddModal(true);
          }}>
            <Plus size={16} /> Register Complaint
          </button>
        )}
      </div>

      <div className="card-body">
        <div className="toolbar">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Track and assign fitting complaints, garment tears, and order issues directly to tailors.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={refreshList}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Customer</th>
                <th>Link Order</th>
                <th>Date Reported</th>
                <th>Description</th>
                <th>Resolution notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No complaints registered. High customer satisfaction!
                  </td>
                </tr>
              ) : (
                complaints.map(comp => (
                  <tr key={comp.id}>
                    <td style={{ fontWeight: 600 }}>{comp.id}</td>
                    <td style={{ fontWeight: 600 }}>{comp.customer?.name}</td>
                    <td>{comp.order?.order_no || '—'}</td>
                    <td>{comp.date_reported}</td>
                    <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={comp.description}>
                      {comp.description}
                    </td>
                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={comp.resolution_notes}>
                      {comp.resolution_notes || '—'}
                    </td>
                    <td>
                      <span className={`badge ${
                        comp.status === 'Resolved' ? 'success' : 
                        comp.status === 'Escalated' ? 'danger' : 'warning'
                      }`}>
                        {comp.status}
                      </span>
                    </td>
                    <td>
                      {!isReadOnly ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => openResolutionModal(comp)}>
                          <MessageSquare size={14} /> Resolve
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Complaint Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register Customer Complaint / Fit Alert</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRegisterComplaint}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Client Name *</label>
                    <select 
                      className="form-select"
                      required
                      value={formFields.customer_id}
                      onChange={e => setFormFields({ ...formFields, customer_id: e.target.value })}
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Link Order (Optional)</label>
                    <select 
                      className="form-select"
                      value={formFields.order_id}
                      onChange={e => setFormFields({ ...formFields, order_id: e.target.value })}
                    >
                      <option value="">No order link</option>
                      {orders.map(o => (
                        <option key={o.id} value={o.id}>{o.order_no} (${o.amount})</option>
                      ))}
                    </select>
                  </div>
                  {/* Responsible Tailor and Evidence section removed per client request */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Detailed Description of Fit/Stitching Issue *</label>
                    <textarea 
                      className="form-textarea"
                      required
                      value={formFields.description}
                      onChange={e => setFormFields({ ...formFields, description: e.target.value })}
                      placeholder="Describe exactly what needs fixing, hem length, shoulder waist fittings..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">File Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Dialog */}
      {editingComplaint && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Resolve Complaint Ticket: {editingComplaint.id}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setEditingComplaint(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveResolution}>
              <div className="modal-body">
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600 }}>Original Client Issue:</h4>
                  <p style={{ fontSize: '0.875rem', backgroundColor: '#f1f5f9', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-light)', marginTop: '0.375rem', lineHeight: '1.4' }}>
                    {editingComplaint.description}
                  </p>
                  {/* Evidence display removed per client request */}
                </div>

                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Ticket Status</label>
                    <select
                      className="form-select"
                      value={resolutionFields.status}
                      onChange={e => setResolutionFields({ ...resolutionFields, status: e.target.value })}
                    >
                      <option value="In Review">In Review</option>
                      <option value="Escalated">Escalated</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Staff Resolution & Closing Notes *</label>
                    <textarea 
                      className="form-textarea"
                      required
                      value={resolutionFields.resolution_notes}
                      onChange={e => setResolutionFields({ ...resolutionFields, resolution_notes: e.target.value })}
                      placeholder="Detail actions taken to resolve (e.g. re-stitched seams, discount issued)..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingComplaint(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Resolution</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
