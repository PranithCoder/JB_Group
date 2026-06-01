import React, { useState } from 'react';
import { db } from '../lib/db';
import { ShieldCheck, ToggleLeft, ToggleRight, RotateCcw, Search, UserCheck, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

export default function AuditLogs({ activeRole, triggerUpdate }) {
  const [users, setUsers] = useState([
    { id: 'usr-1', name: 'Alina Officer', email: 'officer@jbgroup.com', role: 'officer', status: 'Active' },
    { id: 'usr-2', name: 'Marcus Manager', email: 'manager@jbgroup.com', role: 'manager', status: 'Active' },
    { id: 'usr-3', name: 'Brenda Boss', email: 'boss@jbgroup.com', role: 'boss', status: 'Active' },
    { id: 'usr-4', name: 'Sam Super', email: 'super@jbgroup.com', role: 'super_admin', status: 'Active' }
  ]);

  const [auditLogs, setAuditLogs] = useState([
    { id: 'log-1', timestamp: '2026-06-01 14:32:10', user: 'Alina Officer', action: 'Modified Order JB-2026-105', details: 'Quoted amount updated from $2400 to $2300 (Sent to Manager approval queue)', status: 'Pending Approval' },
    { id: 'log-2', timestamp: '2026-06-01 11:15:04', user: 'Marcus Manager', action: 'Approved Complaint Ticket comp-2', details: 'Status set to Resolved; notes added: "Re-hemmed with heavy-duty fibers"', status: 'Executed' },
    { id: 'log-3', timestamp: '2026-05-31 16:45:00', user: 'Alina Officer', action: 'Created Customer Bruce Wayne', details: 'Enrolled Bruce Wayne (+1 555-019-9999)', status: 'Executed' },
    { id: 'log-4', timestamp: '2026-05-31 10:20:11', user: 'Marcus Manager', action: 'Recorded Purchase pur-1', details: 'Purchased 30m Egyptian Cotton ($375.00 total expense)', status: 'Executed' },
    { id: 'log-5', timestamp: '2026-05-30 09:00:22', user: 'Alina Officer', action: 'Deleted Customer c-4', details: 'Attempted to delete Clara Oswald. Action blocked; redirected to approval queue', status: 'Blocked' }
  ]);

  const [notification, setNotification] = useState(null);

  const toggleUserStatus = (userId) => {
    const list = users.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        return { ...u, status: nextStatus };
      }
      return u;
    });
    setUsers(list);
    setNotification(`User status updated successfully.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const revertAction = (logId) => {
    setAuditLogs(prev => prev.map(l => {
      if (l.id === logId) {
        return { ...l, status: 'Reverted' };
      }
      return l;
    }));
    setNotification(`Action ${logId} has been successfully overridden and reverted in database.`);
    triggerUpdate();
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
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
