import { firestore } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

export const DRESS_TYPES = [
  'alteration',
  'school uniform',
  'saree blouse',
  'frock',
  'salwar set',
  'top',
  'top set',
  'school court',
  'uniform',
  'pinoform',
  'baby frock',
  'shirt',
  'leghanga',
  'nursing dress',
  'court suite',
  'nurising uniform',
  'halfsaree',
  'skirt and blouse',
  'NAITA Court',
  'trouser',
  'shorts',
  'modern dress (Custom)',
  'hospital court',
  'school badges',
  'black shorts',
  'operation theater court'
];

const DEFAULT_USERS = [
  { id: 'usr-1', name: 'Alina Officer', email: 'officer@jbgroup.com', role: 'officer', status: 'Active' },
  { id: 'usr-2', name: 'Marcus Manager', email: 'manager@jbgroup.com', role: 'manager', status: 'Active' },
  { id: 'usr-3', name: 'Brenda Boss', email: 'boss@jbgroup.com', role: 'boss', status: 'Active' },
  { id: 'usr-4', name: 'Sam Super', email: 'super@jbgroup.com', role: 'super_admin', status: 'Active' }
];

const DEFAULT_CUSTOMERS = [];

export const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const TODAY_DATE = getTodayDateString();

// Helper to get relative dates to current local time (TODAY_DATE)
const getDateOffset = (days) => {
  const d = new Date(TODAY_DATE);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const DEFAULT_ORDERS = [];

const DEFAULT_STAFF = [];

// Seed attendance for the past week: May 25 to May 31, 2026
const seedAttendance = () => [];

const DEFAULT_INVENTORY = [];

const DEFAULT_PURCHASES = [];

const DEFAULT_COMPLAINTS = [];

const DEFAULT_APPROVALS = [];

const DEFAULT_RETAIL_INVENTORY = [];

const DEFAULT_RETAIL_SALES = [];

const DEFAULT_VISITS = [];

const DEFAULT_CALLS = [];

const DEFAULT_AUDIT_LOGS = [];


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
      if (!val || val === 'undefined' || JSON.parse(val).length === 0) {
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
  checkAndSeed('jb_retail_inventory', DEFAULT_RETAIL_INVENTORY);
  checkAndSeed('jb_retail_sales', DEFAULT_RETAIL_SALES);
  checkAndSeed('jb_visits', DEFAULT_VISITS);
  checkAndSeed('jb_calls', DEFAULT_CALLS);
  checkAndSeed('jb_audit_logs', DEFAULT_AUDIT_LOGS);


  if (!localStorage.getItem('jb_active_role')) {
    localStorage.setItem('jb_active_role', 'none');
  }

  localStorage.setItem('jb_db_initialized', 'true');
};

initLocalStorage();

const syncToFirestore = async (fsKey, item) => {
  if (!item || !item.id) return;
  try {
    const cleanItem = JSON.parse(JSON.stringify(item));
    if (cleanItem.customer) delete cleanItem.customer;
    if (cleanItem.assignedStaff) delete cleanItem.assignedStaff;
    if (cleanItem.item) delete cleanItem.item;
    if (cleanItem.order) delete cleanItem.order;
    if (cleanItem.product) delete cleanItem.product;
    await setDoc(doc(firestore, fsKey, item.id), cleanItem);

  } catch (err) {
    console.error(`Error syncing to Firestore (${fsKey}/${item.id}):`, err);
  }
};

const deleteFromFirestore = async (fsKey, id) => {
  if (!id) return;
  try {
    await deleteDoc(doc(firestore, fsKey, id));
  } catch (err) {
    console.error(`Error deleting from Firestore (${fsKey}/${id}):`, err);
  }
};

const collectionsToSync = [
  { fsKey: 'customers', lsKey: 'jb_customers' },
  { fsKey: 'orders', lsKey: 'jb_orders' },
  { fsKey: 'staff', lsKey: 'jb_staff' },
  { fsKey: 'attendance', lsKey: 'jb_attendance' },
  { fsKey: 'inventory', lsKey: 'jb_inventory' },
  { fsKey: 'purchases', lsKey: 'jb_purchases' },
  { fsKey: 'complaints', lsKey: 'jb_complaints' },
  { fsKey: 'approvals', lsKey: 'jb_approvals' },
  { fsKey: 'retail_inventory', lsKey: 'jb_retail_inventory' },
  { fsKey: 'retail_sales', lsKey: 'jb_retail_sales' },
  { fsKey: 'visits', lsKey: 'jb_visits' },
  { fsKey: 'calls', lsKey: 'jb_calls' },
  { fsKey: 'audit_logs', lsKey: 'jb_audit_logs' },
  { fsKey: 'users', lsKey: 'jb_users' }
];

collectionsToSync.forEach(({ fsKey, lsKey }) => {
  const colRef = collection(firestore, fsKey);
  onSnapshot(colRef, (snapshot) => {
    if (snapshot.empty) {
      const localData = safeGetLocalStorage(lsKey, []);
      if (localData.length > 0) {
        console.log(`Firestore collection "${fsKey}" is empty. Seeding from local storage...`);
        localData.forEach(async (item) => {
          if (item && item.id) {
            try {
              const cleanItem = JSON.parse(JSON.stringify(item));
              if (cleanItem.customer) delete cleanItem.customer;
              if (cleanItem.assignedStaff) delete cleanItem.assignedStaff;
              if (cleanItem.item) delete cleanItem.item;
              if (cleanItem.order) delete cleanItem.order;
              if (cleanItem.product) delete cleanItem.product;
              await setDoc(doc(firestore, fsKey, item.id), cleanItem);

            } catch (err) {
              console.error(`Seeding error for ${fsKey}/${item.id}:`, err);
            }
          }
        });
      }
      return;
    }

    let list = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data());
    });

    // Merge logic to protect local-first edits against server rollbacks or sync delays
    if (lsKey === 'jb_audit_logs' || lsKey === 'jb_retail_inventory') {
      const localData = safeGetLocalStorage(lsKey, []);
      const merged = [...list];
      localData.forEach(localItem => {
        if (localItem && localItem.id && !merged.some(remoteItem => remoteItem.id === localItem.id)) {
          merged.push(localItem);
        }
      });
      if (lsKey === 'jb_audit_logs') {
        merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      list = merged;
    }

    const localStr = localStorage.getItem(lsKey);
    const incomingStr = JSON.stringify(list);
    if (localStr !== incomingStr) {
      localStorage.setItem(lsKey, incomingStr);
      window.dispatchEvent(new Event('jb_database_updated'));
    }
  });
});

