// Database simulation layer using localStorage.
// Initialized with realistic sample data to power a data-rich premium dashboard.

const DEFAULT_USERS = [
  { id: 'usr-1', name: 'Alina Officer', email: 'officer@jbgroup.com', role: 'officer' },
  { id: 'usr-2', name: 'Marcus Manager', email: 'manager@jbgroup.com', role: 'manager' },
  { id: 'usr-3', name: 'Brenda Boss', email: 'boss@jbgroup.com', role: 'boss' },
  { id: 'usr-4', name: 'Sam Super', email: 'super@jbgroup.com', role: 'super_admin' }
];

const DEFAULT_CUSTOMERS = [
  { id: 'c-1', name: 'Eleanor Vance', contact: '+1 (555) 019-2834', email: 'eleanor.v@mail.com', preferences: 'Stitching - Silk Dress, Prefers loose fit, high neckline', notes: 'Frequent customer for formal wear.', serviceHistoryCount: 4, status: 'Active' },
  { id: 'c-2', name: 'Jonathan Archer', contact: '+1 (555) 014-9922', email: 'j.archer@enterprise.org', preferences: 'Alteration - Wool Suits, Waist adjustment -0.5 inch', notes: 'Prefers express delivery.', serviceHistoryCount: 8, status: 'Active' },
  { id: 'c-3', name: 'Seraphina Pekkala', contact: '+1 (555) 017-8811', email: 'seraphina@witch.net', preferences: 'Stitching - Custom Cloak, Lightweight fabrics, long hem', notes: 'Prefers cotton-linen blends.', serviceHistoryCount: 3, status: 'Active' },
  { id: 'c-4', name: 'Clara Oswald', contact: '+1 (555) 012-3344', email: 'clara.oswald@tardis.co', preferences: 'Alteration - Jackets, Sleeve shortening', notes: 'Paid on time always.', serviceHistoryCount: 6, status: 'Active' },
  { id: 'c-5', name: 'Bruce Wayne', contact: '+1 (555) 019-9999', email: 'bruce@waynecorp.com', preferences: 'Stitching - Premium Black Suit, Heavy-duty lining, custom pockets', notes: 'Extremely high value client. Demands total discretion.', serviceHistoryCount: 12, status: 'Active' }
];

