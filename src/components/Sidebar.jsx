import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  FileCheck, 
  Boxes, 
  AlertTriangle, 
  UsersRound, 
  ShieldCheck, 
  Scissors,
  ShoppingCart,
  MapPin,
  Phone,
  X
} from 'lucide-react';

export default function Sidebar({ 
  currentSection, 
  setCurrentSection, 
  activeRole, 
  pendingApprovalsCount, 
  lowStockCount,
  openComplaintsCount,
  isOpen,
  onCloseSidebar
}) {
  
  // Define menu items with visibility logic
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      roles: ['officer', 'manager', 'boss', 'super_admin'] 
    },
    { 
      id: 'tailor_dashboard', 
      label: 'Tailor Station', 
      icon: Scissors, 
      roles: ['tailor'] 
    },
    { 
      id: 'customers', 
      label: 'Customers', 
      icon: Users, 
      roles: ['officer', 'manager', 'boss', 'super_admin'] 
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: ShoppingBag, 
      roles: ['officer', 'manager', 'boss', 'super_admin']
    },
    { 
      id: 'retail', 
      label: 'Retail & Accessories', 
      icon: ShoppingCart, 
      roles: ['officer', 'manager', 'boss', 'super_admin']
    },
    { 
      id: 'visits', 
      label: 'Branch Visits', 
      icon: MapPin, 
      roles: ['officer', 'manager', 'boss', 'super_admin'] 
    },
    { 
      id: 'calls', 
      label: 'Call Logs', 
      icon: Phone, 
      roles: ['officer', 'manager', 'boss', 'super_admin'] 
    },

    { 
      id: 'staff', 
      label: 'Staff & Attendance', 
      icon: UsersRound, 
      roles: ['manager', 'boss', 'super_admin'] 
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: Boxes, 
      roles: ['manager', 'boss', 'super_admin'],
      badge: activeRole === 'super_admin' && lowStockCount > 0 ? { count: lowStockCount, type: 'warning' } : null
    },
    { 
      id: 'complaints', 
      label: 'Complaints', 
      icon: AlertTriangle, 
      roles: ['officer', 'manager', 'boss', 'super_admin'],
      badge: (activeRole === 'manager' || activeRole === 'officer') && openComplaintsCount > 0 
        ? { count: openComplaintsCount, type: 'danger' } 
        : null
    },
    { 
      id: 'approvals', 
      label: 'Approvals Queue', 
      icon: FileCheck, 
      roles: ['manager', 'super_admin'],
      badge: pendingApprovalsCount > 0 ? { count: pendingApprovalsCount, type: 'danger' } : null
    },
    { 
      id: 'audit', 
      label: 'System Audit', 
      icon: ShieldCheck, 
      roles: ['super_admin'] 
    }
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(activeRole));

  return (
    <>
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onCloseSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 40
          }}
        />
      )}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Scissors size={24} style={{ color: '#3b82f6' }} />
          <span className="sidebar-logo">JB GROUPS</span>
        </div>
        <button 
          className="mobile-close-btn"
          onClick={onCloseSidebar}
          title="Close Sidebar"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-menu">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentSection(item.id);
                if (onCloseSidebar) onCloseSidebar();
              }}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <div className="sidebar-item-left">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge.count > 0 && (
                <span className={`sidebar-badge ${item.badge.type || ''}`}>
                  {item.badge.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>JB Tailors Admin</div>
        <div style={{ fontSize: '0.675rem', marginTop: '0.25rem' }}>v1.0.0 • Supabase RLS</div>
      </div>
    </aside>
    </>
  );
}
