import React, { useState } from 'react';
import { db } from '../lib/db';
import { Plus, Search, Edit2, Trash2, Eye, X, Check, RefreshCw, Users } from 'lucide-react';

export default function CustomerModule({ activeRole, triggerUpdate }) {
  const [customers, setCustomers] = useState(db.getCustomers());
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    preferences: '',
    notes: '',
    referralSource: '',
    referralDetails: '',
    referralDetailsOther: ''
  });

  const refreshList = () => {
    setCustomers(db.getCustomers());
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAddModal = () => {
    setFormData({ 
      name: '', 
      contact: '', 
      email: '', 
      preferences: '', 
      notes: '', 
      referralSource: '', 
      referralDetails: '',
      referralDetailsOther: ''
    });
    setEditingCustomer(null);
    setShowFormModal(true);
  };

  const openEditModal = (cust) => {
    const isOtherDetails = cust.referralDetails && cust.referralDetails.startsWith('Other: ');
    setFormData({
      name: cust.name,
      contact: cust.contact,
      email: cust.email || '',
      preferences: cust.preferences || '',
      notes: cust.notes || '',
      referralSource: cust.referralSource || '',
      referralDetails: cust.referralDetails || '',
      referralDetailsOther: isOtherDetails ? cust.referralDetails.substring(7) : ''
    });
    setEditingCustomer(cust);
    setShowFormModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contact) {
      alert('Name and Contact are required.');
      return;
    }

    const { referralDetailsOther, ...cleanFormData } = formData;
    const saved = db.saveCustomer({
      ...(editingCustomer ? { id: editingCustomer.id } : {}),
      ...cleanFormData
    });

    setNotification({
      type: 'success',
      message: `Customer "${saved.name}" saved successfully!`
    });
    setShowFormModal(false);
    refreshList();
    triggerUpdate();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    const result = db.deleteCustomer(id);
    if (result.status === 'pending_approval') {
      setNotification({
        type: 'warning',
        message: 'Delete request sent to Manager approval queue.'
      });
    } else {
      setNotification({
        type: 'success',
        message: 'Customer deleted successfully.'
      });
    }
    refreshList();
    triggerUpdate();
    setTimeout(() => setNotification(null), 4000);
  };

  const showCustomerDetails = (cust) => {
    // Fetch customer's orders
    const orders = db.getOrders().filter(o => o.customer_id === cust.id);
    setViewingHistory({ customer: cust, orders });
  };

  // Determine permissions
  const isReadOnly = activeRole === 'boss';
  const canDelete = activeRole !== 'boss'; // Officer can request it

  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <Users style={{ color: 'var(--color-primary)' }} size={20} />
          Customer Profiles
        </h3>
        {!isReadOnly && (
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            <Plus size={16} /> Add Customer
          </button>
        )}
      </div>

      <div className="card-body">
        {notification && (
          <div className={`alert-banner mb-md ${notification.type === 'success' ? 'info' : 'warning'}`} style={{ marginBottom: '1.25rem' }}>
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
              placeholder="Search by name, contact, email..." 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={refreshList} title="Refresh customer data">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Preferences</th>
                <th>Orders Completed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No customer profiles found. Click "Add Customer" to enroll a new client.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id}>
                    <td style={{ fontWeight: 600 }}>
                      {cust.name}
                      {cust.referralSource && (
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '0.125rem' }}>
                          via {cust.referralSource} {cust.referralDetails ? `(${cust.referralDetails})` : ''}
                        </div>
                      )}
                    </td>
                    <td>{cust.contact}</td>
                    <td>{cust.email || '—'}</td>
                    <td style={{ maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={cust.preferences}>
                      {cust.preferences || '—'}
                    </td>
                    <td>
                      <span className="badge info">{cust.serviceHistoryCount} Orders</span>
                    </td>
                    <td>
                      <div className="filter-actions">
                        <button className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => showCustomerDetails(cust)} title="View Stitching History">
                          <Eye size={14} /> History
                        </button>
                        {!isReadOnly && (
                          <button className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openEditModal(cust)} title="Edit Profile">
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button className="btn btn-secondary btn-sm text-red" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(cust.id)} title="Delete Profile">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCustomer ? 'Edit Customer Profile' : 'Enroll New Customer'}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowFormModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Full Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Number *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={formData.contact}
                      onChange={e => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Stitching & Service Preferences</label>
                    <textarea 
                      className="form-textarea" 
                      value={formData.preferences}
                      onChange={e => setFormData({ ...formData, preferences: e.target.value })}
                      placeholder="Enter fabric choices, measurements, collar types, cuffs, or fitting details..."
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">General Account Notes</label>
                    <textarea 
                      className="form-textarea" 
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any notes about behavior, billing, or style preferences..."
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">How they know JB groups (Referral Source)</label>
                    <select 
                      className="form-select" 
                      value={formData.referralSource}
                      onChange={e => {
                        const source = e.target.value;
                        setFormData({ ...formData, referralSource: source, referralDetails: '', referralDetailsOther: '' });
                      }}
                    >
                      <option value="">Select Option</option>
                      <option value="Social Media">Social Media</option>
                      <option value="In-Person Visit">In-Person Visit</option>
                      <option value="Customer Referral">Other Customer Referral</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {formData.referralSource === 'Social Media' && (
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Social Media Platform</label>
                      <select 
                        className="form-select" 
                        value={formData.referralDetails.startsWith('Other: ') ? 'Other Social Media' : formData.referralDetails}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'Other Social Media') {
                            setFormData({ ...formData, referralDetails: `Other: ${formData.referralDetailsOther || ''}` });
                          } else {
                            setFormData({ ...formData, referralDetails: val });
                          }
                        }}
                      >
                        <option value="">Select Platform</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Google Search">Google Search</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Other Social Media">Other Social Media</option>
                      </select>
                      {(formData.referralDetails === 'Other Social Media' || formData.referralDetails.startsWith('Other: ')) && (
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Please specify platform..."
                          value={formData.referralDetailsOther}
                          onChange={e => setFormData({ ...formData, referralDetails: `Other: ${e.target.value}`, referralDetailsOther: e.target.value })}
                          style={{ marginTop: '0.5rem' }}
                        />
                      )}
                    </div>
                  )}

                  {formData.referralSource === 'In-Person Visit' && (
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">In-Person Details</label>
                      <select 
                        className="form-select" 
                        value={formData.referralDetails.startsWith('Other: ') ? 'Other' : formData.referralDetails}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'Other') {
                            setFormData({ ...formData, referralDetails: `Other: ${formData.referralDetailsOther || ''}` });
                          } else {
                            setFormData({ ...formData, referralDetails: val });
                          }
                        }}
                      >
                        <option value="">Select Option</option>
                        <option value="Walk-in / Signboard">Walk-in / Signboard</option>
                        <option value="Local Event">Local Event</option>
                        <option value="Flyer / Poster">Flyer / Poster</option>
                        <option value="Word of Mouth (General)">Word of Mouth (General)</option>
                        <option value="Other">Other</option>
                      </select>
                      {(formData.referralDetails === 'Other' || formData.referralDetails.startsWith('Other: ')) && (
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Please specify..."
                          value={formData.referralDetailsOther}
                          onChange={e => setFormData({ ...formData, referralDetails: `Other: ${e.target.value}`, referralDetailsOther: e.target.value })}
                          style={{ marginTop: '0.5rem' }}
                        />
                      )}
                    </div>
                  )}

                  {formData.referralSource === 'Customer Referral' && (
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Referred By Customer</label>
                      <select 
                        className="form-select" 
                        value={formData.referralDetails.startsWith('Other: ') ? 'Other Person' : formData.referralDetails}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'Other Person') {
                            setFormData({ ...formData, referralDetails: `Other: ${formData.referralDetailsOther || ''}` });
                          } else {
                            setFormData({ ...formData, referralDetails: val });
                          }
                        }}
                      >
                        <option value="">Select Referring Customer</option>
                        {customers
                          .filter(c => !editingCustomer || c.id !== editingCustomer.id)
                          .map(c => (
                            <option key={c.id} value={c.name}>{c.name} ({c.contact})</option>
                          ))
                        }
                        <option value="Other Person">Other Person (Not Listed)</option>
                      </select>
                      {(formData.referralDetails === 'Other Person' || formData.referralDetails.startsWith('Other: ')) && (
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Enter referrer name..."
                          value={formData.referralDetailsOther}
                          onChange={e => setFormData({ ...formData, referralDetails: `Other: ${e.target.value}`, referralDetailsOther: e.target.value })}
                          style={{ marginTop: '0.5rem' }}
                        />
                      )}
                    </div>
                  )}

                  {formData.referralSource === 'Other' && (
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Referral Details</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Please specify how they knew us..."
                        value={formData.referralDetails}
                        onChange={e => setFormData({ ...formData, referralDetails: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Details Modal */}
      {viewingHistory && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Customer Profile & Service History</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewingHistory(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{viewingHistory.customer.name}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ID: {viewingHistory.customer.id} • Registered Active Customer</p>
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Contact</span>
                    <span className="detail-val">{viewingHistory.customer.contact}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-val">{viewingHistory.customer.email || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Preferences</span>
                    <span className="detail-val">{viewingHistory.customer.preferences || 'No specifications'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Account Notes</span>
                    <span className="detail-val">{viewingHistory.customer.notes || 'No general notes'}</span>
                  </div>
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <span className="detail-label">Referral Source (How they know us)</span>
                    <span className="detail-val" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span className="badge info" style={{ borderRadius: '4px', padding: '0.125rem 0.375rem' }}>
                        {viewingHistory.customer.referralSource || 'Not Specified'}
                      </span>
                      {viewingHistory.customer.referralDetails && (
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          — {viewingHistory.customer.referralDetails}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.75rem' }}>Order Stitching Roster ({viewingHistory.orders.length})</h4>
                  <div className="table-container">
                    <table className="data-table" style={{ fontSize: '0.825rem' }}>
                      <thead>
                        <tr>
                          <th>Order No</th>
                          <th>Order Date</th>
                          <th>Due Date</th>
                          <th>Service</th>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Payment</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingHistory.orders.length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                              No orders linked to this profile.
                            </td>
                          </tr>
                        ) : (
                          viewingHistory.orders.map(o => (
                            <tr key={o.id}>
                              <td style={{ fontWeight: 600 }}>{o.order_no}</td>
                              <td>{o.order_date}</td>
                              <td>{o.delivery_date}</td>
                              <td>{o.service_type}</td>
                              <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.note}>{o.note}</td>
                              <td style={{ fontWeight: 600 }}>${Number(o.amount || 0).toFixed(2)}</td>
                              <td>
                                 <span className={`badge ${
                                   o.payment_status === 'paid' ? 'success' : 
                                   o.payment_status === 'partially_paid' ? 'warning' : 'danger'
                                 }`}>
                                   {o.payment_status === 'partially_paid' ? 'partially paid' : o.payment_status}
                                 </span>
                              </td>
                              <td>
                                <span className={`badge ${
                                  o.status === 'completed' || o.status === 'delivered' ? 'success' : 
                                  o.status === 'in-progress' ? 'warning' : 'info'
                                }`}>
                                  {o.status === 'delivered' ? 'delivered to customer' : o.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setViewingHistory(null)}>Close Window</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