// Helper to get relative dates to current local time (2026-06-01)
const getDateOffset = (days) => {
  const d = new Date('2026-06-01');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const DEFAULT_ORDERS = [
  { id: 'ord-101', customer_id: 'c-1', order_no: 'JB-2026-101', order_date: getDateOffset(-5), delivery_date: getDateOffset(-1), service_type: 'Stitching', note: 'Silk Evening Gown with emerald lace trim', status: 'completed', amount: 350.00, payment_status: 'paid' },
  { id: 'ord-102', customer_id: 'c-2', order_no: 'JB-2026-102', order_date: getDateOffset(-4), delivery_date: getDateOffset(1), service_type: 'Alteration', note: 'Three wool trousers waist and cuff adjustments', status: 'in-progress', amount: 90.00, payment_status: 'paid' },
  { id: 'ord-103', customer_id: 'c-3', order_no: 'JB-2026-103', order_date: getDateOffset(-3), delivery_date: getDateOffset(2), service_type: 'Stitching', note: 'Linen casual jacket, wooden buttons', status: 'in-progress', amount: 180.00, payment_status: 'unpaid' },
  { id: 'ord-104', customer_id: 'c-4', order_no: 'JB-2026-104', order_date: getDateOffset(-6), delivery_date: getDateOffset(-2), service_type: 'Alteration', note: 'Sleeve adjustments on 2 denim jackets', status: 'completed', amount: 60.00, payment_status: 'paid' },
  { id: 'ord-105', customer_id: 'c-5', order_no: 'JB-2026-105', order_date: getDateOffset(-1), delivery_date: getDateOffset(0), service_type: 'Stitching', note: 'Bespoke Tuxedo with bulletproof fabric lining simulation', status: 'pending', amount: 2400.00, payment_status: 'unpaid' },
  { id: 'ord-106', customer_id: 'c-1', order_no: 'JB-2026-106', order_date: getDateOffset(-10), delivery_date: getDateOffset(-3), service_type: 'Stitching', note: 'Cotton summer dress, floral print', status: 'completed', amount: 150.00, payment_status: 'paid' }
];

const DEFAULT_STAFF = [
  { id: 'stf-1', name: 'Master Tailor Ali', contact: '+1 (555) 018-4422', role: 'Master Tailor', salary: 1200.00, join_date: '2024-01-15', leaves: { sick: 10, casual: 12, vacation: 15 } },
  { id: 'stf-2', name: 'Sarah Chen', contact: '+1 (555) 016-7733', role: 'Seamstress', salary: 900.00, join_date: '2025-03-10', leaves: { sick: 8, casual: 11, vacation: 14 } },
  { id: 'stf-3', name: 'David Miller', contact: '+1 (555) 015-1100', role: 'Apprentice Stitcher', salary: 650.00, join_date: '2025-11-01', leaves: { sick: 12, casual: 12, vacation: 10 } },
  { id: 'stf-4', name: 'Zara Gomez', contact: '+1 (555) 013-6622', role: 'Store Assistant', salary: 750.00, join_date: '2024-06-20', leaves: { sick: 9, casual: 10, vacation: 12 } }
];

// Seed attendance for the past week: May 25 to May 31, 2026
const seedAttendance = () => {
  const list = [];
  const staffIds = ['stf-1', 'stf-2', 'stf-3', 'stf-4'];
  // May 25 to May 31 (7 days)
  for (let i = -7; i < 0; i++) {
    const dateStr = getDateOffset(i);
    const dayOfWeek = new Date(dateStr).getDay();
    if (dayOfWeek === 0) continue; // Skip Sundays for attendance

    staffIds.forEach(sid => {
      // 90% present rate
      const isAbsent = Math.random() < 0.1;
      if (isAbsent) {
        const leaveTypes = ['sick', 'casual', 'vacation'];
        const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
        list.push({
          id: `att-${sid}-${dateStr}`,
          staff_id: sid,
          date: dateStr,
          hours_worked: 0,
          status: 'Absent',
          leave_type: leaveType
        });
      } else {
        list.push({
          id: `att-${sid}-${dateStr}`,
          staff_id: sid,
          date: dateStr,
          hours_worked: 8,
          status: 'Present',
          leave_type: ''
        });
      }
    });
  }
  return list;
};

const DEFAULT_INVENTORY = [
  { id: 'inv-1', name: 'Egyptian Cotton White', category: 'Fabrics', unit: 'Meters', stock_on_hand: 45, reorder_threshold: 15, unit_cost: 12.50 },
  { id: 'inv-2', name: 'Premium Silk Crimson', category: 'Fabrics', unit: 'Meters', stock_on_hand: 8, reorder_threshold: 10, unit_cost: 28.00 }, // Under stocked
  { id: 'inv-3', name: 'Heavy Wool Charcoal', category: 'Fabrics', unit: 'Meters', stock_on_hand: 20, reorder_threshold: 8, unit_cost: 32.00 },
  { id: 'inv-4', name: 'Polyester Thread Black', category: 'Threads', unit: 'Spools', stock_on_hand: 65, reorder_threshold: 20, unit_cost: 2.10 },
  { id: 'inv-5', name: 'Gold-plated Blazer Buttons', category: 'Buttons', unit: 'Sets of 6', stock_on_hand: 4, reorder_threshold: 5, unit_cost: 15.00 }, // Under stocked
  { id: 'inv-6', name: 'Organic Earl Grey Tea', category: 'Refreshments', unit: 'Boxes (50 bags)', stock_on_hand: 12, reorder_threshold: 3, unit_cost: 6.50 },
  { id: 'inv-7', name: 'Fine Refined Sugar', category: 'Refreshments', unit: 'Kg', stock_on_hand: 10, reorder_threshold: 2, unit_cost: 1.80 }
];

const DEFAULT_PURCHASES = [
  { id: 'pur-1', item_id: 'inv-1', date: getDateOffset(-12), quantity: 30, total_cost: 375.00, receipt_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=300&auto=format&fit=crop' },
  { id: 'pur-2', item_id: 'inv-4', date: getDateOffset(-8), quantity: 50, total_cost: 105.00, receipt_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=300&auto=format&fit=crop' },
  { id: 'pur-3', item_id: 'inv-6', date: getDateOffset(-4), quantity: 5, total_cost: 32.50, receipt_url: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=300&auto=format&fit=crop' }
];

const DEFAULT_COMPLAINTS = [
  { 
    id: 'comp-1', 
    customer_id: 'c-2', 
    order_id: 'ord-104', 
    date_reported: getDateOffset(-2), 
    description: 'Sleeve cuff on the denim jacket was too loose after alterations. Needs shortening by 0.5 inches more.', 
    evidence_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=300&auto=format&fit=crop', 
    status: 'In Review', 
    assigned_staff_id: 'stf-2', 
    resolution_notes: 'Acknowledged. Sarah is adjusting the stitch sleeve pattern to trim the extra half inch. Fitting session set for tomorrow.' 
  },
  { 
    id: 'comp-2', 
    customer_id: 'c-1', 
    order_id: 'ord-106', 
    date_reported: getDateOffset(-15), 
    description: 'Hem stitching came undone near the bottom edge of the floral dress after a single cold wash.', 
    evidence_url: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=300&auto=format&fit=crop', 
    status: 'Resolved', 
    assigned_staff_id: 'stf-1', 
    resolution_notes: 'Master Tailor Ali re-hemmed the bottom with high-density threads. Delivered back to customer free of charge. Customer happy.' 
  }
];

const DEFAULT_APPROVALS = [
  {
    id: 'appr-1',
    request_type: 'Order Date & Price Override',
    requested_by: 'usr-1', // Alina Officer
    request_date: getDateOffset(0),
    entity_type: 'orders',
    entity_id: 'ord-105',
    details: 'Requested changing delivery date of JB-2026-105 to tomorrow and discount total to $2,300.00',
    original_data: { delivery_date: getDateOffset(0), amount: 2400.00 },
    proposed_data: { delivery_date: getDateOffset(1), amount: 2300.00 },
    status: 'pending',
    approved_by: null,
    approval_date: null
  }
];

// Helper function to safely read from local storage without crashing
const safeGetLocalStorage = (key, defaultVal) => {
  try {
    const val = localStorage.getItem(key);
    if (!val || val === 'undefined') {
      return defaultVal;
    }
    const parsed = JSON.parse(val);
    if (parsed === null || parsed === undefined) {
      return defaultVal;
    }
    return parsed;
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return defaultVal;
  }
};

// Helper to initialize local storage safely (seeding each table individually if missing or malformed)
const initLocalStorage = () => {
  const isFirstRun = !localStorage.getItem('jb_db_initialized');

  const checkAndSeed = (key, defaultVal) => {
    try {
      const val = localStorage.getItem(key);
      if (!val || val === 'undefined' || (isFirstRun && JSON.parse(val).length === 0)) {
        localStorage.setItem(key, JSON.stringify(defaultVal));
      }
    } catch (e) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
    }
  };

  checkAndSeed('jb_users', DEFAULT_USERS);
  checkAndSeed('jb_customers', DEFAULT_CUSTOMERS);
  checkAndSeed('jb_orders', DEFAULT_ORDERS);
  checkAndSeed('jb_staff', DEFAULT_STAFF);
  checkAndSeed('jb_attendance', seedAttendance());
  checkAndSeed('jb_inventory', DEFAULT_INVENTORY);
  checkAndSeed('jb_purchases', DEFAULT_PURCHASES);
  checkAndSeed('jb_complaints', DEFAULT_COMPLAINTS);
  checkAndSeed('jb_approvals', DEFAULT_APPROVALS);

  if (!localStorage.getItem('jb_active_role')) {
    localStorage.setItem('jb_active_role', 'manager');
  }

  localStorage.setItem('jb_db_initialized', 'true');
};

initLocalStorage();

// Standard CRUD interfaces that pull/push from LocalStorage and trigger notifications

export const db = {
  // Active Role Helper
  getActiveRole() {
    return localStorage.getItem('jb_active_role') || 'manager';
  },

  setActiveRole(role) {
    localStorage.setItem('jb_active_role', role);
    window.dispatchEvent(new Event('jb_database_updated'));
  },

  // ----------------------------------------------------
  // Customers Module
  // ----------------------------------------------------
  getCustomers() {
    return safeGetLocalStorage('jb_customers', []);
  },

  saveCustomer(customer) {
    const list = this.getCustomers();
    if (customer.id) {
      // Modify
      const index = list.findIndex(c => c.id === customer.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...customer };
      }
    } else {
      // New
      customer.id = 'c-' + Date.now();
      customer.serviceHistoryCount = 0;
      customer.status = 'Active';
      list.unshift(customer);
    }
    localStorage.setItem('jb_customers', JSON.stringify(list));
    window.dispatchEvent(new Event('jb_database_updated'));
    return customer;
  },

  deleteCustomer(id) {
    const role = this.getActiveRole();
    if (role === 'officer') {
      // Officer requires Manager approval
      const c = this.getCustomers().find(cust => cust.id === id);
      const app = {
        id: 'appr-' + Date.now(),
        request_type: 'Delete Customer Record',
        requested_by: 'usr-1',
        request_date: getDateOffset(0),
        entity_type: 'customers',
        entity_id: id,
        details: `Requested deletion of customer: ${c?.name || id}`,
        original_data: c,
        proposed_data: null,
        status: 'pending',
        approved_by: null,
        approval_date: null
      };
      const approvals = this.getApprovals();
      approvals.unshift(app);
      localStorage.setItem('jb_approvals', JSON.stringify(approvals));
      window.dispatchEvent(new Event('jb_database_updated'));
      return { status: 'pending_approval', approvalId: app.id };
    }

    // Manager / Super-Admin can delete immediately
    let list = this.getCustomers();
    list = list.filter(c => c.id !== id);
    localStorage.setItem('jb_customers', JSON.stringify(list));
    window.dispatchEvent(new Event('jb_database_updated'));
    return { status: 'success' };
  },

  // ----------------------------------------------------
  // Orders Module
  // ----------------------------------------------------
  getOrders() {
    const orders = safeGetLocalStorage('jb_orders', []);
    const customers = this.getCustomers();
    return orders.map(ord => ({
      ...ord,
      customer: customers.find(c => c.id === ord.customer_id) || { name: 'Unknown Customer' }
    }));
  },

  saveOrder(order) {
    const role = this.getActiveRole();
    const list = safeGetLocalStorage('jb_orders', []);

    if (order.id) {
      const original = list.find(o => o.id === order.id);
      
      // Critical change validation for Officers
      if (role === 'officer' && original && 
         (original.delivery_date !== order.delivery_date || original.amount !== order.amount)) {
        // Enforce approval
        const app = {
          id: 'appr-' + Date.now(),
          request_type: 'Critical Order Change',
          requested_by: 'usr-1',
          request_date: getDateOffset(0),
          entity_type: 'orders',
          entity_id: order.id,
          details: `Change Delivery Date from ${original.delivery_date} to ${order.delivery_date}, and Amount from $${original.amount} to $${order.amount}`,
          original_data: original,
          proposed_data: order,
          status: 'pending',
          approved_by: null,
          approval_date: null
        };
        const approvals = this.getApprovals();
        approvals.unshift(app);
        localStorage.setItem('jb_approvals', JSON.stringify(approvals));
        window.dispatchEvent(new Event('jb_database_updated'));
        return { status: 'pending_approval', approvalId: app.id };
      }

      // Execute directly
      const index = list.findIndex(o => o.id === order.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...order };
        // If order gets completed, automatically decrement some stock for demo
        if (order.status === 'completed' && original.status !== 'completed') {
          this.decrementStockForOrder(order);
        }
      }
    } else {
      // New Order
      order.id = 'ord-' + Date.now();
      order.order_no = 'JB-2026-' + (list.length + 101);
      order.order_date = getDateOffset(0);
      list.unshift(order);

      // Increment customer's order history
      const customers = this.getCustomers();
      const cIndex = customers.findIndex(c => c.id === order.customer_id);
      if (cIndex !== -1) {
        customers[cIndex].serviceHistoryCount = (customers[cIndex].serviceHistoryCount || 0) + 1;
        localStorage.setItem('jb_customers', JSON.stringify(customers));
      }
    }
    
    localStorage.setItem('jb_orders', JSON.stringify(list));
    window.dispatchEvent(new Event('jb_database_updated'));
    return { status: 'success', data: order };
  },

  decrementStockForOrder(order) {
    const items = this.getInventory();
    // Simulate consuming 1.5 meters of random fabric, 1 thread spool, and 1 set of buttons
    let hasUpdated = false;
    if (order.service_type === 'Stitching') {
      // Thread
      const thread = items.find(i => i.category === 'Threads');
      if (thread && thread.stock_on_hand > 0) {
        thread.stock_on_hand -= 1;
        hasUpdated = true;
      }
      // Fabric
      const fabric = items.find(i => i.category === 'Fabrics' && i.stock_on_hand > 5);
      if (fabric) {
        fabric.stock_on_hand -= 2;
        hasUpdated = true;
      }
      // Buttons
      const buttons = items.find(i => i.category === 'Buttons' && i.stock_on_hand > 0);
      if (buttons) {
        buttons.stock_on_hand -= 1;
        hasUpdated = true;
      }
    }
    if (hasUpdated) {
      localStorage.setItem('jb_inventory', JSON.stringify(items));
    }
  },

  deleteOrder(id) {
    const role = this.getActiveRole();
    if (role === 'officer') {
      const o = this.getOrders().find(ord => ord.id === id);
      const app = {
        id: 'appr-' + Date.now(),
        request_type: 'Delete Order Record',
        requested_by: 'usr-1',
        request_date: getDateOffset(0),
        entity_type: 'orders',
        entity_id: id,
        details: `Requested deletion of order: ${o?.order_no || id}`,
        original_data: o,
        proposed_data: null,
        status: 'pending',
        approved_by: null,
        approval_date: null
      };
      const approvals = this.getApprovals();
      approvals.unshift(app);
      localStorage.setItem('jb_approvals', JSON.stringify(approvals));
      window.dispatchEvent(new Event('jb_database_updated'));
      return { status: 'pending_approval', approvalId: app.id };
    }

    let list = safeGetLocalStorage('jb_orders', []);
    list = list.filter(o => o.id !== id);
    localStorage.setItem('jb_orders', JSON.stringify(list));
    window.dispatchEvent(new Event('jb_database_updated'));
    return { status: 'success' };
  },

  // ----------------------------------------------------
  // Staff & Attendance Module
  // ----------------------------------------------------
  getStaff() {
    return safeGetLocalStorage('jb_staff', []);
  },

  saveStaff(employee) {
    const list = this.getStaff();
    if (employee.id) {
      const index = list.findIndex(e => e.id === employee.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...employee };
      }
    } else {
      employee.id = 'stf-' + Date.now();
      employee.leaves = { sick: 12, casual: 12, vacation: 15 };
      list.push(employee);
    }
    localStorage.setItem('jb_staff', JSON.stringify(list));
    window.dispatchEvent(new Event('jb_database_updated'));
    return employee;
  },

  getAttendance() {
    return safeGetLocalStorage('jb_attendance', []);
  },

  saveAttendance(record) {
    const list = this.getAttendance();
    const index = list.findIndex(r => r.staff_id === record.staff_id && r.date === record.date);

    // If changing to Absent with leave_type, adjust staff leave balances (if new absence record)
    if (record.status === 'Absent' && record.leave_type) {
      const existingRecord = index !== -1 ? list[index] : null;
      if (!existingRecord || existingRecord.status !== 'Absent') {
        // Decrement leave balance
        const staffList = this.getStaff();
        const staffIndex = staffList.findIndex(s => s.id === record.staff_id);
        if (staffIndex !== -1 && staffList[staffIndex].leaves[record.leave_type] > 0) {
          staffList[staffIndex].leaves[record.leave_type] -= 1;
          localStorage.setItem('jb_staff', JSON.stringify(staffList));
        }
      }
    }

    if (index !== -1) {
      list[index] = { ...list[index], ...record };
    } else {
      record.id = `att-${record.staff_id}-${record.date}`;
      list.push(record);
    }
    localStorage.setItem('jb_attendance', JSON.stringify(list));
    window.dispatchEvent(new Event('jb_database_updated'));
    return record;
  },

  generateMonthlyPayroll(monthYearString) {
    const staff = this.getStaff();
    const attendance = this.getAttendance();
    
    // Filter attendance for the selected month (starts with monthYearString)
    const monthRecords = attendance.filter(a => a.date && a.date.startsWith(monthYearString));

    return staff.map(emp => {
      const empAttendance = monthRecords.filter(a => a.staff_id === emp.id);
      
      let totalHours = 0;
      let daysPresent = 0;
      let daysAbsent = 0;
      
      empAttendance.forEach(a => {
        if (a.status === 'Present') {
          totalHours += Number(a.hours_worked || 0);
          daysPresent++;
        } else {
          daysAbsent++;
        }
      });

      const hourlyRate = (emp.salary || 0) / 240;
      
      let overtimeHours = 0;
      empAttendance.forEach(a => {
        if (a.status === 'Present' && Number(a.hours_worked) > 8) {
          overtimeHours += (Number(a.hours_worked) - 8);
        }
      });

      const basePay = totalHours * hourlyRate;
      const overtimePay = overtimeHours * (hourlyRate * 0.5); 
      
      let unpaidAbsences = empAttendance.filter(a => a.status === 'Absent' && !a.leave_type).length;
      const deductionPerDay = (emp.salary || 0) / 30;
      const deductions = unpaidAbsences * deductionPerDay;

      const netPay = Math.max(0, basePay + overtimePay - deductions);

      return {
        staff_id: emp.id,
        name: emp.name,
        role: emp.role,
        basic_salary: emp.salary || 0,
        total_hours: totalHours,
        days_present: daysPresent,
        days_absent: daysAbsent,
        overtime_hours: overtimeHours,
        deductions: Number(deductions.toFixed(2)),
        net_pay: Number(netPay.toFixed(2))
      };
    });
  },

  // ----------------------------------------------------
  // Inventory Module
  // ----------------------------------------------------
  getInventory() {
    return safeGetLocalStorage('jb_inventory', []);
  },

  saveInventoryItem(item) {
    const list = this.getInventory();
    if (item.id) {
      const index = list.findIndex(i => i.id === item.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...item };
      }
    } else {
      item.id = 'inv-' + Date.now();
      item.stock_on_hand = Number(item.stock_on_hand || 0);
      item.reorder_threshold = Number(item.reorder_threshold || 0);
      item.unit_cost = Number(item.unit_cost || 0);
      list.push(item);
    }
    localStorage.setItem('jb_inventory', JSON.stringify(list));
    window.dispatchEvent(new Event('jb_database_updated'));
    return item;
  },

  deleteInventoryItem(id) {
    const role = this.getActiveRole();
    if (role !== 'super_admin') {
      return { status: 'error', message: 'Deleting inventory items requires Super-Admin approval!' };
    }
    let list = this.getInventory();
    list = list.filter(i => i.id !== id);
    localStorage.setItem('jb_inventory', JSON.stringify(list));
    window.dispatchEvent(new Event('jb_database_updated'));
    return { status: 'success' };
  },

  getPurchases() {
    const purchases = safeGetLocalStorage('jb_purchases', []);
    const items = this.getInventory();
    return purchases.map(p => ({
      ...p,
      item: items.find(i => i.id === p.item_id) || { name: 'Unknown Item', category: 'General' }
    }));
  },

  savePurchase(purchase) {
    const purchases = this.getPurchases();
    const inventory = this.getInventory();

    purchase.id = 'pur-' + Date.now();
    purchase.date = purchase.date || getDateOffset(0);
    purchase.quantity = Number(purchase.quantity || 0);
    purchase.total_cost = Number(purchase.total_cost || 0);

    purchases.unshift(purchase);

    const itemIndex = inventory.findIndex(i => i.id === purchase.item_id);
    if (itemIndex !== -1) {
      inventory[itemIndex].stock_on_hand += purchase.quantity;
      if (purchase.quantity > 0) {
        inventory[itemIndex].unit_cost = Number((purchase.total_cost / purchase.quantity).toFixed(2));
      }
      localStorage.setItem('jb_inventory', JSON.stringify(inventory));
    }

    localStorage.setItem('jb_purchases', JSON.stringify(purchases));
    window.dispatchEvent(new Event('jb_database_updated'));
    return purchase;
  },

  // ----------------------------------------------------
  // Complaints Module
  // ----------------------------------------------------
  getComplaints() {
    const list = safeGetLocalStorage('jb_complaints', []);
    const customers = this.getCustomers();
    const staff = this.getStaff();
    const orders = this.getOrders();

    return list.map(c => ({
      ...c,
      customer: customers.find(cust => cust.id === c.customer_id) || { name: 'Unknown Customer' },
      assignedStaff: staff.find(s => s.id === c.assigned_staff_id) || { name: 'Unassigned' },
      order: orders.find(o => o.id === c.order_id) || null
    }));
  },

  saveComplaint(complaint) {
    const list = safeGetLocalStorage('jb_complaints', []);
    let isNew = false;
    
    if (complaint.id) {
      const index = list.findIndex(c => c.id === complaint.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...complaint };
      }
    } else {
      isNew = true;
      complaint.id = 'comp-' + Date.now();
      complaint.date_reported = getDateOffset(0);
      complaint.status = complaint.status || 'In Review';
      list.unshift(complaint);
    }
    
    localStorage.setItem('jb_complaints', JSON.stringify(list));
    window.dispatchEvent(new Event('jb_database_updated'));

    if (isNew) {
      this.triggerCustomerNotification(complaint, 'Complaint Registered');
    } else if (complaint.status === 'Resolved') {
      this.triggerCustomerNotification(complaint, 'Complaint Resolved');
    }

    return complaint;
  },

  triggerCustomerNotification(complaint, type) {
    const customer = this.getCustomers().find(c => c.id === complaint.customer_id);
    if (!customer) return;

    const message = type === 'Complaint Registered' 
      ? `SMS/Email Alert: Dear ${customer.name}, your issue (Ref: ${complaint.id}) has been received and assigned to our team. We are on it!`
      : `SMS/Email Alert: Dear ${customer.name}, your issue (Ref: ${complaint.id}) has been marked as RESOLVED. Resolution notes: "${complaint.resolution_notes}". Thank you!`;

    console.log(`[Notification System] Sent to ${customer.email || 'SMS'}: ${message}`);
    
    const customNotificationEvent = new CustomEvent('jb_simulated_notification', {
      detail: { message, date: new Date().toLocaleTimeString() }
    });
    window.dispatchEvent(customNotificationEvent);
  },

  // ----------------------------------------------------
  // Approvals Module
  // ----------------------------------------------------
  getApprovals() {
    return safeGetLocalStorage('jb_approvals', []);
  },

  processApproval(id, decision) {
    const approvals = this.getApprovals();
    const index = approvals.findIndex(a => a.id === id);
    if (index === -1) return null;

    const app = approvals[index];
    app.status = decision;
    app.approved_by = this.getActiveRole();
    app.approval_date = getDateOffset(0);

    if (decision === 'approved') {
      if (app.entity_type === 'orders') {
        const orders = safeGetLocalStorage('jb_orders', []);
        const ordIndex = orders.findIndex(o => o.id === app.entity_id);
        if (ordIndex !== -1) {
          if (app.proposed_data) {
            orders[ordIndex] = { ...orders[ordIndex], ...app.proposed_data };
          } else {
            orders.splice(ordIndex, 1);
          }
          localStorage.setItem('jb_orders', JSON.stringify(orders));
        }
      } else if (app.entity_type === 'customers') {
        if (!app.proposed_data) {
          let customers = this.getCustomers();
          customers = customers.filter(c => c.id !== app.entity_id);
          localStorage.setItem('jb_customers', JSON.stringify(customers));
        }
      }
    }

    localStorage.setItem('jb_approvals', JSON.stringify(approvals));
    window.dispatchEvent(new Event('jb_database_updated'));
    return app;
  }
};
