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
            <span className="kpi-value">${cashIn.toFixed(2)}</span>
            <span className="kpi-badge up">Payments Recv</span>
          </div>
          <div className="kpi-icon-wrapper green">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Cash-Out (Expenses)</span>
            <span className="kpi-value">${cashOut.toFixed(2)}</span>
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
          <div className="card-body" style={{ height: '300px' }}>
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
          <div className="card-body" style={{ height: '300px' }}>
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
          <div className="card-body" style={{ height: '300px' }}>
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
          <div className="card-body" style={{ height: '300px' }}>
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
