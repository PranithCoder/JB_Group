import React, { useState } from 'react';
import { db } from '../lib/db';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, Eye, RefreshCw, Calendar } from 'lucide-react';

export default function OrderModule({ activeRole, triggerUpdate }) {
  const [orders, setOrders] = useState(db.getOrders());
  const [customers] = useState(db.getCustomers());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingAudit, setViewingAudit] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    customer_id: '',
    delivery_date: '',
    service_type: 'Stitching',
    note: '',
    status: 'pending',
    amount: '',
    payment_status: 'unpaid'
  });

  const refreshList = () => {
    setOrders(db.getOrders());
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const getDaysRemaining = (dueDateStr) => {
    const today = new Date('2026-06-01'); // Fixed local time reference
    const dueDate = new Date(dueDateStr);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isOverdue = (order) => {
    if (order.status === 'completed') return false;
    return getDaysRemaining(order.delivery_date) < 0;
  };

  const isDueSoon = (order) => {
    if (order.status === 'completed') return false;
    const diff = getDaysRemaining(order.delivery_date);
    return diff >= 0 && diff <= 2;
  };

  const filteredOrders = orders.filter(o => {
    // Search
    const matchesSearch = 
      (o.order_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.note || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Status Filter
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'overdue') return isOverdue(o);
    if (statusFilter === 'soon') return isDueSoon(o);
    return o.status === statusFilter;
  });

  const openAddModal = () => {
    setFormData({
      customer_id: customers[0]?.id || '',
      delivery_date: new Date('2026-06-03').toISOString().split('T')[0], // Default 2 days out
      service_type: 'Stitching',
      note: '',
      status: 'pending',
      amount: '',
      payment_status: 'unpaid'
    });
    setEditingOrder(null);
    setShowFormModal(true);
  };

  const openEditModal = (order) => {
    setFormData({
      customer_id: order.customer_id,
      delivery_date: order.delivery_date,
      service_type: order.service_type,
      note: order.note || '',
      status: order.status,
      amount: order.amount,
      payment_status: order.payment_status
    });
    setEditingOrder(order);
    setShowFormModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.delivery_date || !formData.amount) {
      alert('Required fields are missing.');
      return;
    }

    const payload = {
      ...(editingOrder ? { id: editingOrder.id } : {}),
      customer_id: formData.customer_id,
      delivery_date: formData.delivery_date,
      service_type: formData.service_type,
      note: formData.note,
      status: formData.status,
      amount: Number(formData.amount),
      payment_status: formData.payment_status
    };

    const result = db.saveOrder(payload);

    if (result.status === 'pending_approval') {
      setNotification({
        type: 'warning',
        message: 'Critical edit (Delivery Date/Amount change) sent to Manager approvals queue.'
      });
    } else {
      setNotification({
        type: 'success',
        message: `Order saved successfully.`
      });
    }

    setShowFormModal(false);
    refreshList();
    triggerUpdate();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    const result = db.deleteOrder(id);

    if (result.status === 'pending_approval') {
      setNotification({
        type: 'warning',
        message: 'Deletion request sent to Manager approval queue.'
      });
    } else {
      setNotification({
        type: 'success',
        message: 'Order deleted successfully.'
      });
    }

    refreshList();
    triggerUpdate();
    setTimeout(() => setNotification(null), 4000);
  };

  const viewAuditLog = (order) => {
    // Generate simulated edit logs based on order id for the auditing audit component
    const edits = [
      { user: 'Alina Officer', action: 'Created Order', date: order.order_date, detail: 'Initial entry' }
    ];
    if (order.status === 'completed') {
      edits.push({ user: 'Marcus Manager', action: 'Marked Completed', date: order.delivery_date, detail: 'Quality inspection passed' });
    }
    setViewingAudit({ order, edits });
  };

  const isReadOnly = activeRole === 'boss';

  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <ShoppingBag style={{ color: 'var(--color-primary)' }} size={20} />
          Order Bookings & Delivery Schedules
        </h3>
        {!isReadOnly && (
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            <Plus size={16} /> Book Order
          </button>
        )}
      </div>

      <div className="card-body">
        {notification && (
          <div className={`alert-banner mb-md ${notification.type === 'success' ? 'info' : 'warning'}`}>
            <div className="alert-banner-left">
              <span>{notification.message}</span>
            </div>
            <button className="alert-action-btn" onClick={() => setNotification(null)}>Dismiss</button>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by Order No, customer, description..." 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="filter-actions">
            <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
              <button 
                onClick={() => setStatusFilter('all')}
                className={`role-btn ${statusFilter === 'all' ? 'active' : ''}`}
                style={{ padding: '0.25rem 0.625rem', fontSize: '0.775rem' }}
              >
                All
              </button>
              <button 
                onClick={() => setStatusFilter('pending')}
                className={`role-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                style={{ padding: '0.25rem 0.625rem', fontSize: '0.775rem' }}
              >
                Pending
              </button>
              <button 
                onClick={() => setStatusFilter('in-progress')}
                className={`role-btn ${statusFilter === 'in-progress' ? 'active' : ''}`}
                style={{ padding: '0.25rem 0.625rem', fontSize: '0.775rem' }}
              >
                In-Progress
              </button>
              <button 
                onClick={() => setStatusFilter('completed')}
                className={`role-btn ${statusFilter === 'completed' ? 'active' : ''}`}
                style={{ padding: '0.25rem 0.625rem', fontSize: '0.775rem' }}
              >
                Completed
              </button>
              <button 
                onClick={() => setStatusFilter('overdue')}
                className={`role-btn ${statusFilter === 'overdue' ? 'active' : ''}`}
                style={{ padding: '0.25rem 0.625rem', fontSize: '0.775rem', color: 'var(--color-danger)' }}
              >
                Overdue ⚠️
              </button>
              <button 
                onClick={() => setStatusFilter('soon')}
                className={`role-btn ${statusFilter === 'soon' ? 'active' : ''}`}
                style={{ padding: '0.25rem 0.625rem', fontSize: '0.775rem', color: '#d97706' }}
              >
                Due ≤ 2 Days
              </button>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={refreshList}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Grid or Table display */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Delivery Due Date</th>
                <th>Service Type</th>
                <th>Notes</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => {
                  const daysLeft = getDaysRemaining(ord.delivery_date);
                  let dueLabel = ord.delivery_date;
                  let styleClass = '';
                  
                  if (ord.status !== 'completed') {
                    if (daysLeft < 0) {
                      dueLabel = `${ord.delivery_date} (Overdue ${Math.abs(daysLeft)}d)`;
                      styleClass = 'text-red';
                    } else if (daysLeft === 0) {
                      dueLabel = `${ord.delivery_date} (TODAY)`;
                      styleClass = 'text-amber';
                    } else if (daysLeft <= 2) {
                      dueLabel = `${ord.delivery_date} (${daysLeft}d left)`;
                      styleClass = 'text-amber';
                    }
                  }

                  return (
                    <tr key={ord.id} style={{ backgroundColor: isOverdue(ord) ? 'var(--color-danger-light)' : 'inherit' }}>
                      <td style={{ fontWeight: 600 }}>{ord.order_no}</td>
                      <td>{ord.customer?.name || '—'}</td>
                      <td>{ord.order_date}</td>
                      <td className={styleClass} style={{ fontWeight: styleClass ? '600' : 'normal' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Calendar size={14} />
                          <span>{dueLabel}</span>
                        </div>
                      </td>
                      <td>{ord.service_type}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ord.note}>
                        {ord.note || '—'}
                      </td>
                      <td style={{ fontWeight: 600 }}>${Number(ord.amount || 0).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${ord.payment_status === 'paid' ? 'success' : 'danger'}`}>
                          {ord.payment_status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          ord.status === 'completed' ? 'success' : 
                          ord.status === 'in-progress' ? 'warning' : 'info'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td>
                        <div className="filter-actions">
                          <button className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => viewAuditLog(ord)} title="Audit Trail">
                            <Eye size={14} /> Audit
                          </button>
                          {!isReadOnly && (
                            <button className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openEditModal(ord)} title="Edit Order Details">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {!isReadOnly && (
                            <button className="btn btn-secondary btn-sm text-red" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(ord.id)} title="Delete Order">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingOrder ? `Edit Booked Order: ${editingOrder.order_no}` : 'Book Stitching/Alteration Order'}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowFormModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Client Name *</label>
                    <select 
                      className="form-select"
                      required
                      value={formData.customer_id}
                      onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.contact})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Service Category</label>
                    <select 
                      className="form-select"
                      value={formData.service_type}
                      onChange={e => setFormData({ ...formData, service_type: e.target.value })}
                    >
                      <option value="Stitching">Stitching (Bespoke)</option>
                      <option value="Alteration">Alteration/Fitting</option>
                      <option value="Repairs">Repairs & Stitching</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Delivery Due Date *</label>
                    <input 
                      type="date"
                      className="form-input"
                      required
                      value={formData.delivery_date}
                      onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quoted Price ($) *</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="form-input"
                      required
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Status</label>
                    <select 
                      className="form-select"
                      value={formData.payment_status}
                      onChange={e => setFormData({ ...formData, payment_status: e.target.value })}
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Current Progress Status</label>
                    <select 
                      className="form-select"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="pending">Pending (Design)</option>
                      <option value="in-progress">In-Progress (Stitching/Cutting)</option>
                      <option value="completed">Completed & Verified</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Detailed Notes / Fabric Preferences</label>
                    <textarea 
                      className="form-textarea"
                      value={formData.note}
                      onChange={e => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Specify material, lengths, buttons, styles, and sleeve adjustments..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {viewingAudit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Audit Trail: {viewingAudit.order.order_no}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewingAudit(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Full system change history logs for audit compliance.
              </p>
              <div className="timeline">
                {viewingAudit.edits.map((edit, idx) => (
                  <div className="timeline-item" key={idx}>
                    <div className="timeline-marker">
                      <div className="timeline-dot"></div>
                      {idx !== viewingAudit.edits.length - 1 && <div className="timeline-line"></div>}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-time">{edit.date} • {edit.user}</div>
                      <div className="timeline-text">
                        <strong>{edit.action}</strong>: {edit.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setViewingAudit(null)}>Close Audit Trail</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
