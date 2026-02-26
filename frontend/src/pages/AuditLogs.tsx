// ============================================================
// Audit Logs Page — System audit trail (admin/manager only)
// ============================================================
import React, { useState, useEffect } from 'react';
import { auditApi } from '../api/client';
import type { AuditLog } from '../types';
import { ClipboardList, Globe } from 'lucide-react';

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    useEffect(() => { loadLogs(); }, [page]);

    const loadLogs = async () => {
        try {
            const { data } = await auditApi.getAll(page, 50);
            setLogs(data.items);
            setTotal(data.total);
        } catch (err) { console.error(err); }
    };

    const actionBadge = (action: string) => {
        const map: Record<string, string> = {
            LOGIN: 'success', REGISTER: 'info', CHECK_IN: 'success', CHECK_OUT: 'warning',
            CREATE: 'primary', UPDATE: 'info', DELETE: 'danger', '2FA_ENABLED': 'primary',
        };
        return <span className={`badge badge-${map[action] || 'info'}`}>{action}</span>;
    };

    return (
        <div>
            <div className="page-header">
                <h2>Audit Logs</h2>
                <p>Complete system audit trail for compliance</p>
            </div>

            {/* Desktop Table */}
            <div className="data-table-container desktop-only">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Entity</th>
                            <th>Details</th>
                            <th>IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                                    {new Date(log.timestamp).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'medium' })}
                                </td>
                                <td>{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}</td>
                                <td>{actionBadge(log.action)}</td>
                                <td style={{ textTransform: 'capitalize' }}>{log.entity}</td>
                                <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--sf-text-muted)' }}>
                                    {log.details ? JSON.stringify(log.details) : '—'}
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.ipAddress || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && (
                    <div className="empty-state">
                        <ClipboardList size={48} />
                        <h4>No audit logs yet</h4>
                        <p>System activity will appear here</p>
                    </div>
                )}
            </div>

            {/* Mobile Cards */}
            <div className="mobile-only">
                {logs.map((log) => (
                    <div className="card" key={log.id} style={{ marginBottom: 10, padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 4 }}>
                                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--sf-text-muted)' }}>
                                    {new Date(log.timestamp).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                            </div>
                            {actionBadge(log.action)}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: '0.82rem' }}>
                            <span style={{ textTransform: 'capitalize', color: 'var(--sf-text-secondary)' }}>{log.entity}</span>
                            {log.ipAddress && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--sf-text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                                    <Globe size={12} /> {log.ipAddress}
                                </span>
                            )}
                        </div>
                        {log.details && (
                            <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--sf-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {JSON.stringify(log.details)}
                            </div>
                        )}
                    </div>
                ))}
                {logs.length === 0 && (
                    <div className="empty-state">
                        <ClipboardList size={48} />
                        <h4>No audit logs yet</h4>
                        <p>System activity will appear here</p>
                    </div>
                )}
            </div>

            {total > 50 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                    <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
                    <span style={{ padding: '6px 14px', color: 'var(--sf-text-secondary)', fontSize: '0.85rem' }}>Page {page}</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPage(page + 1)}>Next</button>
                </div>
            )}
        </div>
    );
}
