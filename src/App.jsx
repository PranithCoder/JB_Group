import React, { useState, useEffect } from 'react';
import { db, TODAY_DATE } from './lib/db';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import WelcomePortal from './components/WelcomePortal';
import AnalyticsModule from './components/AnalyticsModule';
import CustomerModule from './components/CustomerModule';
import OrderModule from './components/OrderModule';
import StaffModule from './components/StaffModule';
import InventoryModule from './components/InventoryModule';
import ComplaintModule from './components/ComplaintModule';
import ApprovalQueue from './components/ApprovalQueue';
import AuditLogs from './components/AuditLogs';
import RetailModule from './components/RetailModule';
import VisitModule from './components/VisitModule';
import CallModule from './components/CallModule';
import TailorDashboard from './components/TailorDashboard';
import { AlertCircle, ShieldAlert, Sparkles, X, BellRing } from 'lucide-react';


function App() {
  const [activeRole, setActiveRole] = useState('none');
  const [portalView, setPortalView] = useState('welcome');
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [dbUpdate, setDbUpdate] = useState(0);
  const [latestSimulatedNotification, setLatestSimulatedNotification] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Reset session on page load/reload to prevent auto-login
  useEffect(() => {
    localStorage.removeItem('jb_portal_view');
    localStorage.removeItem('jb_active_tailor_id');
    db.setActiveRole('none');
    setActiveRole('none');
    setPortalView('welcome');
  }, []);

  const handleLoginAdmin = (role) => {
    db.setActiveRole(role);
    setActiveRole(role);
    setPortalView('admin');
    localStorage.setItem('jb_portal_view', 'admin');
    setCurrentSection('dashboard');
  };

  const handleLoginTailor = (tailorId) => {
    localStorage.setItem('jb_active_tailor_id', tailorId);
    db.setActiveRole('tailor');
    setActiveRole('tailor');
    setPortalView('tailor');
    localStorage.setItem('jb_portal_view', 'tailor');
    setCurrentSection('tailor_dashboard');
  };

  const handleExitPortal = () => {
    localStorage.removeItem('jb_active_tailor_id');
    localStorage.setItem('jb_portal_view', 'welcome');
    setPortalView('welcome');
    db.setActiveRole('none');
    setActiveRole('none');
  };

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
    
    // Check if attendance for today (TODAY_DATE) is logged
    const loggedToday = attendance.some(a => a.date === TODAY_DATE);
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
    // Switch to tailor role defaults to Tailor Station dashboard
    if (role === 'tailor') {
      setPortalView('tailor');
      localStorage.setItem('jb_portal_view', 'tailor');
      setCurrentSection('tailor_dashboard');
    }
    // Switch away from tailor resets back to regular dashboard
    if (role !== 'tailor' && currentSection === 'tailor_dashboard') {
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
      case 'retail':
        return (
          <RetailModule 
            activeRole={activeRole} 
            triggerUpdate={triggerUpdate} 
            key={`retail-${activeRole}`} 
          />
        );
      case 'visits':
        return (
          <VisitModule 
            activeRole={activeRole} 
            triggerUpdate={triggerUpdate} 
            key={`${dbUpdate}-${activeRole}`} 
          />
        );
      case 'calls':
        return (
          <CallModule 
            activeRole={activeRole} 
            triggerUpdate={triggerUpdate} 
            key={`${dbUpdate}-${activeRole}`} 
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
      case 'tailor_dashboard':
        return (
          <TailorDashboard 
            triggerUpdate={triggerUpdate} 
            onExitPortal={handleExitPortal}
            key={`${dbUpdate}-${activeRole}`} 
          />
        );
    }
  };

  const formattedTodayDate = new Date(TODAY_DATE).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (portalView === 'welcome') {
    return (
      <WelcomePortal 
        onLoginAdmin={handleLoginAdmin}
        onLoginTailor={handleLoginTailor}
      />
    );
  }

  if (portalView === 'tailor') {
    return (
      <div className="app-container" style={{ display: 'block' }}>
        <div className="app-content" style={{ marginLeft: 0, width: '100%', padding: '1rem' }}>
          <Header 
            activeRole={activeRole}
            onRoleChange={handleRoleChange}
            currentSection={currentSection}
            onMenuToggle={() => {}}
            onExitPortal={handleExitPortal}
            portalView={portalView}
          />
          <main className="view-container" style={{ padding: '1.5rem 0' }}>
            {renderActiveModule()}
          </main>
        </div>
      </div>
    );
  }

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
        isOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
      />

      {/* Main Panel Content Area */}
      <div className="app-content">
        
        {/* Header section with profile details */}
        <Header 
          activeRole={activeRole}
          onRoleChange={handleRoleChange}
          currentSection={currentSection}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onExitPortal={handleExitPortal}
          portalView={portalView}
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
                    <span><strong>Attendance Alert</strong>: Today's employee shift hours ({formattedTodayDate}) have not been logged!</span>
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
