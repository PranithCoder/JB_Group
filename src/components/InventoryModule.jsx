import React, { useState } from 'react';
import { db, TODAY_DATE } from '../lib/db';
import { Boxes, Plus, Trash2, Calendar, FileText, Image, Check, X, RefreshCw } from 'lucide-react';

export default function InventoryModule({ activeRole, triggerUpdate }) {
  const [inventory, setInventory] = useState(db.getInventory());
  const [purchases, setPurchases] = useState(db.getPurchases());
  const [activeTab, setActiveTab] = useState('stock'); // stock | expenses | log_purchase
  const [showItemModal, setShowItemModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // New Item Form State
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Fabrics',
    unit: 'Meters',
    stock_on_hand: 0,
    reorder_threshold: 5,
    unit_cost: 0
  });

  // Purchase Form State
  const [purchaseForm, setPurchaseForm] = useState({
    item_id: '',
    quantity: '',
    total_cost: '',
    date: TODAY_DATE,
    receipt_url: ''
  });

  const refreshData = () => {
    setInventory(db.getInventory());
    setPurchases(db.getPurchases());
  };

  const handleCreateItem = (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.unit) return;

    db.saveInventoryItem({
      name: itemForm.name,
      category: itemForm.category,
      unit: itemForm.unit,
      stock_on_hand: Number(itemForm.stock_on_hand),
      reorder_threshold: Number(itemForm.reorder_threshold),
      unit_cost: Number(itemForm.unit_cost)
    });

    setNotification({
      type: 'success',
      message: `Item "${itemForm.name}" created successfully!`
    });
    setShowItemModal(false);
    refreshData();
    triggerUpdate();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRecordPurchase = (e) => {
    e.preventDefault();
    if (!purchaseForm.item_id || !purchaseForm.quantity || !purchaseForm.total_cost) {
      alert('Please fill out all fields.');
      return;
    }

    // Receipt URL Mocking: generate a premium mockup stock photo if they don't upload
    const mockReceipts = [
      'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=300&auto=format&fit=crop'
    ];
    const finalReceiptUrl = purchaseForm.receipt_url || mockReceipts[Math.floor(Math.random() * mockReceipts.length)];

    db.savePurchase({
      item_id: purchaseForm.item_id,
      quantity: Number(purchaseForm.quantity),
      total_cost: Number(purchaseForm.total_cost),
      date: purchaseForm.date,
      receipt_url: finalReceiptUrl
    });

    setNotification({
      type: 'success',
      message: 'Purchase recorded successfully. Stock counts updated.'
    });

    // Reset Form
    setPurchaseForm({
      item_id: inventory[0]?.id || '',
      quantity: '',
      total_cost: '',
      date: TODAY_DATE,
      receipt_url: ''
    });
    setActiveTab('stock');
    refreshData();
    triggerUpdate();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteItem = (id) => {
    if (!confirm('Are you sure you want to delete this catalog item? This will break stock levels for orders.')) return;
    const result = db.deleteInventoryItem(id);

    if (result.status === 'error') {
      setNotification({
        type: 'danger',
        message: result.message
      });
    } else {
      setNotification({
        type: 'success',
        message: 'Item deleted from catalog.'
      });
    }
    refreshData();
    triggerUpdate();
    setTimeout(() => setNotification(null), 4000);
  };

  // Group purchases by category for daily expense insights
  const expenseByCategory = purchases.reduce((acc, p) => {
    const cat = p.item?.category || 'General';
    acc[cat] = (acc[cat] || 0) + Number(p.total_cost);
    return acc;
  }, {});

  const isReadOnly = activeRole === 'boss';
  const isSuperAdmin = activeRole === 'super_admin';

  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <Boxes style={{ color: 'var(--color-primary)' }} size={20} />
          Inventory Catalog & Expenses
        </h3>
        {activeTab === 'stock' && !isReadOnly && (
          <button className="btn btn-primary btn-sm" onClick={() => {
            setItemForm({ name: '', category: 'Fabrics', unit: 'Meters', stock_on_hand: 0, reorder_threshold: 5, unit_cost: 0 });
            setShowItemModal(true);
          }}>
            <Plus size={16} /> New Item Catalog
          </button>
        )}
      </div>

      <div className="card-body">
        {notification && (
          <div className={`alert-banner mb-md ${notification.type === 'success' ? 'info' : 'danger'}`}>
            <div className="alert-banner-left">
              <span>{notification.message}</span>
            </div>
            <button className="alert-action-btn" onClick={() => setNotification(null)}>Dismiss</button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="toolbar" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button 
              className={`role-btn ${activeTab === 'stock' ? 'active' : ''}`}
              onClick={() => setActiveTab('stock')}
            >
              Current Stock Levels
            </button>
            <button 
              className={`role-btn ${activeTab === 'expenses' ? 'active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              Purchases Log (Cash-Out)
            </button>
            {!isReadOnly && (
              <button 
                className={`role-btn ${activeTab === 'log_purchase' ? 'active' : ''}`}
                onClick={() => {
                  setPurchaseForm(prev => ({ ...prev, item_id: inventory[0]?.id || '' }));
                  setActiveTab('log_purchase');
                }}
              >
                + Record Daily Purchase
              </button>
            )}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={refreshData}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Tab 1: Current Stock levels */}
        {activeTab === 'stock' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Stock On Hand</th>
                  <th>Reorder Threshold</th>
                  <th>Estimated Cost / Unit</th>
                  <th>Stock Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => {
                  const isLow = item.stock_on_hand < item.reorder_threshold;
                  return (
                    <tr key={item.id} style={{ backgroundColor: isLow ? 'var(--color-danger-light)' : 'inherit' }}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td><span className="badge info">{item.category}</span></td>
                      <td style={{ fontWeight: 600 }}>
                        {item.stock_on_hand} {item.unit}
                      </td>
                      <td>{item.reorder_threshold} {item.unit}</td>
                      <td>Rs. {Number(item.unit_cost || 0).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${isLow ? 'danger' : 'success'}`}>
                          {isLow ? '⚠️ Low Stock' : 'Good Level'}
                        </span>
                      </td>
                      <td>
                        {!isReadOnly ? (
                          <button 
                            className="btn btn-secondary btn-sm text-red" 
                            style={{ padding: '0.25rem 0.5rem' }} 
                            onClick={() => handleDeleteItem(item.id)}
                            title="Delete Item (Requires Super-Admin)"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Expenses Log */}
        {activeTab === 'expenses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Category Expenses Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {Object.keys(expenseByCategory).map(cat => (
                <div key={cat} className="detail-item" style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {cat} Purchases
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                    Rs. {Number(expenseByCategory[cat] || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Item Purchased</th>
                    <th>Category</th>
                    <th>Quantity Recv.</th>
                    <th>Total Cost</th>
                    <th>Receipt Copy</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No daily purchases logged yet.
                      </td>
                    </tr>
                  ) : (
                    purchases.map(p => (
                      <tr key={p.id}>
                        <td>{p.date}</td>
                        <td style={{ fontWeight: 600 }}>{p.item?.name || 'Deleted Item'}</td>
                        <td><span className="badge info">{p.item?.category || 'General'}</span></td>
                        <td>{p.quantity} {p.item?.unit || ''}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-danger)' }}>-Rs. {Number(p.total_cost || 0).toFixed(2)}</td>
                        <td>
                          {p.receipt_url ? (
                            <a href={p.receipt_url} target="_blank" rel="noreferrer" className="badge success" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Image size={12} /> View Receipt
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>No upload</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Record Purchase Form */}
        {activeTab === 'log_purchase' && (
          <form onSubmit={handleRecordPurchase} style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '1rem' }}>Record Material Purchase & Expense</h4>
            
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Material / Item *</label>
                <select 
                  className="form-select"
                  required
                  value={purchaseForm.item_id}
                  onChange={e => setPurchaseForm({ ...purchaseForm, item_id: e.target.value })}
                >
                  <option value="" disabled>Select catalog item...</option>
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (Unit: {i.unit}, Stock: {i.stock_on_hand})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Purchase Quantity *</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  className="form-input"
                  value={purchaseForm.quantity}
                  onChange={e => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                  placeholder="e.g. 10"
                />
              </div>

              <div className="form-group">
                 <label className="form-label">Total Invoice Cost (LKR) *</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  className="form-input"
                  value={purchaseForm.total_cost}
                  onChange={e => setPurchaseForm({ ...purchaseForm, total_cost: e.target.value })}
                  placeholder="e.g. 125.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Purchase Date</label>
                <input 
                  type="date"
                  className="form-input"
                  value={purchaseForm.date}
                  onChange={e => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Receipt File Image URL</label>
                <input 
                  type="text"
                  className="form-input"
                  value={purchaseForm.receipt_url}
                  onChange={e => setPurchaseForm({ ...purchaseForm, receipt_url: e.target.value })}
                  placeholder="Paste URL or leave blank to auto-mock"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('stock')}>Cancel</button>
              <button type="submit" className="btn btn-primary">Log Expense & Add Stock</button>
            </div>
          </form>
        )}
      </div>

      {/* Catalog Create Item Modal */}
      {showItemModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Catalog Item</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowItemModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateItem}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Item / Material Name *</label>
                    <input 
                      type="text"
                      required
                      className="form-input"
                      value={itemForm.name}
                      onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                      placeholder="e.g. Premium Silk Thread Green"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select 
                      className="form-select"
                      value={itemForm.category}
                      onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                    >
                      <option value="Fabrics">Fabrics</option>
                      <option value="Threads">Threads</option>
                      <option value="Buttons">Buttons</option>
                      <option value="Refreshments">Refreshments (Refreshment department)</option>
                      <option value="Tools">Hardware / Tools</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit of Measure *</label>
                    <input 
                      type="text"
                      required
                      className="form-input"
                      value={itemForm.unit}
                      onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                      placeholder="e.g. Meters, Spools, Bags"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initial Stock Count</label>
                    <input 
                      type="number"
                      className="form-input"
                      value={itemForm.stock_on_hand}
                      onChange={e => setItemForm({ ...itemForm, stock_on_hand: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reorder Threshold *</label>
                    <input 
                      type="number"
                      required
                      className="form-input"
                      value={itemForm.reorder_threshold}
                      onChange={e => setItemForm({ ...itemForm, reorder_threshold: e.target.value })}
                      placeholder="Low-stock trigger value"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                     <label className="form-label">Estimated Unit Cost (LKR)</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={itemForm.unit_cost}
                      onChange={e => setItemForm({ ...itemForm, unit_cost: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
