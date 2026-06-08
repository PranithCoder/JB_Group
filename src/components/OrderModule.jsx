import React, { useState } from 'react';
import { db, DRESS_TYPES, TODAY_DATE } from '../lib/db';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, Eye, RefreshCw, Calendar, ShoppingBag } from 'lucide-react';

export default function OrderModule({ activeRole, triggerUpdate }) {
  const [orders, setOrders] = useState(db.getOrders());
  const [customers] = useState(db.getCustomers());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingAudit, setViewingAudit] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [custSearch, setCustSearch] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [newlyBookedOrder, setNewlyBookedOrder] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [completedFromDate, setCompletedFromDate] = useState(TODAY_DATE);
  const [completedToDate, setCompletedToDate] = useState(TODAY_DATE);
  const [viewingPhotos, setViewingPhotos] = useState(null);

  const [formData, setFormData] = useState({
    customer_id: '',
    delivery_date: '',
    delivery_time: '17:00',
    is_urgent: false,
    service_type: 'Stitching',
    dress_type: 'modern dress (Custom)',
    note: '',
    status: 'pending',
    amount: '',
    payment_status: 'unpaid',
    amount_paid: '',
    assigned_staff_id: '',
    cutting_staff_id: '',
    cutting_status: 'pending',
    bill_no: ''
  });

  const refreshList = () => {
    setOrders(db.getOrders());
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const getDaysRemaining = (dueDateStr) => {
    const today = new Date(TODAY_DATE); // Dynamic local time reference
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
    if (statusFilter === 'completed') {
      const compDate = o.completed_date || o.delivery_date;
      return (o.status === 'completed' || o.status === 'delivered') && compDate >= completedFromDate && compDate <= completedToDate;
    }
    if (statusFilter === 'delivered') {
      const compDate = o.completed_date || o.delivery_date;
      return o.status === 'delivered' && compDate >= completedFromDate && compDate <= completedToDate;
    }
    if (statusFilter === 'cancelled') {
      const cancelDate = o.cancelled_at ? o.cancelled_at.split('T')[0] : o.delivery_date;
      return o.status === 'cancelled' && cancelDate >= completedFromDate && cancelDate <= completedToDate;
    }
    return o.status === statusFilter;
  });

  const openAddModal = () => {
    setFormData({
      customer_id: '',
      delivery_date: TODAY_DATE, // Default to today
      delivery_time: '17:00',
      is_urgent: false,
      service_type: 'Stitching',
      dress_type: 'modern dress (Custom)',
      note: '',
      status: 'pending',
      amount: '',
      payment_status: 'unpaid',
      amount_paid: '',
      assigned_staff_id: '',
      cutting_staff_id: '',
      cutting_status: 'pending',
      bill_no: ''
    });
    setCustSearch('');
    setEditingOrder(null);
    setShowFormModal(true);
  };

  const openEditModal = (order) => {
    const matchingCust = customers.find(c => c.id === order.customer_id);
    setFormData({
      customer_id: order.customer_id,
      delivery_date: order.delivery_date,
      delivery_time: order.delivery_time || '17:00',
      is_urgent: !!order.is_urgent,
      service_type: order.service_type,
      dress_type: order.dress_type || 'modern dress (Custom)',
      note: order.note || '',
      status: order.status,
      amount: order.amount,
      payment_status: order.payment_status,
      amount_paid: order.amount_paid !== undefined ? order.amount_paid : (order.payment_status === 'paid' ? order.amount : 0),
      assigned_staff_id: order.assigned_staff_id || '',
      cutting_staff_id: order.cutting_staff_id || '',
      cutting_status: order.cutting_status || 'pending',
      bill_no: order.bill_no || '',
      cancellation_reason: order.cancellation_reason || ''
    });
    setCustSearch(matchingCust ? `${matchingCust.name} (${matchingCust.contact})` : '');
    setEditingOrder(order);
    setShowFormModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    try {
      if (!formData.customer_id) {
        alert('Please search and select a valid customer from the dropdown list.');
        return;
      }
      if (!formData.delivery_date || !formData.amount) {
        alert('Required fields are missing.');
        return;
      }
      if (formData.status === 'cancelled' && (!formData.cancellation_reason || !formData.cancellation_reason.trim())) {
        alert('Please enter a cancellation reason.');
        return;
      }
      let finalPaymentStatus = formData.payment_status;
      let finalAmountPaid = 0;

      if (formData.status === 'delivered' && formData.payment_status !== 'paid') {
        const totalAmount = Number(formData.amount || 0);
        const amountPaid = formData.payment_status === 'partially_paid' ? Number(formData.amount_paid || 0) : 0;
        const balance = totalAmount - amountPaid;
        const confirmPaid = window.confirm(`Customer has an outstanding balance of Rs. ${balance.toFixed(2)}.\n\nMark order as FULLY PAID and complete delivery?`);
        if (confirmPaid) {
          finalPaymentStatus = 'paid';
          finalAmountPaid = totalAmount;
        } else {
          alert("Delivery aborted. Outstanding balance must be paid first.");
          return;
        }
      } else {
        if (formData.payment_status === 'paid') {
          finalAmountPaid = Number(formData.amount);
        } else if (formData.payment_status === 'partially_paid') {
          finalAmountPaid = Number(formData.amount_paid);
          if (isNaN(finalAmountPaid) || finalAmountPaid <= 0 || finalAmountPaid >= Number(formData.amount)) {
            alert('For partially paid status, please enter a valid paid amount (greater than 0 and less than the quoted price).');
            return;
          }
        }
      }

      let finalBillNo = formData.bill_no;
      if (formData.status === 'delivered' && !finalBillNo) {
        const billNo = window.prompt("Please enter the Written Bill Number for this delivery:");
        if (billNo === null) {
          alert("Delivery aborted. Written Bill Number is required.");
          return;
        }
        if (!billNo.trim()) {
          alert("Delivery aborted. Written Bill Number cannot be empty.");
          return;
        }
        finalBillNo = billNo.trim();
      }

      const payload = {
        ...(editingOrder ? { id: editingOrder.id } : {}),
        customer_id: formData.customer_id,
        delivery_date: formData.delivery_date,
        delivery_time: formData.delivery_time || '17:00',
        is_urgent: !!formData.is_urgent,
        service_type: formData.service_type,
        dress_type: formData.dress_type,
        note: formData.note,
        status: formData.status,
        amount: Number(formData.amount),
        payment_status: finalPaymentStatus,
        amount_paid: finalAmountPaid,
        assigned_staff_id: formData.assigned_staff_id,
        cutting_staff_id: formData.cutting_staff_id || '',
        cutting_status: formData.cutting_status || 'pending',
        bill_no: finalBillNo,
        ...(formData.status === 'cancelled' ? {
          cancellation_reason: (formData.cancellation_reason || '').trim(),
          cancelled_at: editingOrder?.cancelled_at || new Date().toISOString()
        } : {})
      };

      const result = db.saveOrder(payload);

      if (result.status === 'pending_approval') {
        setNotification({
          type: 'warning',
          message: 'Critical edit (Delivery Date/Amount change) sent to Manager approvals queue.'
        });
        setTimeout(() => setNotification(null), 4000);
        setShowFormModal(false);
        refreshList();
        triggerUpdate();
      } else {
        if (!editingOrder && result.data) {
          setNewlyBookedOrder(result.data);
          setShowShareModal(true);
          setShowFormModal(false);
          refreshList();
          // NOTE: triggerUpdate() is deferred until the share modal is closed to prevent component unmounting!
        } else {
          setNotification({
            type: 'success',
            message: `Order saved successfully.`
          });
          setTimeout(() => setNotification(null), 4000);
          setShowFormModal(false);
          refreshList();
          triggerUpdate();
        }
      }
    } catch (err) {
      console.error("Error in handleSave:", err);
      alert("Error saving order: " + err.message);
    }
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setNewlyBookedOrder(null);
    triggerUpdate();
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

  const handleQuickStatusChange = (orderId, newStatus) => {
    const original = orders.find(o => o.id === orderId);
    if (!original) return;

    let payload = {
      ...original,
      status: newStatus
    };

    if (newStatus === 'delivered') {
      if (original.payment_status !== 'paid') {
        const balance = original.amount - (original.amount_paid || 0);
        const confirmPaid = window.confirm(`Customer has an outstanding balance of Rs. ${balance.toFixed(2)}.\n\nMark order as FULLY PAID and complete delivery?`);
        if (confirmPaid) {
          payload.payment_status = 'paid';
          payload.amount_paid = original.amount;
        } else {
          alert("Delivery aborted. Outstanding balance must be paid first.");
          return;
        }
      }

      const billNo = window.prompt("Please enter the Written Bill Number for this delivery:");
      if (billNo === null) {
        alert("Delivery aborted. Written Bill Number is required.");
        return;
      }
      if (!billNo.trim()) {
        alert("Delivery aborted. Written Bill Number cannot be empty.");
        return;
      }
      payload.bill_no = billNo.trim();
    }

    if (newStatus === 'cancelled') {
      const reason = window.prompt("Please enter the reason for cancellation:");
      if (reason === null) {
        refreshList();
        return;
      }
      if (!reason.trim()) {
        alert("Cancellation aborted. Reason is required.");
        refreshList();
        return;
      }
      payload.cancellation_reason = reason.trim();
      payload.cancelled_at = new Date().toISOString();
    }

    try {
      const result = db.saveOrder(payload);
      if (result.status === 'success') {
        setNotification({
          type: 'success',
          message: `Order ${original.order_no} status updated to ${newStatus}.`
        });
        refreshList();
        triggerUpdate();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      alert(err.message);
    }
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
            <div className="role-switcher">
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
                onClick={() => setStatusFilter('delivered')}
                className={`role-btn ${statusFilter === 'delivered' ? 'active' : ''}`}
                style={{ padding: '0.25rem 0.625rem', fontSize: '0.775rem' }}
              >
                Delivered
              </button>
              <button 
                onClick={() => setStatusFilter('cancelled')}
                className={`role-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
                style={{ padding: '0.25rem 0.625rem', fontSize: '0.775rem', color: 'var(--color-danger)' }}
              >
                Cancelled
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

            {(statusFilter === 'completed' || statusFilter === 'delivered' || statusFilter === 'cancelled') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', padding: '0.25rem 0.5rem', backgroundColor: '#fafafa', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ padding: '0.125rem 0.375rem', fontSize: '0.75rem', width: 'auto', border: 'none', background: 'none' }}
                  value={completedFromDate}
                  onChange={e => setCompletedFromDate(e.target.value)}
                />
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ padding: '0.125rem 0.375rem', fontSize: '0.75rem', width: 'auto', border: 'none', background: 'none' }}
                  value={completedToDate}
                  onChange={e => setCompletedToDate(e.target.value)}
                />
                <span style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: '0.5rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                  Filtered Count: {filteredOrders.length}
                </span>
              </div>
            )}

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
                <th>Order / Bill No</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Delivery Due Date</th>
                <th>Service Type</th>
                <th>Assigned Tailor</th>
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
                  <td colSpan="11" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => {
                  const daysLeft = getDaysRemaining(ord.delivery_date);
                  let dueLabel = ord.delivery_date;
                  let styleClass = '';
                  
                  if (ord.status === 'completed') {
                    dueLabel = `Completed: ${ord.completed_date || ord.delivery_date}`;
                    styleClass = 'text-green';
                  } else if (ord.status === 'delivered') {
                    dueLabel = `Delivered: ${ord.completed_date || ord.delivery_date}`;
                    styleClass = 'text-green';
                  } else {
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
                    <tr key={ord.id} style={{ 
                      backgroundColor: ord.is_urgent ? '#fef2f2' : (isOverdue(ord) ? 'var(--color-danger-light)' : 'inherit'),
                      borderLeft: ord.is_urgent ? '4px solid var(--color-danger)' : 'none'
                    }}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          {ord.is_urgent && <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>⚡</span>}
                          <span>{ord.order_no}</span>
                        </div>
                        {ord.bill_no && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                            Bill: {ord.bill_no}
                          </div>
                        )}
                      </td>
                      <td>
                        {ord.customer ? (
                          <button 
                            type="button"
                            onClick={() => setViewingCustomer(ord.customer)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              margin: 0,
                              fontFamily: 'inherit',
                              fontSize: 'inherit',
                              fontWeight: 600,
                              color: 'var(--color-primary)',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              textAlign: 'left'
                            }}
                            title="Click to view customer details"
                          >
                            {ord.customer.name}
                          </button>
                        ) : '—'}
                      </td>
                      <td>{ord.order_date}</td>
                      <td className={styleClass} style={{ fontWeight: styleClass ? '600' : 'normal' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem' }}>
                          <Calendar size={14} style={{ marginTop: '0.125rem' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{dueLabel}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                              Time: {ord.delivery_time || '17:00'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{ord.service_type}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {ord.dress_type}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                          <div style={{ fontSize: '0.825rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem', fontWeight: 600 }}>Cut:</span>{' '}
                            {ord.cuttingStaff ? (
                              <span>
                                <strong>{ord.cuttingStaff.name}</strong>
                                <span className={`badge ${ord.cutting_status === 'completed' ? 'success' : 'warning'}`} style={{ fontSize: '0.625rem', padding: '0.05rem 0.25rem', marginLeft: '0.25rem', display: 'inline-flex', transform: 'scale(0.9)' }}>
                                  {ord.cutting_status}
                                </span>
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.825rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem', fontWeight: 600 }}>Stitch:</span>{' '}
                            {ord.assignedStaff ? (
                              <strong>{ord.assignedStaff.name}</strong>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ord.note}>
                        <div>{ord.note || '—'}</div>
                        {ord.status === 'cancelled' && ord.cancellation_reason && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 500, marginTop: '0.25rem', whiteSpace: 'normal' }}>
                            <strong>Cancelled:</strong> {ord.cancellation_reason}
                            {ord.cancelled_at && (
                              <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', display: 'block' }}>
                                ({new Date(ord.cancelled_at).toLocaleDateString()})
                              </span>
                            )}
                          </div>
                        )}
                        {(ord.photo_front || ord.photo_back) && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm" 
                              style={{ padding: '0.1rem 0.35rem', fontSize: '0.675rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--color-success)', color: 'var(--color-success)', background: 'var(--color-success-light)' }} 
                              onClick={() => setViewingPhotos(ord)}
                            >
                              🖼️ View Photos
                            </button>
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>Rs. {Number(ord.amount || 0).toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span className={`badge ${
                            ord.payment_status === 'paid' ? 'success' : 
                            ord.payment_status === 'partially_paid' ? 'warning' : 'danger'
                          }`}>
                            {ord.payment_status === 'partially_paid' ? 'partially paid' : ord.payment_status}
                          </span>
                          {ord.payment_status === 'partially_paid' && (
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                              Paid: Rs. {Number(ord.amount_paid || 0).toFixed(2)}<br/>
                              Bal: Rs. {Number(ord.amount - (ord.amount_paid || 0)).toFixed(2)}
                            </div>
                          )}
                          {ord.payment_status === 'unpaid' && (
                            <div style={{ fontSize: '0.725rem', color: 'var(--color-danger)', fontWeight: 500 }}>
                              Bal: Rs. {Number(ord.amount).toFixed(2)}
                            </div>
                          )}

                        </div>
                      </td>
                      <td>
                        {isReadOnly ? (
                          <span className={`badge ${
                            ord.status === 'completed' || ord.status === 'delivered' ? 'success' : 
                            ord.status === 'in-progress' ? 'warning' : 
                            ord.status === 'cancelled' ? 'danger' : 'info'
                          }`}>
                            {ord.status === 'delivered' ? 'delivered to customer' : ord.status}
                          </span>
                        ) : (
                          <select
                            value={ord.status}
                            onChange={(e) => handleQuickStatusChange(ord.id, e.target.value)}
                            className="form-select"
                            style={{
                              padding: '0.125rem 0.5rem',
                              fontSize: '0.75rem',
                              width: 'auto',
                              borderRadius: '4px',
                              fontWeight: 600,
                              backgroundColor: 
                                ord.status === 'completed' || ord.status === 'delivered' ? 'var(--color-success-light)' : 
                                ord.status === 'in-progress' ? 'var(--color-warning-light)' : 
                                ord.status === 'cancelled' ? 'var(--color-danger-light)' : 'var(--color-primary-light)',
                              color: 
                                ord.status === 'completed' || ord.status === 'delivered' ? 'var(--color-success)' : 
                                ord.status === 'in-progress' ? '#b45309' : 
                                ord.status === 'cancelled' ? 'var(--color-danger)' : 'var(--color-primary)',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {ord.status === 'pending' && (
                              <>
                                <option value="pending">Pending</option>
                                <option value="in-progress">In-Progress</option>
                                <option value="cancelled">Cancelled</option>
                              </>
                            )}
                            {ord.status === 'in-progress' && (
                              <>
                                <option value="in-progress">In-Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </>
                            )}
                            {ord.status === 'completed' && (
                              <>
                                <option value="completed">Completed</option>
                                <option value="delivered">Delivered to the customer</option>
                                <option value="cancelled">Cancelled</option>
                              </>
                            )}
                            {ord.status === 'delivered' && (
                              <option value="delivered">Delivered to the customer</option>
                            )}
                            {ord.status === 'cancelled' && (
                              <option value="cancelled">Cancelled</option>
                            )}
                          </select>
                        )}
                      </td>
                      <td>
                        <div className="filter-actions">
                          <button className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => viewAuditLog(ord)} title="Audit Trail">
                            <Eye size={14} /> Audit
                          </button>
                          {!isReadOnly && ord.status !== 'completed' && ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                            <button className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openEditModal(ord)} title="Edit Order Details">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {!isReadOnly && ord.status !== 'completed' && ord.status !== 'delivered' && ord.status !== 'cancelled' && (
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
              <h3>{editingOrder ? `Edit Booked Order: ${editingOrder.order_no}` : `Book Stitching/Alteration Order (Order No: ${db.getNextOrderNo()})`}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowFormModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2', position: 'relative' }}>
                    <label className="form-label">Client Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Type name or contact number to search..." 
                      value={custSearch}
                      onChange={e => {
                        setCustSearch(e.target.value);
                        setShowCustDropdown(true);
                        setFormData(prev => ({ ...prev, customer_id: '' }));
                      }}
                      onFocus={() => setShowCustDropdown(true)}
                      onBlur={() => {
                        setTimeout(() => setShowCustDropdown(false), 250);
                      }}
                    />
                    {showCustDropdown && (
                      <div className="dropdown-menu-custom">
                        {customers.filter(c => 
                          !custSearch ||
                          (c.name || '').toLowerCase().includes(custSearch.toLowerCase()) ||
                          (c.contact || '').includes(custSearch)
                        ).length === 0 ? (
                          <div className="dropdown-item-custom empty">No customers found</div>
                        ) : (
                          customers.filter(c => 
                            !custSearch ||
                            (c.name || '').toLowerCase().includes(custSearch.toLowerCase()) ||
                            (c.contact || '').includes(custSearch)
                          ).map(c => (
                            <div 
                              key={c.id} 
                              className={`dropdown-item-custom ${formData.customer_id === c.id ? 'selected' : ''}`}
                              onMouseDown={() => {
                                setFormData(prev => ({ ...prev, customer_id: c.id }));
                                setCustSearch(`${c.name} (${c.contact})`);
                                setShowCustDropdown(false);
                              }}
                            >
                              <div>
                                <strong>{c.name}</strong>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.contact}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
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
                    <label className="form-label">Assign Stitching Tailor (Optional)</label>
                    <select 
                      className="form-select"
                      value={formData.assigned_staff_id}
                      onChange={e => setFormData({ ...formData, assigned_staff_id: e.target.value })}
                    >
                      <option value="">Unassigned / Pending Pickup</option>
                      {db.getStaff()
                        .filter(s => s.role !== 'Store Assistant')
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.role})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign Cutting Tailor (Optional)</label>
                    <select 
                      className="form-select"
                      value={formData.cutting_staff_id}
                      onChange={e => setFormData({ ...formData, cutting_staff_id: e.target.value })}
                    >
                      <option value="">Unassigned / Pending Pickup</option>
                      {db.getStaff()
                        .filter(s => s.role !== 'Store Assistant' && (formData.dress_type === 'alteration' || s.cutting_skills?.includes(formData.dress_type)))
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.role})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dress Type *</label>
                    <select 
                      className="form-select"
                      value={formData.dress_type || 'modern dress (Custom)'}
                      onChange={e => {
                        const newDressType = e.target.value;
                        const staffList = db.getStaff();
                        let updatedFields = { dress_type: newDressType };
                        
                        // Check if current cutting tailor is still valid
                        if (formData.cutting_staff_id && newDressType !== 'alteration') {
                          const currentCutter = staffList.find(s => s.id === formData.cutting_staff_id);
                          if (!currentCutter || !currentCutter.cutting_skills?.includes(newDressType)) {
                            updatedFields.cutting_staff_id = '';
                          }
                        }
                        
                        setFormData({ ...formData, ...updatedFields });
                      }}
                    >
                      {DRESS_TYPES.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
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
                    <label className="form-label">Delivery Due Time *</label>
                    <input 
                      type="time"
                      className="form-input"
                      required
                      value={formData.delivery_time || '17:00'}
                      onChange={e => setFormData({ ...formData, delivery_time: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <input 
                      type="checkbox"
                      id="is_urgent"
                      checked={formData.is_urgent || false}
                      onChange={e => setFormData({ ...formData, is_urgent: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="is_urgent" className="form-label" style={{ margin: 0, cursor: 'pointer', fontWeight: 600, color: 'var(--color-danger)' }}>
                      Urgent Needed ⚡
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quoted Price (LKR) *</label>
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
                      <option value="partially_paid">Partially Paid</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                  {formData.payment_status === 'partially_paid' && (
                    <div className="form-group">
                      <label className="form-label">Amount Paid (LKR) *</label>
                      <input 
                        type="number"
                        step="0.01"
                        className="form-input"
                        required
                        value={formData.amount_paid}
                        onChange={e => setFormData({ ...formData, amount_paid: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                  {editingOrder && (
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Current Progress Status</label>
                      <select 
                        className="form-select"
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                      >
                        {editingOrder.status === 'pending' && (
                          <>
                            <option value="pending">Pending (Design)</option>
                            <option value="in-progress">In-Progress (Stitching/Cutting)</option>
                            <option value="cancelled">Cancelled</option>
                          </>
                        )}
                        {editingOrder.status === 'in-progress' && (
                          <>
                            <option value="in-progress">In-Progress (Stitching/Cutting)</option>
                            <option value="completed">Completed & Verified</option>
                            <option value="cancelled">Cancelled</option>
                          </>
                        )}
                        {editingOrder.status === 'completed' && (
                          <>
                            <option value="completed">Completed & Verified</option>
                            <option value="delivered">Delivered to the customer</option>
                            <option value="cancelled">Cancelled</option>
                          </>
                        )}
                        {editingOrder.status === 'delivered' && (
                          <option value="delivered">Delivered to the customer</option>
                        )}
                        {editingOrder.status === 'cancelled' && (
                          <option value="cancelled">Cancelled</option>
                        )}
                      </select>
                    </div>
                  )}
                  {formData.status === 'cancelled' && (
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Cancellation Reason *</label>
                      <input 
                        type="text"
                        className="form-input"
                        required
                        value={formData.cancellation_reason || ''}
                        onChange={e => setFormData({ ...formData, cancellation_reason: e.target.value })}
                        placeholder="Please type why this order is being cancelled..."
                      />
                    </div>
                  )}
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

      {/* Customer Details Modal */}
      {viewingCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Customer Contact Card</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewingCustomer(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {viewingCustomer.name}
                  </h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    ID: {viewingCustomer.id}
                  </p>
                </div>
                
                <div className="detail-grid" style={{ gridTemplateColumns: '1fr', gap: '0.75rem', margin: 0 }}>
                  <div className="detail-item">
                    <span className="detail-label">Phone Number</span>
                    <span className="detail-val" style={{ fontSize: '0.95rem' }}>
                      <strong>{viewingCustomer.contact}</strong>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email Address</span>
                    <span className="detail-val" style={{ fontSize: '0.95rem' }}>
                      {viewingCustomer.email || '—'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address</span>
                    <span className="detail-val" style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {viewingCustomer.address || (() => {
                        const addressMap = {
                          'c-1': '456 Silk Road, East Wing',
                          'c-2': 'Enterprise Deck 1, Cargo Bay 2',
                          'c-3': '789 Witchwood Grove',
                          'c-4': 'Tardis Console Room, London',
                          'c-5': '1007 Mountain Drive, Wayne Manor'
                        };
                        return addressMap[viewingCustomer.id] || '123 Custom Fitting Ave, Block B';
                      })()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Stitching Preferences</span>
                    <span className="detail-val" style={{ fontStyle: 'italic', fontSize: '0.875rem' }}>
                      "{viewingCustomer.preferences || 'No style preferences recorded'}"
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Account Notes</span>
                    <span className="detail-val" style={{ fontSize: '0.875rem' }}>
                      {viewingCustomer.notes || 'No general notes'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setViewingCustomer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Share / Receipt Options Modal */}
      {showShareModal && newlyBookedOrder && (() => {
        const customer = customers.find(c => c.id === newlyBookedOrder.customer_id) || { name: 'Valued Customer', contact: '' };
        const cleanPhone = (customer.contact || '').replace(/[^0-9]/g, '');
        const paymentLabel = newlyBookedOrder.payment_status === 'paid' 
          ? 'Paid' 
          : newlyBookedOrder.payment_status === 'partially_paid'
          ? `Partially Paid (Paid: Rs. ${Number(newlyBookedOrder.amount_paid || 0).toFixed(2)}, Bal: Rs. ${Number(newlyBookedOrder.amount - (newlyBookedOrder.amount_paid || 0)).toFixed(2)})`
          : `Unpaid (Bal: Rs. ${Number(newlyBookedOrder.amount).toFixed(2)})`;

        const messageText = `Dear ${customer.name}, your tailor booking is confirmed!
Order No: ${newlyBookedOrder.order_no}${newlyBookedOrder.bill_no ? `\nBill No: ${newlyBookedOrder.bill_no}` : ''}
Service: ${newlyBookedOrder.service_type} (${newlyBookedOrder.dress_type || 'modern dress (Custom)'})
Price: Rs. ${Number(newlyBookedOrder.amount).toFixed(2)} [${paymentLabel}]
Delivery Due: ${newlyBookedOrder.delivery_date}
Notes: ${newlyBookedOrder.note || '—'}
Thank you for choosing JB Groups Tailoring Shop!`;


        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

        const handlePrint = () => {
          const printWindow = window.open('', '_blank', 'width=600,height=600');
          printWindow.document.write(`
            <html>
              <head>
                <title>Receipt - ${newlyBookedOrder.order_no}</title>
                <style>
                  body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 20px; color: #333; line-height: 1.5; }
                  .receipt-box { max-width: 400px; margin: auto; border: 1px dashed #bbb; padding: 20px; border-radius: 8px; }
                  .title { text-align: center; font-size: 22px; font-weight: bold; margin-bottom: 5px; letter-spacing: 1px; }
                  .subtitle { text-align: center; font-size: 12px; color: #666; margin-bottom: 20px; }
                  .divider { border-top: 1px dashed #bbb; margin: 15px 0; }
                  .info-row { display: flex; justify-content: space-between; font-size: 14px; margin: 6px 0; }
                  .label { color: #666; }
                  .value { font-weight: 600; }
                  .total { font-size: 18px; font-weight: bold; }
                  .footer-msg { text-align: center; font-size: 11px; color: #777; margin-top: 25px; }
                  @media print {
                    body { padding: 0; }
                    .receipt-box { border: none; }
                  }
                </style>
              </head>
              <body>
                <div class="receipt-box">
                  <div class="title">JB GROUPS</div>
                  <div class="subtitle">Bespoke Tailoring & Alteration Shop</div>
                  
                  <div class="info-row">
                    <span class="label">Order Number:</span>
                    <span class="value">${newlyBookedOrder.order_no}</span>
                  </div>
                  ${newlyBookedOrder.bill_no ? `
                  <div class="info-row">
                    <span class="label">Written Bill Number:</span>
                    <span class="value">${newlyBookedOrder.bill_no}</span>
                  </div>
                  ` : ''}
                  <div class="info-row">
                    <span class="label">Date Booked:</span>
                    <span class="value">June 1, 2026</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Estimated Delivery:</span>
                    <span class="value">${newlyBookedOrder.delivery_date}</span>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <div class="info-row">
                    <span class="label">Client Name:</span>
                    <span class="value">${customer.name}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Contact No:</span>
                    <span class="value">${customer.contact}</span>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <div class="info-row">
                    <span class="label">Service Category:</span>
                    <span class="value">${newlyBookedOrder.service_type}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Dress Type:</span>
                    <span class="value" style="text-transform: capitalize;">${newlyBookedOrder.dress_type || 'modern dress (Custom)'}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Fabric / Notes:</span>
                    <span class="value" style="text-align: right; max-width: 220px; word-break: break-all;">
                      ${newlyBookedOrder.note || 'None'}
                    </span>
                  </div>
                  <div class="info-row">
                    <span class="label">Payment status:</span>
                    <span class="value" style="text-transform: capitalize;">
                      ${newlyBookedOrder.payment_status === 'partially_paid' ? 'Partially Paid' : newlyBookedOrder.payment_status}
                    </span>
                  </div>
                  {newlyBookedOrder.payment_status === 'partially_paid' && (
                    <>
                      <div class="info-row">
                        <span class="label">Amount Paid:</span>
                        <span class="value">Rs. ${Number(newlyBookedOrder.amount_paid || 0).toFixed(2)}</span>
                      </div>
                      <div class="info-row">
                        <span class="label">Balance Due:</span>
                        <span class="value" style="color: #b45309; font-weight: bold;">
                          Rs. ${Number(newlyBookedOrder.amount - (newlyBookedOrder.amount_paid || 0)).toFixed(2)}
                        </span>
                      </div>

                    </>
                  )}
                  {newlyBookedOrder.payment_status === 'unpaid' && (
                    <div class="info-row">
                      <span class="label">Balance Due:</span>
                      <span class="value" style="color: #ef4444; font-weight: bold;">
                        Rs. ${Number(newlyBookedOrder.amount).toFixed(2)}
                      </span>

                    </div>
                  )}
                  
                  <div class="divider"></div>
                  
                  <div class="info-row total">
                    <span class="label">TOTAL PRICE:</span>
                    <span class="value">Rs. ${Number(newlyBookedOrder.amount).toFixed(2)}</span>

                  </div>
                  
                  <div class="footer-msg">
                    Thank you for your custom!<br>
                    Please present this receipt for pickup.<br>
                    * Fits guaranteed up to 30 days *
                  </div>
                </div>
                <script>
                  window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        };

        return (
          <div className="modal-overlay" style={{ zIndex: 110 }}>
            <div className="modal-content" style={{ maxWidth: '440px' }}>
              <div className="modal-header">
                <h3>Receipt Delivery Options</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={handleCloseShareModal}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Order <strong>{newlyBookedOrder.order_no}</strong> for <strong>{customer.name}</strong> has been booked successfully!
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  
                  {/* WhatsApp click-to-chat */}
                  <a 
                    href={waLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', justifyContent: 'center', backgroundColor: '#25D366' }}
                    onClick={handleCloseShareModal}
                  >
                    Send Receipt via WhatsApp
                  </a>

                  {/* Print POS slip */}
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    style={{ justifyContent: 'center', border: '1px solid #cbd5e1' }}
                    onClick={() => {
                      handlePrint();
                      handleCloseShareModal();
                    }}
                  >
                    Print POS Receipt Slip
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    style={{ justifyContent: 'center', color: 'var(--text-muted)', border: 'none' }}
                    onClick={handleCloseShareModal}
                  >
                    No receipt needed
                  </button>

                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* View Dress Photos Modal */}
      {viewingPhotos && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Dress Photos: {viewingPhotos.order_no}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewingPhotos(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', textAlign: 'center' }}>
                <div>
                  <h4 style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>FRONT VIEW</h4>
                  {viewingPhotos.photo_front ? (
                    <img 
                      src={viewingPhotos.photo_front} 
                      alt="Front View" 
                      style={{ width: '100%', maxHeight: '350px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }} 
                    />
                  ) : (
                    <div style={{ padding: '3rem 1rem', backgroundColor: '#f1f5f9', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No image uploaded</div>
                  )}
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>BACK VIEW</h4>
                  {viewingPhotos.photo_back ? (
                    <img 
                      src={viewingPhotos.photo_back} 
                      alt="Back View" 
                      style={{ width: '100%', maxHeight: '350px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }} 
                    />
                  ) : (
                    <div style={{ padding: '3rem 1rem', backgroundColor: '#f1f5f9', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No image uploaded</div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setViewingPhotos(null)}>Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
