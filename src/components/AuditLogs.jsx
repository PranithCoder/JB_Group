import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { ShieldCheck, ToggleLeft, ToggleRight, RotateCcw, Search, UserCheck, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

export default function AuditLogs({ activeRole, triggerUpdate }) {
  const [users, setUsers] = useState(() => db.getUsers());

  const [auditLogs, setAuditLogs] = useState(() => db.getAuditLogs());

  useEffect(() => {
    const handleUpdate = () => {
      setAuditLogs(db.getAuditLogs());
      setUsers(db.getUsers());
    };
    window.addEventListener('jb_database_updated', handleUpdate);
    return () => window.removeEventListener('jb_database_updated', handleUpdate);
  }, []);

  const [notification, setNotification] = useState(null);

  const toggleUserStatus = (userId) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser) {
      const nextStatus = targetUser.status === 'Active' ? 'Suspended' : 'Active';
      const updatedUser = { ...targetUser, status: nextStatus };
      db.saveUser(updatedUser);

      // Log the status toggle in audit logs
      db.addAuditLog(
        `${nextStatus === 'Suspended' ? 'Deactivated' : 'Activated'} User Account`,
        `${nextStatus === 'Suspended' ? 'Suspended' : 'Activated'} access for user ${targetUser.name} (${targetUser.email})`
      );

      setNotification(`User status updated to ${nextStatus} successfully.`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const revertAction = (logId) => {
    const logs = db.getAuditLogs();
    const logIndex = logs.findIndex(l => l.id === logId);
    if (logIndex !== -1) {
      const targetLog = logs[logIndex];
      targetLog.status = 'Reverted';
      db.saveAuditLog(targetLog);

      // Log the revert action itself
      db.addAuditLog('Reverted Action', `Reverted action log ${logId}: "${targetLog.action}"`);

      setNotification(`Action ${logId} has been successfully overridden and reverted in database.`);
      triggerUpdate();
      setTimeout(() => setNotification(null), 3500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* System Audit Diagnostic Box */}
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#eff6ff', 
        border: '1px solid #bfdbfe', 
        borderRadius: '8px', 
        fontSize: '0.825rem', 
        color: '#1e40af',
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.25rem' 
      }}>
        <div style={{ fontWeight: 700 }}>🔍 System Audit Logs Diagnostic Hub:</div>
        <div>Current Active Role: <strong>{activeRole}</strong></div>
        <div>Total Logs in Database: <strong>{auditLogs.length}</strong></div>
        <div>Latest Log ID: <strong>{auditLogs[0]?.id || 'N/A'}</strong></div>
        <div style={{ marginTop: '0.75rem' }}>
          <button 
            onClick={async () => {
              if (window.confirm('Are you sure you want to clear all dummy details and reset the database? This cannot be undone.')) {
                try {
                  setNotification('Resetting database...');
                  await db.clearAllData();
                  setNotification('Database has been reset successfully! Start fresh.');
                  triggerUpdate();
                  setTimeout(() => setNotification(null), 3000);
                } catch (err) {
                  setNotification('Error resetting database: ' + err.message);
                }
              }
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
          >
            🗑️ Reset Database (Start Fresh)
          </button>
        </div>
      </div>
      
      {notification && (
        <div className="alert-banner info">
          <div className="alert-banner-left">
            <CheckCircle size={16} />
            <span>{notification}</span>
          </div>
          <button className="alert-action-btn" onClick={() => setNotification(null)}>Dismiss</button>
        </div>
      )}

      {/* Control Panel Section */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        
        {/* User Account Controls */}
        <div className="card">
          <div className="card-header">
            <h3>
              <UserCheck size={18} style={{ color: 'var(--color-primary)' }} />
              System Roles & Accounts
            </h3>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Deactivate logins or suspend account access rules in real-time.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {users.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: u.status === 'Suspended' ? 'var(--color-danger-light)' : 'inherit' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email} • {u.role}</div>
                  </div>
                  <button 
                    onClick={() => toggleUserStatus(u.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: u.status === 'Active' ? 'var(--color-success)' : 'var(--color-danger)' }}
                    title={u.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                  >
                    {u.status === 'Active' ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Trail Logs */}
        <div className="card">
          <div className="card-header">
            <h3>
              <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
              System Activity Logs
            </h3>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table className="data-table" style={{ fontSize: '0.825rem' }}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Log Details</th>
                    <th>Status</th>
                    <th>Override</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id}>
                      <td>{log.timestamp}</td>
                      <td style={{ fontWeight: 600 }}>{log.user}</td>
                      <td style={{ fontWeight: 600 }}>{log.action}</td>
                      <td>{log.details}</td>
                      <td>
                        <span className={`badge ${
                          log.status === 'Executed' ? 'success' :
                          log.status === 'Pending Approval' ? 'warning' :
                          log.status === 'Blocked' ? 'danger' : 'info'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td>
                        {log.status === 'Executed' ? (
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ padding: '0.25rem 0.375rem', display: 'flex', gap: '0.25rem', fontSize: '0.7rem' }}
                            onClick={() => revertAction(log.id)}
                          >
                            <RotateCcw size={10} /> Revert
                          </button>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
