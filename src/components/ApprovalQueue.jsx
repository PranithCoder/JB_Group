import React, { useState } from 'react';
import { db } from '../lib/db';
import { FileCheck, Check, X, RefreshCw, Eye } from 'lucide-react';

export default function ApprovalQueue({ activeRole, triggerUpdate }) {
  const [approvals, setApprovals] = useState(db.getApprovals());
  const [viewingDetail, setViewingDetail] = useState(null);

  const refreshList = () => {
    setApprovals(db.getApprovals());
  };

  const handleAction = (id, decision) => {
    // decision = 'approved' | 'rejected'
    db.processApproval(id, decision);
    alert(`Request was successfully ${decision}!`);
    refreshList();
    triggerUpdate();
  };

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const pastApprovals = approvals.filter(a => a.status !== 'pending');

  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <FileCheck style={{ color: 'var(--color-primary)' }} size={20} />
          Manager Approvals Queue
        </h3>
        <button className="btn btn-secondary btn-sm" onClick={refreshList}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Pending Approvals</span>
            <span className="badge danger">{pendingApprovals.length} Action Needed</span>
          </h4>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Request Type</th>
                  <th>Requested By</th>
                  <th>Request Date</th>
                  <th>Proposed Modification Details</th>
                  <th>Review Changes</th>
                  <th>Decision Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      All clear! No pending approval requests from Officers.
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map(app => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600 }}>{app.id}</td>
                      <td style={{ fontWeight: 600 }}>{app.request_type}</td>
                      <td>{app.requested_by_name || 'Abi'}</td>
                      <td>{app.request_date}</td>
                      <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{app.details}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => setViewingDetail(app)}>
                          <Eye size={12} /> Diff Details
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary btn-sm" style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)', padding: '0.25rem 0.5rem' }} onClick={() => handleAction(app.id, 'approved')}>
                            <Check size={12} /> Approve
                          </button>
                          <button className="btn btn-danger btn-sm" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleAction(app.id, 'rejected')}>
                            <X size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.75rem' }}>Approval & Audit History</h4>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Request Type</th>
                  <th>Request Date</th>
                  <th>Details</th>
                  <th>Resolution Date</th>
                  <th>Processor Role</th>
                  <th>Decision Status</th>
                </tr>
              </thead>
              <tbody>
                {pastApprovals.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No resolved approval transactions recorded.
                    </td>
                  </tr>
                ) : (
                  pastApprovals.map(app => (
                    <tr key={app.id}>
                      <td>{app.id}</td>
                      <td>{app.request_type}</td>
                      <td>{app.request_date}</td>
                      <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{app.details}</td>
                      <td>{app.approval_date}</td>
                      <td style={{ textTransform: 'capitalize' }}>{app.approved_by}</td>
                      <td>
                        <span className={`badge ${app.status === 'approved' ? 'success' : 'danger'}`}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Viewing Diff Detail Modal */}
      {viewingDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Approval Request Details: {viewingDetail.id}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewingDetail(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600 }}>Proposed Action Summary</h4>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>{viewingDetail.details}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ backgroundColor: 'var(--color-danger-light)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-danger)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-danger)', textTransform: 'uppercase' }}>Original Data</span>
                    <pre style={{ fontSize: '0.75rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                      {JSON.stringify(viewingDetail.original_data, null, 2)}
                    </pre>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-success-light)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-success)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)', textTransform: 'uppercase' }}>Proposed Data</span>
                    <pre style={{ fontSize: '0.75rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                      {JSON.stringify(viewingDetail.proposed_data || 'DELETION RECORD', null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setViewingDetail(null)}>Close Review</button>
              <button type="button" className="btn btn-primary" style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }} onClick={() => { handleAction(viewingDetail.id, 'approved'); setViewingDetail(null); }}>
                Approve Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
