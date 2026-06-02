import React from 'react';
import { db } from '../lib/db';
import { User, ShieldAlert, Sparkles, Download } from 'lucide-react';

export default function Header({ activeRole, onRoleChange, currentSection }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'officer':
        return { label: 'Admin Officer', bg: '#eff6ff', text: '#2563eb', desc: 'Can manage Customers & Orders' };
      case 'manager':
        return { label: 'Manager', bg: '#fef3c7', text: '#b45309', desc: 'Can manage Staff, Inventory, Complaints & Approvals' };
      case 'boss':
        return { label: 'Boss (Read-Only)', bg: '#f3e8ff', text: '#7c3aed', desc: 'Summary dashboard of all modules. View-only.' };
      case 'super_admin':
        return { label: 'Super-Admin', bg: '#fee2e2', text: '#dc2626', desc: 'Full root access. Override controls & audit' };
      default:
        return { label: role, bg: '#f1f5f9', text: '#64748b', desc: '' };
    }
  };

  const roleInfo = getRoleBadge(activeRole);

  const sectionTitles = {
    dashboard: 'Dashboard Insights',
    customers: 'Customer Directory',
    orders: 'Order Bookings & Status',
    staff: 'Staff Attendance & Payroll',
    inventory: 'Inventory Catalog & Accounts',
    complaints: 'Complaint Resolution Tickets',
    approvals: 'Manager Approval Queue',
    audit: 'System Audit Logs'
  };

  return (
    <header className="app-header">
      <div className="header-title-section">
        <h1>{sectionTitles[currentSection] || 'JB Groups Tailor'}</h1>
        <p>{roleInfo.desc}</p>
      </div>

      <div className="header-actions">
        {/* Role Switcher Toolbar */}
        <div className="role-switcher">
          <button 
            className={`role-btn ${activeRole === 'officer' ? 'active' : ''}`}
            onClick={() => onRoleChange('officer')}
            title="Switch to Admin Officer view"
          >
            Officer
          </button>
          <button 
            className={`role-btn ${activeRole === 'manager' ? 'active' : ''}`}
            onClick={() => onRoleChange('manager')}
            title="Switch to Manager view"
          >
            Manager
          </button>
          <button 
            className={`role-btn ${activeRole === 'boss' ? 'active' : ''}`}
            onClick={() => onRoleChange('boss')}
            title="Switch to Boss (Read-Only) view"
          >
            Boss
          </button>
          <button 
            className={`role-btn ${activeRole === 'super_admin' ? 'active' : ''}`}
            onClick={() => onRoleChange('super_admin')}
            title="Switch to Super-Admin view"
          >
            Owner
          </button>
        </div>

        {/* Reset Database Button (Super-Admin only) */}
        {activeRole === 'super_admin' && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (confirm('Reset simulated database to default seed values? This clears all changes.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            title="Reset simulated database to defaults"
            style={{ padding: '0.375rem 0.625rem', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 600 }}
          >
            Reset DB
          </button>
        )}

        {/* Download Backup Button (Visible to Manager, Boss, Owner) */}
        {activeRole !== 'officer' && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => db.downloadBackup()}
            title="Download full database snapshot as a ZIP file"
            style={{ 
              padding: '0.375rem 0.625rem', 
              border: '1px solid #cbd5e1', 
              fontSize: '0.75rem', 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Download size={12} />
            Backup DB
          </button>
        )}

        {/* User profile indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: roleInfo.text + '20',
            color: roleInfo.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {activeRole.substring(0, 1).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeRole === 'officer' ? 'Alina Officer' : 
               activeRole === 'manager' ? 'Marcus Manager' :
               activeRole === 'boss' ? 'Brenda Boss' : 'Sam Super'}
            </span>
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: 600, 
              color: roleInfo.text, 
              backgroundColor: roleInfo.bg,
              padding: '0.05rem 0.35rem',
              borderRadius: '4px',
              width: 'fit-content'
            }}>
              {roleInfo.label}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
