import React, { useState } from 'react';
import { db } from '../lib/db';
import { ShoppingCart, Plus, Trash2, Edit2, RefreshCw, AlertTriangle, Check, X, Tag, ListFilter, Search, DollarSign } from 'lucide-react';

export default function RetailModule({ activeRole, triggerUpdate }) {
  const [products, setProducts] = useState(db.getRetailInventory());
  const [sales, setSales] = useState(db.getRetailSales());
  const [activeTab, setActiveTab] = useState('catalog'); // catalog | sales | sell
  const [notification, setNotification] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Search and filter states
  const [prodQuery, setProdQuery] = useState('');
  const [salesQuery, setSalesQuery] = useState('');

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Ready-made Dresses',
    unit_cost: '',
    retail_price: '',
    stock_on_hand: '',
    reorder_threshold: '5'
  });

  const [saleForm, setSaleForm] = useState({
    customer_id: '',
    product_id: '',
    qty: 1,
    payment_status: 'paid'
  });

  const refreshData = () => {
    setProducts(db.getRetailInventory());
    setSales(db.getRetailSales());
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.retail_price) {
      alert('Required fields are missing.');
      return;
    }

    db.saveRetailProduct({
      ...(editingProduct ? { id: editingProduct.id } : {}),
      name: productForm.name,
      category: productForm.category,
      unit_cost: Number(productForm.unit_cost || 0),
      retail_price: Number(productForm.retail_price || 0),
      stock_on_hand: Number(productForm.stock_on_hand || 0),
      reorder_threshold: Number(productForm.reorder_threshold || 5)
    });

    setNotification({
      type: 'success',
      message: `Product "${productForm.name}" saved in catalog.`
    });
    
    setShowProductModal(false);
    setEditingProduct(null);
    refreshData();
    triggerUpdate();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRecordSale = (e) => {
    e.preventDefault();
    if (!saleForm.customer_id || !saleForm.product_id || !saleForm.qty) {
      alert('Please fill out all required fields.');
      return;
    }

    const selectedProduct = products.find(p => p.id === saleForm.product_id);
    if (!selectedProduct) return;

    if (selectedProduct.stock_on_hand < Number(saleForm.qty)) {
      alert(`Insufficient stock! Only ${selectedProduct.stock_on_hand} items available in catalog.`);
      return;
    }

    db.saveRetailSale({
      customer_id: saleForm.customer_id,
      product_id: saleForm.product_id,
      qty: Number(saleForm.qty),
      unit_price: selectedProduct.retail_price,
      payment_status: saleForm.payment_status
    });

    setNotification({
      type: 'success',
      message: 'Retail sale recorded successfully! Stock levels updated.'
    });

    // Reset Form
    setSaleForm({
      customer_id: '',
      product_id: '',
      qty: 1,
      payment_status: 'paid'
    });
    
    setActiveTab('sales');
    refreshData();
    triggerUpdate();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteProduct = (id) => {
    if (!confirm('Are you sure you want to delete this product from the retail catalog?')) return;
    const result = db.deleteRetailProduct(id);
    if (result.status === 'error') {
      setNotification({ type: 'danger', message: result.message });
    } else {
      setNotification({ type: 'success', message: 'Product deleted from catalog.' });
    }
    refreshData();
    triggerUpdate();
    setTimeout(() => setNotification(null), 4000);
  };

  const openAddProduct = () => {
    setProductForm({
      name: '',
      category: 'Ready-made Dresses',
      unit_cost: '',
      retail_price: '',
      stock_on_hand: '',
      reorder_threshold: '5'
    });
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const openEditProduct = (prod) => {
    setProductForm({
      name: prod.name,
      category: prod.category,
      unit_cost: prod.unit_cost,
      retail_price: prod.retail_price,
      stock_on_hand: prod.stock_on_hand,
      reorder_threshold: prod.reorder_threshold
    });
    setEditingProduct(prod);
    setShowProductModal(true);
  };

  const isReadOnly = activeRole === 'boss';
  const isOfficer = activeRole === 'officer';
  const canManageCatalog = activeRole === 'manager' || activeRole === 'super_admin';

  // Filters
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(prodQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(prodQuery.toLowerCase())
  );

  const filteredSales = sales.filter(s => 
    (s.customer?.name || '').toLowerCase().includes(salesQuery.toLowerCase()) ||
    (s.product?.name || '').toLowerCase().includes(salesQuery.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === saleForm.product_id);
  const calculatedTotal = selectedProduct ? (Number(saleForm.qty || 0) * selectedProduct.retail_price) : 0;

  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <ShoppingCart style={{ color: 'var(--color-primary)' }} size={20} />
          Ready-Made Garments & Women's Accessories Shop
        </h3>
        {activeTab === 'catalog' && canManageCatalog && (
          <button className="btn btn-primary btn-sm" onClick={openAddProduct}>
            <Plus size={16} /> New Retail Item
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

        {/* Tab Toolbar */}
        <div className="toolbar" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button 
              className={`role-btn ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
            >
              Catalog & Stock levels
            </button>
            <button 
              className={`role-btn ${activeTab === 'sales' ? 'active' : ''}`}
              onClick={() => setActiveTab('sales')}
            >
              Sales Registry Logs
            </button>
            {!isReadOnly && (
              <button 
                className={`role-btn ${activeTab === 'sell' ? 'active' : ''}`}
                onClick={() => {
                  setSaleForm({ customer_id: '', product_id: products[0]?.id || '', qty: 1, payment_status: 'paid' });
                  setActiveTab('sell');
                }}
              >
                + Register Retail Sale
              </button>
            )}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={refreshData}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Tab 1: Product Catalog */}
        {activeTab === 'catalog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Search and summary statistics cards */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: '2rem' }}
                  placeholder="Search products or category..." 
                  value={prodQuery}
                  onChange={e => setProdQuery(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ fontSize: '0.8rem', backgroundColor: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 600 }}>
                  Catalog Items: {products.length}
                </div>
                <div style={{ fontSize: '0.8rem', backgroundColor: 'var(--color-warning-light)', color: '#b45309', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 600 }}>
                  Low Stock Alert: {products.filter(p => p.stock_on_hand < p.reorder_threshold).length}
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product details</th>
                    <th>Category</th>
                    <th>Stock status</th>
                    <th>Wholesale Cost</th>
                    <th>Retail Sell Price</th>
                    <th>Catalog Stock</th>
                    {canManageCatalog && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={canManageCatalog ? "7" : "6"} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No catalog items found.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => {
                      const isLow = p.stock_on_hand < p.reorder_threshold;
                      const isOut = p.stock_on_hand === 0;
                      return (
                        <tr key={p.id} style={{ backgroundColor: isOut ? '#fef2f2' : isLow ? 'var(--color-warning-light)' : 'inherit' }}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Code: {p.id}</div>
                          </td>
                          <td>
                            <span className="badge info">{p.category}</span>
                          </td>
                          <td>
                            <span className={`badge ${isOut ? 'danger' : isLow ? 'warning' : 'success'}`}>
                              {isOut ? '❌ Out of Stock' : isLow ? '⚠️ Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 500 }}>Rs. {Number(p.unit_cost || 0).toFixed(2)}</td>
                          <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Rs. {Number(p.retail_price || 0).toFixed(2)}</td>
                          <td style={{ fontWeight: 700 }}>
                            {p.stock_on_hand} items
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Limit: {p.reorder_threshold} (min)</div>
                          </td>
                          {canManageCatalog && (
                            <td>
                              <div style={{ display: 'flex', gap: '0.375rem' }}>
                                <button className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openEditProduct(p)}>
                                  <Edit2 size={12} /> Edit
                                </button>
                                <button className="btn btn-secondary btn-sm text-red" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDeleteProduct(p.id)}>
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Sales Registry Logs */}
        {activeTab === 'sales' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: '2rem' }}
                  placeholder="Search sales log by customer or item..." 
                  value={salesQuery}
                  onChange={e => setSalesQuery(e.target.value)}
                />
              </div>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-success)' }}>
                Total Retail Revenue: Rs. {sales.reduce((sum, s) => sum + s.total_price, 0).toFixed(2)}
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer Name</th>
                    <th>Product / accessory</th>
                    <th>Quantity Sold</th>
                    <th>Retail Price</th>
                    <th>Total Value</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No retail sales logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map(s => (
                      <tr key={s.id}>
                        <td>{s.sale_date}</td>
                        <td style={{ fontWeight: 500 }}>{s.customer?.name || 'Walk-in Customer'}</td>
                        <td style={{ fontWeight: 600 }}>{s.product?.name || 'Deleted Product'}</td>
                        <td>{s.qty} items</td>
                        <td>Rs. {Number(s.unit_price || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>Rs. {Number(s.total_price || 0).toFixed(2)}</td>
                        <td>
                          <span className={`badge ${s.payment_status === 'paid' ? 'success' : 'danger'}`}>
                            {s.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Sell Product Form */}
        {activeTab === 'sell' && (
          <form onSubmit={handleRecordSale} style={{ maxWidth: '600px', margin: '0 auto', padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-light)' }}>

            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={18} style={{ color: 'var(--color-primary)' }} />
              Log Retail Sale Transaction
            </h4>

            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Select Customer Profile *</label>
                <select 
                  className="form-select"
                  required
                  value={saleForm.customer_id}
                  onChange={e => setSaleForm({ ...saleForm, customer_id: e.target.value })}
                >
                  <option value="" disabled>Select customer...</option>
                  {db.getCustomers().map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.contact})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Select Retail Catalog Item *</label>
                <select 
                  className="form-select"
                  required
                  value={saleForm.product_id}
                  onChange={e => setSaleForm({ ...saleForm, product_id: e.target.value })}
                >
                  <option value="" disabled>Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stock_on_hand === 0}>
                      {p.name} [Category: {p.category}, Price: Rs. {p.retail_price}, In Stock: {p.stock_on_hand}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity to Sell *</label>
                <input 
                  type="number"
                  required
                  min="1"
                  className="form-input"
                  value={saleForm.qty}
                  onChange={e => setSaleForm({ ...saleForm, qty: Number(e.target.value) })}
                  placeholder="e.g. 1"
                />
                {selectedProduct && (
                  <span style={{ fontSize: '0.725rem', color: selectedProduct.stock_on_hand < Number(saleForm.qty) ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                    Stock available: {selectedProduct.stock_on_hand} items
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Payment Status</label>
                <select 
                  className="form-select"
                  value={saleForm.payment_status}
                  onChange={e => setSaleForm({ ...saleForm, payment_status: e.target.value })}
                >
                  <option value="paid">Paid (Cash / Card)</option>
                  <option value="unpaid">Unpaid / On Credit</option>
                </select>
              </div>
            </div>

            {/* Price Preview section */}
            {selectedProduct && (
              <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e40af' }}>Total Amount Calculation:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  Rs. {calculatedTotal.toFixed(2)}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', fontWeight: 'normal', textAlign: 'right' }}>
                    ({saleForm.qty} x Rs. {selectedProduct.retail_price.toFixed(2)})
                  </span>
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('catalog')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={selectedProduct && selectedProduct.stock_on_hand < Number(saleForm.qty)}>
                Log Retail Sale
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Catalog Item Modal for Manager / Super-Admin */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Catalog Product details' : 'Add New Retail Product'}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowProductModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Product Name *</label>
                    <input 
                      type="text"
                      required
                      className="form-input"
                      value={productForm.name}
                      onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="e.g. Silk Designer Kurta (Large)"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Product Category</label>
                    <select 
                      className="form-select"
                      value={productForm.category}
                      onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    >
                      <option value="Ready-made Dresses">Ready-made Dresses</option>
                      <option value="Women Accessories">Women Accessories</option>
                      <option value="Cosmetics">Cosmetics / Makeup</option>
                      <option value="Tailor Fabrics">Fabrics Retail</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Wholesale Cost (LKR)</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={productForm.unit_cost}
                      onChange={e => setProductForm({ ...productForm, unit_cost: e.target.value })}
                      placeholder="Cost paid to supplier"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Retail Sell Price (LKR) *</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      className="form-input"
                      value={productForm.retail_price}
                      onChange={e => setProductForm({ ...productForm, retail_price: e.target.value })}
                      placeholder="Selling price to client"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Current Stock Count *</label>
                    <input 
                      type="number"
                      required
                      className="form-input"
                      value={productForm.stock_on_hand}
                      onChange={e => setProductForm({ ...productForm, stock_on_hand: e.target.value })}
                      placeholder="e.g. 10"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Reorder Limit (Low-Stock warning count)</label>
                    <input 
                      type="number"
                      className="form-input"
                      value={productForm.reorder_threshold}
                      onChange={e => setProductForm({ ...productForm, reorder_threshold: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProductModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingProduct ? 'Save Changes' : 'Add to Catalog'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
