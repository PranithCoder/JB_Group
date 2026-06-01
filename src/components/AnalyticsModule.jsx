import React from 'react';
import { db } from '../lib/db';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  Package, 
  CalendarClock 
} from 'lucide-react';

export default function AnalyticsModule({ activeRole, setCurrentSection }) {
  const orders = db.getOrders();
  const customers = db.getCustomers();
  const complaints = db.getComplaints();
  const inventory = db.getInventory();
  const purchases = db.getPurchases();
  const attendance = db.getAttendance();

  // 1. KPI Aggregations
  const totalSales = orders
    .filter(o => o.status === 'completed' || o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.amount, 0);

  const cashIn = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.amount, 0);

  const cashOut = purchases.reduce((sum, p) => sum + p.total_cost, 0);

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'in-progress').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  const lowStockCount = inventory.filter(i => i.stock_on_hand < i.reorder_threshold).length;
  const openComplaintsCount = complaints.filter(c => c.status !== 'Resolved').length;

  // Attendance rate (for present days in the system)
  const totalAttendanceRecords = attendance.length;
  const presentRecords = attendance.filter(a => a.status === 'Present').length;
  const attendanceRate = totalAttendanceRecords > 0 
    ? Math.round((presentRecords / totalAttendanceRecords) * 100) 
    : 100;

  // 2. Chart Data Generation
  
  // A. Sales Over Time (Last 10 days)
  // Let's generate a list of dates from May 23 to Jun 1
  const salesByDate = {};
  for (let i = -9; i <= 0; i++) {
    const d = new Date('2026-06-01');
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    salesByDate[dateStr] = 0;
  }

  orders.forEach(o => {
    if (salesByDate[o.order_date] !== undefined) {
      salesByDate[o.order_date] += o.amount;
    }
  });

  const salesChartData = Object.keys(salesByDate).map(date => ({
    date: date.substring(5), // Just MM-DD
    sales: salesByDate[date]
  }));

  // B. Cash Flow (Weekly comparison of Cash-In vs Cash-Out)
  // Let's group cash-in and cash-out by week
  // For demo, let's just make 4 weekly buckets
  const cashflowData = [
    { name: 'Week 1 (May 04)', CashIn: 1200, CashOut: 450 },
    { name: 'Week 2 (May 11)', CashIn: 1800, CashOut: 600 },
    { name: 'Week 3 (May 18)', CashIn: 2400, CashOut: 110 },
    { name: 'Week 4 (May 25)', CashIn: cashIn * 0.4, CashOut: cashOut * 0.7 },
    { name: 'Current (Jun 01)', CashIn: cashIn * 0.6, CashOut: cashOut * 0.3 }
  ];

  // C. Inventory Levels Bar chart
  const inventoryChartData = inventory.map(item => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + '..' : item.name,
    stock: item.stock_on_hand,
    threshold: item.reorder_threshold
  }));

  // D. Complaints weekly ticker
  const complaintsData = [
    { name: 'May 04', complaints: 1 },
    { name: 'May 11', complaints: 3 },
    { name: 'May 18', complaints: 0 },
    { name: 'May 25', complaints: openComplaintsCount }
  ];

  // Render simplified dashboard for Admin Officer
  if (activeRole === 'officer') {
    const pendingBookings = orders.filter(o => o.status === 'pending').length;
    const inProgressBookings = orders.filter(o => o.status === 'in-progress').length;
    const completedBookings = orders.filter(o => o.status === 'completed').length;
    const totalClientsCount = customers.length;

    const activeOrdersList = orders
      .filter(o => o.status !== 'completed')
      .sort((a, b) => new Date(a.delivery_date) - new Date(b.delivery_date))
      .slice(0, 5);

    const recentCustomersList = [...customers].slice(0, 4);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Simplified Roster KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentSection('orders')}>
            <div className="kpi-info">
              <span className="kpi-label">Pending Bookings</span>
              <span className="kpi-value">{pendingBookings}</span>
              <span className="kpi-badge warning">Pending Stitching</span>
            </div>
            <div className="kpi-icon-wrapper yellow">
              <ShoppingBag size={24} />
            </div>
          </div>

          <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentSection('orders')}>
            <div className="kpi-info">
              <span className="kpi-label">In-Progress Orders</span>
              <span className="kpi-value">{inProgressBookings}</span>
              <span className="kpi-badge info">At Tailor Station</span>
            </div>
            <div className="kpi-icon-wrapper blue">
              <ShoppingBag size={24} />
            </div>
          </div>

          <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentSection('orders')}>
            <div className="kpi-info">
              <span className="kpi-label">Completed Orders</span>
              <span className="kpi-value">{completedBookings}</span>
              <span className="kpi-badge success">Ready for Delivery</span>
            </div>
            <div className="kpi-icon-wrapper green">
              <ShoppingBag size={24} />
            </div>
          </div>

          <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentSection('customers')}>
            <div className="kpi-info">
              <span className="kpi-label">Total Customers</span>
              <span className="kpi-value">{totalClientsCount}</span>
              <span className="kpi-badge success">Enrolled Profiles</span>
            </div>
            <div className="kpi-icon-wrapper blue">
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* Deliveries Schedule & Recent Customers */}
        <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          
          {/* Due Deliveries Queue */}
          <div className="card">
            <div className="card-header">
              <h3>
                <CalendarClock size={18} style={{ color: 'var(--color-primary)' }} />
                Due Soon Deliveries Schedule
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentSection('orders')}>View Order Book</button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order No</th>
                      <th>Customer Name</th>
                      <th>Delivery Date</th>
                      <th>Service Type</th>
                      <th>Work Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeOrdersList.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No pending delivery schedules logged!
                        </td>
                      </tr>
                    ) : (
                      activeOrdersList.map(o => {
                        const daysRemaining = (dueDateStr) => {
                          const today = new Date('2026-06-01');
                          const dueDate = new Date(dueDateStr);
                          return Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                        };
                        const daysLeft = daysRemaining(o.delivery_date);
                        let dateClass = '';
                        let dateText = o.delivery_date;
                        if (daysLeft < 0) {
                          dateClass = 'text-red';
                          dateText = `${o.delivery_date} (Overdue ${Math.abs(daysLeft)}d)`;
                        } else if (daysLeft === 0) {
                          dateClass = 'text-amber';
                          dateText = `${o.delivery_date} (TODAY)`;
                        } else if (daysLeft <= 2) {
                          dateClass = 'text-amber';
                          dateText = `${o.delivery_date} (${daysLeft}d left)`;
                        }

                        return (
                          <tr key={o.id}>
                            <td style={{ fontWeight: 600 }}>{o.order_no}</td>
                            <td>{o.customer?.name || '—'}</td>
                            <td className={dateClass} style={{ fontWeight: dateClass ? 600 : 'normal' }}>{dateText}</td>
                            <td>{o.service_type}</td>
                            <td>
                              <select
                                value={o.status}
                                onChange={(e) => {
                                  const payload = { ...o, status: e.target.value };
                                  db.saveOrder(payload);
                                }}
                                className="form-select"
                                style={{
                                  padding: '0.125rem 0.5rem',
                                  fontSize: '0.75rem',
                                  width: 'auto',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  border: 'none',
                                  cursor: 'pointer',
                                  backgroundColor: 
                                    o.status === 'completed' ? 'var(--color-success-light)' : 
                                    o.status === 'in-progress' ? 'var(--color-warning-light)' : 'var(--color-primary-light)',
                                  color: 
                                    o.status === 'completed' ? 'var(--color-success)' : 
                                    o.status === 'in-progress' ? '#b45309' : 'var(--color-primary)'
                                }}
                              >
                                <option value="pending">Pending</option>
                                <option value="in-progress">In-Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Enrolled Customers */}
          <div className="card">
            <div className="card-header">
              <h3>Recent Customers</h3>
            </div>
            <div className="card-body" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentCustomersList.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: '#fafafa' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{c.contact}</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => setCurrentSection('customers')}>
                      History
                    </button>
                  </div>
                ))}
                <button 
                  className="btn btn-primary btn-sm mt-md" 
                  style={{ justifyContent: 'center', fontWeight: 600 }}
                  onClick={() => setCurrentSection('customers')}
                >
                  Enroll Customer Profile
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // Render Business Insights Dashboard for Managers/Owners
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentSection('orders')}>
          <div className="kpi-info">
            <span className="kpi-label">Pending Bookings</span>
            <span className="kpi-value">{pendingOrders}</span>
            <span className="kpi-badge up">Active Stitching</span>
          </div>
          <div className="kpi-icon-wrapper blue">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Cash-In (Revenue)</span>
            <span className="kpi-value">${Number(cashIn || 0).toFixed(2)}</span>
            <span className="kpi-badge up">Payments Recv</span>
          </div>
          <div className="kpi-icon-wrapper green">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Cash-Out (Expenses)</span>
            <span className="kpi-value">${Number(cashOut || 0).toFixed(2)}</span>
            <span className="kpi-badge down">Materials purchase</span>
          </div>
          <div className="kpi-icon-wrapper red">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentSection('customers')}>
          <div className="kpi-info">
            <span className="kpi-label">Active Clients</span>
            <span className="kpi-value">{activeCustomers}</span>
            <span className="kpi-badge up">Enrolled profiles</span>
          </div>
          <div className="kpi-icon-wrapper blue">
            <Users size={24} />
          </div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentSection('inventory')}>
          <div className="kpi-info">
            <span className="kpi-label">Low Stock Materials</span>
            <span className="kpi-value" style={{ color: lowStockCount > 0 ? 'var(--color-danger)' : 'inherit' }}>
              {lowStockCount}
            </span>
            <span className="kpi-badge down">Below limit</span>
          </div>
          <div className="kpi-icon-wrapper red">
            <Package size={24} />
          </div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentSection('complaints')}>
          <div className="kpi-info">
            <span className="kpi-label">Open Complaints</span>
            <span className="kpi-value" style={{ color: openComplaintsCount > 0 ? 'var(--color-warning)' : 'inherit' }}>
              {openComplaintsCount}
            </span>
            <span className="kpi-badge down">Fitting Issues</span>
          </div>
          <div className="kpi-icon-wrapper yellow">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentSection('staff')}>
          <div className="kpi-info">
            <span className="kpi-label">Attendance Rate</span>
            <span className="kpi-value">{attendanceRate}%</span>
            <span className="kpi-badge up">Staff present</span>
          </div>
          <div className="kpi-icon-wrapper green">
            <CalendarClock size={24} />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="dashboard-grid">
        {/* Sales Chart (Line) */}
        <div className="card">
          <div className="card-header">
            <h3>Sales Over Time (Order Bookings value)</h3>
          </div>
          <div className="card-body" style={{ height: '300px', width: '100%', position: 'relative', display: 'block' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaints (Area) */}
        <div className="card">
          <div className="card-header">
            <h3>Active Complaints Trend</h3>
          </div>
          <div className="card-body" style={{ height: '300px', width: '100%', position: 'relative', display: 'block' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complaintsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="complaints" stroke="var(--color-warning)" fill="var(--color-warning-light)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Cash Flow comparing Cash-In vs Cash-Out */}
        <div className="card">
          <div className="card-header">
            <h3>Cash Flow Balance (Cash-In vs Cash-Out)</h3>
          </div>
          <div className="card-body" style={{ height: '300px', width: '100%', position: 'relative', display: 'block' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="CashIn" fill="var(--color-success)" radius={[4, 4, 0, 0]} name="Cash-In (Paid Orders)" />
                <Bar dataKey="CashOut" fill="var(--color-danger)" radius={[4, 4, 0, 0]} name="Cash-Out (Expenses)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Counts */}
        <div className="card">
          <div className="card-header">
            <h3>Inventory Level vs. Reorder Threshold</h3>
          </div>
          <div className="card-body" style={{ height: '300px', width: '100%', position: 'relative', display: 'block' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="stock" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Current Stock" />
                <Bar dataKey="threshold" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Reorder Alert Limit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