// Standard CRUD interfaces that pull/push from LocalStorage and trigger notifications

export const db = {
  // Active Role Helper
  getActiveRole() {
    return localStorage.getItem('jb_active_role') || 'none';
  },

  setActiveRole(role) {
    localStorage.setItem('jb_active_role', role);
    window.dispatchEvent(new Event('jb_database_updated'));
  },

  // ----------------------------------------------------
  // Users Module
  // ----------------------------------------------------
  getUsers() {
    const list = safeGetLocalStorage('jb_users', DEFAULT_USERS);
    return list.map(u => ({
      ...u,
      status: u.status || 'Active'
    }));
  },

  saveUser(user) {
    const list = this.getUsers();
    const index = list.findIndex(u => u.id === user.id);
    if (index !== -1) {
      list[index] = { ...list[index], ...user };
    } else {
      list.push(user);
    }
    localStorage.setItem('jb_users', JSON.stringify(list));
    syncToFirestore('users', user);
    window.dispatchEvent(new Event('jb_database_updated'));
    return user;
  },

  // ----------------------------------------------------
  // Customers Module
  // ----------------------------------------------------
  getCustomers() {
    return safeGetLocalStorage('jb_customers', []);
  },

  saveCustomer(customer) {
    const list = this.getCustomers();
    let savedCustomer;
    if (customer.id) {
      const index = list.findIndex(c => c.id === customer.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...customer };
        savedCustomer = list[index];
      }
    } else {
      customer.id = 'c-' + Date.now();
      customer.serviceHistoryCount = 0;
      customer.status = 'Active';
      list.unshift(customer);
      savedCustomer = customer;
    }
    localStorage.setItem('jb_customers', JSON.stringify(list));
    if (savedCustomer) syncToFirestore('customers', savedCustomer);
    window.dispatchEvent(new Event('jb_database_updated'));
    return savedCustomer || customer;
  },

  deleteCustomer(id) {
    const role = this.getActiveRole();
    if (role === 'officer') {
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
      syncToFirestore('approvals', app);
      window.dispatchEvent(new Event('jb_database_updated'));
      return { status: 'pending_approval', approvalId: app.id };
    }

    let list = this.getCustomers();
    list = list.filter(c => c.id !== id);
    localStorage.setItem('jb_customers', JSON.stringify(list));
    deleteFromFirestore('customers', id);
    window.dispatchEvent(new Event('jb_database_updated'));
    return { status: 'success' };
  },

  // ----------------------------------------------------
  // Branch Visits Module
  // ----------------------------------------------------
  getVisits() {
    return safeGetLocalStorage('jb_visits', []);
  },

  saveVisit(visit) {
    const list = this.getVisits();
    let savedVisit;
    if (visit.id) {
      const index = list.findIndex(v => v.id === visit.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...visit };
        savedVisit = list[index];
      }
    } else {
      visit.id = 'vst-' + Date.now();
      list.unshift(visit);
      savedVisit = visit;
    }
    localStorage.setItem('jb_visits', JSON.stringify(list));
    if (savedVisit) syncToFirestore('visits', savedVisit);
    window.dispatchEvent(new Event('jb_database_updated'));
    return savedVisit || visit;
  },

  deleteVisit(id) {
    let list = this.getVisits();
    list = list.filter(v => v.id !== id);
    localStorage.setItem('jb_visits', JSON.stringify(list));
    deleteFromFirestore('visits', id);
    window.dispatchEvent(new Event('jb_database_updated'));
    return { status: 'success' };
  },

  // ----------------------------------------------------
  // Call Logs Module
  // ----------------------------------------------------
  getCalls() {
    return safeGetLocalStorage('jb_calls', []);
  },

  saveCall(call) {
    const list = this.getCalls();
    let savedCall;
    if (call.id) {
      const index = list.findIndex(c => c.id === call.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...call };
        savedCall = list[index];
      }
    } else {
      call.id = 'cal-' + Date.now();
      list.unshift(call);
      savedCall = call;
    }
    localStorage.setItem('jb_calls', JSON.stringify(list));
    if (savedCall) syncToFirestore('calls', savedCall);
    window.dispatchEvent(new Event('jb_database_updated'));
    return savedCall || call;
  },

  deleteCall(id) {
    let list = this.getCalls();
    list = list.filter(c => c.id !== id);
    localStorage.setItem('jb_calls', JSON.stringify(list));
    deleteFromFirestore('calls', id);
    window.dispatchEvent(new Event('jb_database_updated'));
    return { status: 'success' };
  },

  // ----------------------------------------------------
  // Orders Module
  // ----------------------------------------------------
  getOrders() {
    const orders = safeGetLocalStorage('jb_orders', []);
    const customers = this.getCustomers();
    const staff = this.getStaff();
    return orders.map(ord => {
      let fallbackDressType = ord.dress_type;
      if (!fallbackDressType) {
        const noteLower = (ord.note || '').toLowerCase();
        if (noteLower.includes('trouser') || noteLower.includes('shorts') || noteLower.includes('pants')) fallbackDressType = 'trouser';
        else if (noteLower.includes('dress') || noteLower.includes('gown') || noteLower.includes('frock')) fallbackDressType = 'frock';
        else if (noteLower.includes('jacket') || noteLower.includes('tuxedo') || noteLower.includes('suit')) fallbackDressType = 'court suite';
        else if (noteLower.includes('shirt')) fallbackDressType = 'shirt';
        else if (ord.service_type === 'Alteration') fallbackDressType = 'alteration';
        else fallbackDressType = 'modern dress (Custom)';
      }
      let amountPaid = ord.amount_paid;
      if (amountPaid === undefined) {
        amountPaid = ord.payment_status === 'paid' ? ord.amount : 0;
      }
      let completedDate = ord.completed_date;
      if ((ord.status === 'completed' || ord.status === 'delivered') && !completedDate) {
        completedDate = ord.delivery_date || ord.order_date;
      }
      return {
        ...ord,
        dress_type: fallbackDressType,
        amount_paid: amountPaid,
        completed_date: completedDate,
        customer: customers.find(c => c.id === ord.customer_id) || { name: 'Unknown Customer' },
        assignedStaff: staff.find(s => s.id === ord.assigned_staff_id) || null,
        cuttingStaff: staff.find(s => s.id === ord.cutting_staff_id) || null,
        delivery_time: ord.delivery_time || '17:00',
        is_urgent: !!ord.is_urgent
      };
    });
  },

  saveOrder(order) {
    if (order.status === 'delivered' && order.payment_status !== 'paid') {
      const balance = order.amount - (order.amount_paid || 0);
      throw new Error(`Cannot deliver order! Outstanding balance of Rs. ${balance.toFixed(2)} must be fully paid first.`);
    }
    const role = this.getActiveRole();
    const list = safeGetLocalStorage('jb_orders', []);

    if (order.id) {
      const original = list.find(o => o.id === order.id);
      if (original && original.status !== order.status) {
        const cur = original.status;
        const nxt = order.status;
        if (cur === 'pending' && nxt !== 'in-progress') {
          throw new Error('Invalid transition! Pending orders can only move to In-Progress.');
        } else if (cur === 'in-progress' && nxt !== 'completed' && nxt !== 'pending') {
          throw new Error('Invalid transition! In-Progress orders can only move to Completed or Pending.');
        } else if (cur === 'completed' && nxt !== 'delivered') {
          throw new Error('Invalid transition! Completed orders can only move to Delivered.');
        } else if (cur === 'delivered') {
          throw new Error('Invalid transition! Delivered is the final stage.');
        }
      }
      
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
          details: `Change Delivery Date from ${original.delivery_date} to ${order.delivery_date}, and Amount from Rs. ${original.amount} to Rs. ${order.amount}`,
          original_data: original,
          proposed_data: order,
          status: 'pending',
          approved_by: null,
          approval_date: null
        };
        const approvals = this.getApprovals();
        approvals.unshift(app);
        localStorage.setItem('jb_approvals', JSON.stringify(approvals));
        syncToFirestore('approvals', app);
        window.dispatchEvent(new Event('jb_database_updated'));
        return { status: 'pending_approval', approvalId: app.id };
      }

      // Execute directly
      const index = list.findIndex(o => o.id === order.id);
      if (index !== -1) {
        let updatedOrder = { ...order };
        if ((order.status === 'completed' || order.status === 'delivered') && 
            (original.status !== 'completed' && original.status !== 'delivered')) {
          updatedOrder.completed_date = getDateOffset(0);
        }
        list[index] = { ...list[index], ...updatedOrder };
        syncToFirestore('orders', list[index]);
        // If order gets completed, automatically decrement some stock for demo
        if ((order.status === 'completed' || order.status === 'delivered') && 
            (original.status !== 'completed' && original.status !== 'delivered')) {
          this.decrementStockForOrder(order);
        }
      }
    } else {
      // New Order
      order.id = 'ord-' + Date.now();
      let nextNum = 3104;
      if (list.length > 0) {
        const numbers = list.map(o => {
          const match = (o.order_no || '').match(/JB-2026-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        });
        const maxNum = Math.max(...numbers);
        if (maxNum >= 3104) {
          nextNum = maxNum + 1;
        }
      }
      order.order_no = 'JB-2026-' + nextNum;
      order.order_date = getDateOffset(0);
      if (order.status === 'completed' || order.status === 'delivered') {
        order.completed_date = getDateOffset(0);
      }
      list.unshift(order);
      syncToFirestore('orders', order);

      // Increment customer's order history
      const customers = this.getCustomers();
      const cIndex = customers.findIndex(c => c.id === order.customer_id);
      if (cIndex !== -1) {
        customers[cIndex].serviceHistoryCount = (customers[cIndex].serviceHistoryCount || 0) + 1;
        localStorage.setItem('jb_customers', JSON.stringify(customers));
        syncToFirestore('customers', customers[cIndex]);
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
        syncToFirestore('inventory', thread);
      }
      // Fabric
      const fabric = items.find(i => i.category === 'Fabrics' && i.stock_on_hand > 5);
      if (fabric) {
        fabric.stock_on_hand -= 2;
        hasUpdated = true;
        syncToFirestore('inventory', fabric);
      }
      // Buttons
      const buttons = items.find(i => i.category === 'Buttons' && i.stock_on_hand > 0);
      if (buttons) {
        buttons.stock_on_hand -= 1;
        hasUpdated = true;
        syncToFirestore('inventory', buttons);
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
      syncToFirestore('approvals', app);
      window.dispatchEvent(new Event('jb_database_updated'));
      return { status: 'pending_approval', approvalId: app.id };
    }

    let list = safeGetLocalStorage('jb_orders', []);
    list = list.filter(o => o.id !== id);
    localStorage.setItem('jb_orders', JSON.stringify(list));
    deleteFromFirestore('orders', id);
    window.dispatchEvent(new Event('jb_database_updated'));
    return { status: 'success' };
  },

  // ----------------------------------------------------
  // Staff & Attendance Module
  // ----------------------------------------------------
  getStaff() {
    const list = safeGetLocalStorage('jb_staff', []);
    return list.map(emp => ({
      ...emp,
      pin: emp.pin || '1234'
    }));
  },

  saveStaff(employee) {
    const list = this.getStaff();
    let savedStaff;
    if (employee.id) {
      const index = list.findIndex(e => e.id === employee.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...employee };
        savedStaff = list[index];
      }
    } else {
      employee.id = 'stf-' + Date.now();
      employee.leaves = { sick: 12, casual: 12, vacation: 15 };
      list.push(employee);
      savedStaff = employee;
    }
    localStorage.setItem('jb_staff', JSON.stringify(list));
    if (savedStaff) syncToFirestore('staff', savedStaff);
    window.dispatchEvent(new Event('jb_database_updated'));
    return savedStaff || employee;
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
          syncToFirestore('staff', staffList[staffIndex]);
        }
      }
    }

    let savedRecord;
    if (index !== -1) {
      list[index] = { ...list[index], ...record };
      savedRecord = list[index];
    } else {
      record.id = `att-${record.staff_id}-${record.date}`;
      list.push(record);
      savedRecord = record;
    }
    localStorage.setItem('jb_attendance', JSON.stringify(list));
    if (savedRecord) syncToFirestore('attendance', savedRecord);
    window.dispatchEvent(new Event('jb_database_updated'));
    return savedRecord || record;
  },

  generateMonthlyPayroll(monthYearString) {
    const staff = this.getStaff();
    const attendance = this.getAttendance();
    const orders = this.getOrders();
    
    // Filter attendance for the selected month (starts with monthYearString)
    const monthRecords = attendance.filter(a => a.date && a.date.startsWith(monthYearString));

    // Filter completed/delivered orders for the selected month
    const completedMonthOrders = orders.filter(o => 
      (o.status === 'completed' || o.status === 'delivered') && 
      o.completed_date && o.completed_date.startsWith(monthYearString)
    );

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

      const bonus = (emp.monthly_bonuses && emp.monthly_bonuses[monthYearString]) || 0;

      // Commissions: 30% of half price (15% of total amount) for cutting and stitching parts separately
      let cuttingCommission = 0;
      let stitchingCommission = 0;
      completedMonthOrders.forEach(o => {
        if (o.cutting_staff_id === emp.id) {
          cuttingCommission += o.amount * 0.5 * 0.3;
        }
        if (o.assigned_staff_id === emp.id) {
          stitchingCommission += o.amount * 0.5 * 0.3;
        }
      });
      const commission = cuttingCommission + stitchingCommission;

      const netPay = Math.max(0, basePay + overtimePay - deductions + bonus + commission);

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
        bonus: Number(bonus.toFixed(2)),
        cutting_commission: Number(cuttingCommission.toFixed(2)),
        stitching_commission: Number(stitchingCommission.toFixed(2)),
        commission: Number(commission.toFixed(2)),
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
    let savedItem;
    if (item.id) {
      const index = list.findIndex(i => i.id === item.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...item };
        savedItem = list[index];
      }
    } else {
      item.id = 'inv-' + Date.now();
      item.stock_on_hand = Number(item.stock_on_hand || 0);
      item.reorder_threshold = Number(item.reorder_threshold || 0);
      item.unit_cost = Number(item.unit_cost || 0);
      list.push(item);
      savedItem = item;
    }
    localStorage.setItem('jb_inventory', JSON.stringify(list));
    if (savedItem) syncToFirestore('inventory', savedItem);
    window.dispatchEvent(new Event('jb_database_updated'));
    return savedItem || item;
  },

  deleteInventoryItem(id) {
    const role = this.getActiveRole();
    if (role !== 'super_admin') {
      return { status: 'error', message: 'Deleting inventory items requires Super-Admin approval!' };
    }
    let list = this.getInventory();
    list = list.filter(i => i.id !== id);
    localStorage.setItem('jb_inventory', JSON.stringify(list));
    deleteFromFirestore('inventory', id);
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
    syncToFirestore('purchases', purchase);

    const itemIndex = inventory.findIndex(i => i.id === purchase.item_id);
    if (itemIndex !== -1) {
      inventory[itemIndex].stock_on_hand += purchase.quantity;
      if (purchase.quantity > 0) {
        inventory[itemIndex].unit_cost = Number((purchase.total_cost / purchase.quantity).toFixed(2));
      }
      localStorage.setItem('jb_inventory', JSON.stringify(inventory));
      syncToFirestore('inventory', inventory[itemIndex]);
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
    let savedComplaint;
    
    if (complaint.id) {
      const index = list.findIndex(c => c.id === complaint.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...complaint };
        savedComplaint = list[index];
      }
    } else {
      isNew = true;
      complaint.id = 'comp-' + Date.now();
      complaint.date_reported = getDateOffset(0);
      complaint.status = complaint.status || 'In Review';
      list.unshift(complaint);
      savedComplaint = complaint;
    }
    
    localStorage.setItem('jb_complaints', JSON.stringify(list));
    if (savedComplaint) syncToFirestore('complaints', savedComplaint);
    window.dispatchEvent(new Event('jb_database_updated'));

    if (isNew) {
      this.triggerCustomerNotification(complaint, 'Complaint Registered');
    } else if (complaint.status === 'Resolved') {
      this.triggerCustomerNotification(complaint, 'Complaint Resolved');
    }

    return savedComplaint || complaint;
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
            syncToFirestore('orders', orders[ordIndex]);
          } else {
            orders.splice(ordIndex, 1);
            deleteFromFirestore('orders', app.entity_id);
          }
          localStorage.setItem('jb_orders', JSON.stringify(orders));
        }
      } else if (app.entity_type === 'customers') {
        if (!app.proposed_data) {
          let customers = this.getCustomers();
          customers = customers.filter(c => c.id !== app.entity_id);
          deleteFromFirestore('customers', app.entity_id);
          localStorage.setItem('jb_customers', JSON.stringify(customers));
        }
      } else if (app.entity_type === 'short_leave') {
        const attendance = this.getAttendance();
        const attIndex = attendance.findIndex(a => a.staff_id === app.entity_id && a.date === app.request_date);
        if (attIndex !== -1) {
          attendance[attIndex].leave_type = 'short_leave';
          localStorage.setItem('jb_attendance', JSON.stringify(attendance));
          if (typeof syncToFirestore === 'function') {
            syncToFirestore('attendance', attendance[attIndex]);
          }
        }
      }
    }

    localStorage.setItem('jb_approvals', JSON.stringify(approvals));
    syncToFirestore('approvals', app);
    window.dispatchEvent(new Event('jb_database_updated'));
    return app;
  },

  createShortLeaveRequest(staffId, staffName, todayRecord) {
    const approvals = this.getApprovals();
    const app = {
      id: 'appr-' + Date.now(),
      request_type: 'Short Leave Request',
      requested_by: staffId,
      requested_by_name: staffName,
      request_date: getTodayDateString(),
      entity_type: 'short_leave',
      entity_id: staffId,
      details: `${staffName} requests Short Leave on ${getTodayDateString()}`,
      original_data: todayRecord || { staff_id: staffId, date: getTodayDateString(), status: 'Present' },
      proposed_data: { status: 'Present', leave_type: 'short_leave' },
      status: 'pending',
      approved_by: null,
      approval_date: null
    };
    approvals.unshift(app);
    localStorage.setItem('jb_approvals', JSON.stringify(approvals));
    if (typeof syncToFirestore === 'function') {
      syncToFirestore('approvals', app);
    }
    window.dispatchEvent(new Event('jb_database_updated'));
    return app;
  },

  // ----------------------------------------------------
  // Database Backup Download (.zip)
  // ----------------------------------------------------
  async downloadBackup() {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Format current snapshots from db helper methods
      zip.file('customers.json', JSON.stringify(this.getCustomers(), null, 2));
      zip.file('orders.json', JSON.stringify(this.getOrders(), null, 2));
      zip.file('staff.json', JSON.stringify(this.getStaff(), null, 2));
      zip.file('attendance.json', JSON.stringify(this.getAttendance(), null, 2));
      zip.file('inventory.json', JSON.stringify(this.getInventory(), null, 2));
      zip.file('purchases.json', JSON.stringify(this.getPurchases(), null, 2));
      zip.file('complaints.json', JSON.stringify(this.getComplaints(), null, 2));
      zip.file('approvals.json', JSON.stringify(this.getApprovals(), null, 2));
      zip.file('retail_inventory.json', JSON.stringify(this.getRetailInventory(), null, 2));
      zip.file('retail_sales.json', JSON.stringify(this.getRetailSales(), null, 2));
      zip.file('audit_logs.json', JSON.stringify(this.getAuditLogs(), null, 2));

      // Generate the ZIP file async
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      
      // Trigger user browser download
      const a = document.createElement('a');
      a.href = url;
      a.download = `jb_group_backup_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating backup zip:', err);
      alert('Failed to generate database backup. See console for details.');
    }
  },

  // ----------------------------------------------------
  // Retail & Accessories Module
  // ----------------------------------------------------
  getRetailInventory() {
    return safeGetLocalStorage('jb_retail_inventory', []);
  },

  saveRetailProduct(product) {
    const list = this.getRetailInventory();
    let savedProduct;
    if (product.id) {
      const index = list.findIndex(p => p.id === product.id);
      if (index !== -1) {
        const oldProduct = list[index];
        const newProduct = { ...oldProduct, ...product };

        // Compare price and stock count
        const priceChanged = Number(oldProduct.retail_price) !== Number(newProduct.retail_price);
        const stockChanged = Number(oldProduct.stock_on_hand) !== Number(newProduct.stock_on_hand);

        if (priceChanged || stockChanged) {
          const changeDetails = [];
          if (priceChanged) {
            changeDetails.push(`Price changed from Rs. ${Number(oldProduct.retail_price).toFixed(2)} to Rs. ${Number(newProduct.retail_price).toFixed(2)}`);
          }
          if (stockChanged) {
            changeDetails.push(`Stock count adjusted from ${oldProduct.stock_on_hand} to ${newProduct.stock_on_hand}`);
          }
          this.addAuditLog(
            `Amended Product ${newProduct.name}`,
            changeDetails.join(', ')
          );
        }

        list[index] = newProduct;
        savedProduct = list[index];
      }
    } else {
      product.id = 'ri-' + Date.now();
      product.stock_on_hand = Number(product.stock_on_hand || 0);
      product.unit_cost = Number(product.unit_cost || 0);
      product.retail_price = Number(product.retail_price || 0);
      list.unshift(product);
      savedProduct = product;

      // Log new product creation
      this.addAuditLog(
        `Created Product ${product.name}`,
        `Initial Stock: ${product.stock_on_hand}, Price: Rs. ${Number(product.retail_price).toFixed(2)}`
      );
    }
    localStorage.setItem('jb_retail_inventory', JSON.stringify(list));
    if (savedProduct) syncToFirestore('retail_inventory', savedProduct);
    window.dispatchEvent(new Event('jb_database_updated'));
    return savedProduct || product;
  },

  deleteRetailProduct(id) {
    const role = this.getActiveRole();
    if (role !== 'super_admin' && role !== 'manager') {
      return { status: 'error', message: 'Deleting retail products requires Manager or Owner role!' };
    }
    let list = this.getRetailInventory();
    const product = list.find(p => p.id === id);
    list = list.filter(p => p.id !== id);
    localStorage.setItem('jb_retail_inventory', JSON.stringify(list));
    deleteFromFirestore('retail_inventory', id);
    if (product) {
      this.addAuditLog(
        `Deleted Product ${product.name}`,
        `Removed product from catalog (ID: ${id})`
      );
    }
    window.dispatchEvent(new Event('jb_database_updated'));
    return { status: 'success' };
  },

  // ----------------------------------------------------
  // Audit Logs Module
  // ----------------------------------------------------
  getAuditLogs() {
    const logs = safeGetLocalStorage('jb_audit_logs', []);
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  saveAuditLog(log) {
    const logs = this.getAuditLogs();
    const index = logs.findIndex(l => l.id === log.id);
    if (index !== -1) {
      logs[index] = { ...logs[index], ...log };
      localStorage.setItem('jb_audit_logs', JSON.stringify(logs));
      syncToFirestore('audit_logs', logs[index]);
      window.dispatchEvent(new Event('jb_database_updated'));
    }
  },

  addAuditLog(action, details, status = 'Executed') {
    const logs = this.getAuditLogs();
    const role = this.getActiveRole();
    const userObj = DEFAULT_USERS.find(u => u.role === role);
    const userName = userObj ? userObj.name : (role.charAt(0).toUpperCase() + role.slice(1));

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newLog = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp,
      user: userName,
      action,
      details,
      status
    };

    logs.unshift(newLog);
    localStorage.setItem('jb_audit_logs', JSON.stringify(logs));
    syncToFirestore('audit_logs', newLog);
    window.dispatchEvent(new Event('jb_database_updated'));
    return newLog;
  },

  getRetailSales() {
    const sales = safeGetLocalStorage('jb_retail_sales', []);
    const inventory = this.getRetailInventory();
    const customers = this.getCustomers();
    return sales.map(s => ({
      ...s,
      product: inventory.find(i => i.id === s.product_id) || { name: 'Deleted Product', category: 'General' },
      customer: customers.find(c => c.id === s.customer_id) || { name: 'Unknown Customer' }
    }));
  },

  saveRetailSale(sale) {
    const salesList = safeGetLocalStorage('jb_retail_sales', []);
    const inventoryList = this.getRetailInventory();

    sale.id = 'rs-' + Date.now();
    sale.sale_date = sale.sale_date || getDateOffset(0);
    sale.qty = Number(sale.qty || 1);
    sale.unit_price = Number(sale.unit_price || 0);
    sale.total_price = Number((sale.qty * sale.unit_price).toFixed(2));
    sale.payment_status = sale.payment_status || 'paid';

    // Decrement inventory stock
    const pIndex = inventoryList.findIndex(i => i.id === sale.product_id);
    if (pIndex !== -1) {
      inventoryList[pIndex].stock_on_hand = Math.max(0, inventoryList[pIndex].stock_on_hand - sale.qty);
      localStorage.setItem('jb_retail_inventory', JSON.stringify(inventoryList));
      syncToFirestore('retail_inventory', inventoryList[pIndex]);
    }

    salesList.unshift(sale);
    localStorage.setItem('jb_retail_sales', JSON.stringify(salesList));
    syncToFirestore('retail_sales', sale);
    window.dispatchEvent(new Event('jb_database_updated'));
    return sale;
  },

  async clearAllData() {
    const keysToClear = [
      'jb_customers',
      'jb_orders',
      'jb_staff',
      'jb_attendance',
      'jb_inventory',
      'jb_purchases',
      'jb_complaints',
      'jb_approvals',
      'jb_retail_inventory',
      'jb_retail_sales',
      'jb_visits',
      'jb_calls',
      'jb_audit_logs'
    ];
    keysToClear.forEach(key => localStorage.setItem(key, JSON.stringify([])));

    const collectionsToClear = [
      'customers',
      'orders',
      'staff',
      'attendance',
      'inventory',
      'purchases',
      'complaints',
      'approvals',
      'retail_inventory',
      'retail_sales',
      'visits',
      'calls',
      'audit_logs'
    ];

    const promises = collectionsToClear.map(async (colName) => {
      try {
        const colRef = collection(firestore, colName);
        const querySnapshot = await getDocs(colRef);
        const deletePromises = [];
        querySnapshot.forEach((docSnap) => {
          deletePromises.push(deleteDoc(doc(firestore, colName, docSnap.id)));
        });
        await Promise.all(deletePromises);
      } catch (err) {
        console.error(`Error clearing Firestore collection ${colName}:`, err);
      }
    });

    await Promise.all(promises);
    window.dispatchEvent(new Event('jb_database_updated'));
  }
};


