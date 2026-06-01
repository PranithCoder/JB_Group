import React, { useState, useEffect } from 'react';
import { db } from './lib/db';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AnalyticsModule from './components/AnalyticsModule';
import CustomerModule from './components/CustomerModule';
import OrderModule from './components/OrderModule';
import StaffModule from './components/StaffModule';
import InventoryModule from './components/InventoryModule';
import ComplaintModule from './components/ComplaintModule';
import ApprovalQueue from './components/ApprovalQueue';
import AuditLogs from './components/AuditLogs';
import { AlertCircle, ShieldAlert, Sparkles, X, BellRing } from 'lucide-react';

function App() {
  const [activeRole, setActiveRole] = useState(db.getActiveRole());
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [dbUpdate, setDbUpdate] = useState(0);
  const [latestSimulatedNotification, setLatestSimulatedNotification] = useState(null);

  // States to hold badge counts dynamically
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [openComplaintsCount, setOpenComplaintsCount] = useState(0);
  const [attendanceMissingToday, setAttendanceMissingToday] = useState(true);

  const triggerUpdate = () => {
    setDbUpdate(prev => prev + 1);
  };

  // Recalculate badge counts on database changes or role changes
  useEffect(() => {
    const approvals = db.getApprovals();
    const inventory = db.getInventory();
    const complaints = db.getComplaints();
    const attendance = db.getAttendance();

    setPendingApprovalsCount(approvals.filter(a => a.status === 'pending').length);
    setLowStockCount(inventory.filter(i => i.stock_on_hand < i.reorder_threshold).length);
    setOpenComplaintsCount(complaints.filter(c => c.status !== 'Resolved').length);
    
    // Check if attendance for today (2026-06-01) is logged
    const loggedToday = attendance.some(a => a.date === '2026-06-01');
    setAttendanceMissingToday(!loggedToday);
  }, [dbUpdate, activeRole]);

  // Listen to custom database updates from operations
  useEffect(() => {
    const handleDbUpdate = () => {
      setDbUpdate(prev => prev + 1);
    };

    const handleNotification = (e) => {
      setLatestSimulatedNotification(e.detail);
    };

    window.addEventListener('jb_database_updated', handleDbUpdate);
    window.addEventListener('jb_simulated_notification', handleNotification);

    return () => {
      window.removeEventListener('jb_database_updated', handleDbUpdate);
      window.removeEventListener('jb_simulated_notification', handleNotification);
    };
  }, []);

  const handleRoleChange = (role) => {
    db.setActiveRole(role);
    setActiveRole(role);

    // Dynamic role redirection rules:
    // If we switch to Officer, hide modules they can't access
    if (role === 'officer' && ['staff', 'inventory', 'approvals', 'audit'].includes(currentSection)) {
      setCurrentSection('dashboard');
    }
    // If we switch to Manager, hide super_admin-only pages
    if (role === 'manager' && ['audit'].includes(currentSection)) {
      setCurrentSection('dashboard');
    }
    // If we switch to Boss, hide super_admin-only pages
    if (role === 'boss' && ['approvals', 'audit'].includes(currentSection)) {
      setCurrentSection('dashboard');
    }
  };

  // Render current active module page
  const renderActiveModule = () => {
    switch (currentSection) {
      case 'dashboard':
        return (
          <AnalyticsModule 
            activeRole={activeRole} 
            setCurrentSection={setCurrentSection} 
            key={`${dbUpdate}-${activeRole}`} 
          />
        );
      case 'customers':
        return (
          <CustomerModule 
            activeRole={activeRole} 
            triggerUpdate={triggerUpdate} 
            key={`${dbUpdate}-${activeRole}`} 
          />
        );
      case 'orders':
        return (
          <OrderModule 
            activeRole={activeRole} 
            triggerUpdate={triggerUpdate} 
            key={`orders-${activeRole}`} 
          />
        );
      case 'staff':
        return (
          <StaffModule 
            activeRole={activeRole} 
            triggerUpdate={triggerUpdate} 
            key={`${dbUpdate}-${activeRole}`} 
          />
        );
      case 'inventory':
        return (
          <InventoryModule 
            activeRole={activeRole} 
            triggerUpdate={triggerUpdate} 
            key={`${dbUpdate}-${activeRole}`} 
          />
        );
      case 'complaints':
        return (
          <ComplaintModule 
            activeRole={activeRole} 
            triggerUpdate={triggerUpdate} 
            key={`${dbUpdate}-${activeRole}`} 
          />
        );
      case 'approvals':
        return (
          <ApprovalQueue 
            activeRole={activeRole} 
            triggerUpdate={triggerUpdate} 
            key={`${dbUpdate}-${activeRole}`} 
          />
        );
      case 'audit':
        return (
          <AuditLogs 
            activeRole={activeRole} 
            triggerUpdate={triggerUpdate} 
            key={`${dbUpdate}-${activeRole}`} 
          />
        );
      default:
        return <div>Module view not found.</div>;
    }
  };

  return (
    <div className="app-container">
      
      {/* Sidebar Layout Navigation */}
      <Sidebar 
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        activeRole={activeRole}
        pendingApprovalsCount={pendingApprovalsCount}
        lowStockCount={lowStockCount}
        openComplaintsCount={openComplaintsCount}
      />

      {/* Main Panel Content Area */}
      <div className="app-content">
        
        {/* Header section with profile details */}
        <Header 
          activeRole={activeRole}
          onRoleChange={handleRoleChange}
          currentSection={currentSection}
        />

        <main className="view-container">
          
          {/* Dynamic Dashboard Alerts Section */}
          {currentSection === 'dashboard' && (
            <div className="alerts-banner-container">
              {/* Overdue Attendance Reminder Alert for Manager */}
              {attendanceMissingToday && (activeRole === 'manager' || activeRole === 'super_admin') && (
                <div className="alert-banner danger">
                  <div className="alert-banner-left">
                    <AlertCircle size={16} />
                    <span><strong>Attendance Alert</strong>: Today's employee shift hours (June 1, 2026) have not been logged!</span>
                  </div>
                  <button className="alert-action-btn" onClick={() => setCurrentSection('staff')}>Log Hours Now</button>
                </div>
              )}

              {/* Pending Approvals Warning Alert */}
              {pendingApprovalsCount > 0 && (activeRole === 'manager' || activeRole === 'super_admin') && (
                <div className="alert-banner warning">
                  <div className="alert-banner-left">
                    <ShieldAlert size={16} />
                    <span><strong>Approvals Alert</strong>: There are {pendingApprovalsCount} pending critical database edits waiting for review.</span>
                  </div>
                  <button className="alert-action-btn" onClick={() => setCurrentSection('approvals')}>Open Queue</button>
                </div>
              )}

              {/* Low Stock Material Warning Alert */}
              {lowStockCount > 0 && activeRole === 'super_admin' && (
                <div className="alert-banner warning">
                  <div className="alert-banner-left">
                    <AlertCircle size={16} />
                    <span><strong>Stock Alert</strong>: {lowStockCount} items have fallen below their reorder threshold counts.</span>
                  </div>
                  <button className="alert-action-btn" onClick={() => setCurrentSection('inventory')}>Order Materials</button>
                </div>
              )}

              {/* Complaints Alert for Officer */}
              {openComplaintsCount > 0 && activeRole === 'officer' && (
                <div className="alert-banner warning">
                  <div className="alert-banner-left">
                    <AlertCircle size={16} />
                    <span><strong>Complaints Alert</strong>: There are {openComplaintsCount} open customer complaints currently in review.</span>
                  </div>
                  <button className="alert-action-btn" onClick={() => setCurrentSection('complaints')}>View Tickets</button>
                </div>
              )}
            </div>
          )}

          {/* Load Dynamic Feature Module */}
          {renderActiveModule()}

        </main>
      </div>

      {/* Floating Simulated SMS Notification Alert Panel */}
      {latestSimulatedNotification && (
        <div className="simulated-notification-panel">
          <div className="sim-nav-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <BellRing size={14} style={{ color: 'var(--color-success)' }} />
              <span>Simulated Notification</span>
            </div>
            <button className="sim-nav-close" onClick={() => setLatestSimulatedNotification(null)}>
              <X size={14} />
            </button>
          </div>
          <div className="sim-nav-body">
            {latestSimulatedNotification.message}
            <div className="sim-nav-time">{latestSimulatedNotification.date}</div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
