// ============================================================
// Compliance Page — License management + violation tracking
// ============================================================
import React, { useState, useEffect } from 'react';
import { complianceApi } from '../api/client';
import { ShieldCheck, AlertTriangle, FileCheck, CheckCircle, XCircle, Clock } from 'lucide-react';

interface License {
    id: string; userId: string; licenseNumber: string; licenseClass: string;
    issuingState: string; expiryDate: string; verificationStatus: string;
    user?: { firstName: string; lastName: string };
}

interface Violation {
    id: string; userId: string; type: string; severity: string;
    description: string; isResolved: boolean; createdAt: string;
    resolvedAt?: string; resolvedBy?: string; resolutionNotes?: string;
    user?: { firstName: string; lastName: string };
}

interface Stats { activeViolations: number; criticalViolations: number; licensesExpiringSoon: number; }

export default function Compliance() {
    const [tab, setTab] = useState<'licenses' | 'violations'>('licenses');
    const [licenses, setLicenses] = useState<License[]>([]);
    const [violations, setViolations] = useState<Violation[]>([]);
    const [stats, setStats] = useState<Stats>({ activeViolations: 0, criticalViolations: 0, licensesExpiringSoon: 0 });
    const [resolving, setResolving] = useState<string | null>(null);
    const [showResolved, setShowResolved] = useState(false);

    useEffect(() => { loadData(); }, [tab, showResolved]);

    const loadData = async () => {
        try {
            const { data: statsData } = await complianceApi.getStats();
            setStats(statsData);
            if (tab === 'licenses') {
                const { data } = await complianceApi.getLicenses();
                setLicenses(data);
            } else {
                const { data } = await complianceApi.getViolations(showResolved ? undefined : false);
                setViolations(data);
            }
        } catch (err) { console.error(err); }
    };

    const resolveViolation = async (id: string) => {
        const notes = prompt('Resolution notes (optional):');
        setResolving(id);
        try {
            await complianceApi.resolveViolation(id, notes || undefined);
            loadData();
        } catch (err) { console.error(err); }
        setResolving(null);
    };

    const severityBadge = (severity: string) => {
        const map: Record<string, string> = { critical: 'danger', violation: 'warning', warning: 'info', info: 'primary' };
        return <span className={`badge badge-${map[severity] || 'info'}`}>{severity}</span>;
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = { verified: 'success', pending: 'warning', expired: 'danger', rejected: 'danger' };
        return <span className={`badge badge-${map[status] || 'info'}`}>{status}</span>;
    };

    const daysUntilExpiry = (date: string) => {
        const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days < 0) return <span style={{ color: 'var(--sf-danger)' }}>Expired {Math.abs(days)}d ago</span>;
        if (days <= 30) return <span style={{ color: 'var(--sf-warning)' }}>{days} days</span>;
        return <span style={{ color: 'var(--sf-success)' }}>{days} days</span>;
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Compliance & Licensing</h2>
                    <p>Australian Fair Work compliance monitoring</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: stats.activeViolations > 0 ? 'var(--sf-warning)' : 'var(--sf-success)' }}>
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.activeViolations}</div>
                        <div className="stat-label">Active Violations</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: stats.criticalViolations > 0 ? 'var(--sf-danger)' : 'var(--sf-success)' }}>
                        <XCircle size={20} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.criticalViolations}</div>
                        <div className="stat-label">Critical Violations</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: stats.licensesExpiringSoon > 0 ? 'var(--sf-warning)' : 'var(--sf-primary)' }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.licensesExpiringSoon}</div>
                        <div className="stat-label">Licenses Expiring (30d)</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <button
                    className={`btn ${tab === 'licenses' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => setTab('licenses')} id="tab-licenses"
                >
                    <FileCheck size={14} /> Licenses
                </button>
                <button
                    className={`btn ${tab === 'violations' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => setTab('violations')} id="tab-violations"
                >
                    <AlertTriangle size={14} /> Violations
                </button>
                {tab === 'violations' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--sf-text-secondary)' }}>
                        <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
                        Show resolved
                    </label>
                )}
            </div>

            {/* Licenses Table — Desktop */}
            {tab === 'licenses' && (
                <>
                    <div className="data-table-container desktop-only">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Guard</th>
                                    <th>License #</th>
                                    <th>Class</th>
                                    <th>State</th>
                                    <th>Expires</th>
                                    <th>Time Left</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {licenses.map((l) => (
                                    <tr key={l.id}>
                                        <td>{l.user ? `${l.user.firstName} ${l.user.lastName}` : l.userId.slice(0, 8)}</td>
                                        <td style={{ fontFamily: 'monospace' }}>{l.licenseNumber}</td>
                                        <td><span className="badge badge-primary">{l.licenseClass}</span></td>
                                        <td>{l.issuingState}</td>
                                        <td>{new Date(l.expiryDate).toLocaleDateString('en-AU')}</td>
                                        <td>{daysUntilExpiry(l.expiryDate)}</td>
                                        <td>{statusBadge(l.verificationStatus)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {licenses.length === 0 && (
                            <div className="empty-state">
                                <ShieldCheck size={48} />
                                <h4>No licenses recorded</h4>
                                <p>Guard security licenses will appear here</p>
                            </div>
                        )}
                    </div>

                    {/* Licenses — Mobile Cards */}
                    <div className="mobile-only">
                        {licenses.map((l) => (
                            <div className="card" key={l.id} style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                    <div>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>
                                            {l.user ? `${l.user.firstName} ${l.user.lastName}` : l.userId.slice(0, 8)}
                                        </h4>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--sf-text-muted)', fontFamily: 'monospace' }}>
                                            {l.licenseNumber}
                                        </div>
                                    </div>
                                    {statusBadge(l.verificationStatus)}
                                </div>
                                <div style={{ background: 'var(--sf-bg-glass-light)', padding: '10px 12px', borderRadius: 'var(--sf-radius-sm)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                        <span style={{ color: 'var(--sf-text-muted)' }}>Class</span>
                                        <span className="badge badge-primary">{l.licenseClass}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                        <span style={{ color: 'var(--sf-text-muted)' }}>State</span>
                                        <span>{l.issuingState}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                        <span style={{ color: 'var(--sf-text-muted)' }}>Expires</span>
                                        <span>{new Date(l.expiryDate).toLocaleDateString('en-AU')}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                        <span style={{ color: 'var(--sf-text-muted)' }}>Time Left</span>
                                        <span>{daysUntilExpiry(l.expiryDate)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {licenses.length === 0 && (
                            <div className="empty-state">
                                <ShieldCheck size={48} />
                                <h4>No licenses recorded</h4>
                                <p>Guard security licenses will appear here</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Violations Table — Desktop */}
            {tab === 'violations' && (
                <>
                    <div className="data-table-container desktop-only">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Guard</th>
                                    <th>Type</th>
                                    <th>Severity</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {violations.map((v) => (
                                    <tr key={v.id}>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                                            {new Date(v.createdAt).toLocaleDateString('en-AU')}
                                        </td>
                                        <td>{v.user ? `${v.user.firstName} ${v.user.lastName}` : v.userId.slice(0, 8)}</td>
                                        <td><span className="badge badge-info">{v.type.replace(/_/g, ' ')}</span></td>
                                        <td>{severityBadge(v.severity)}</td>
                                        <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{v.description}</td>
                                        <td>
                                            {v.isResolved
                                                ? <span className="badge badge-success">Resolved</span>
                                                : <span className="badge badge-warning">Open</span>
                                            }
                                        </td>
                                        <td>
                                            {!v.isResolved && (
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => resolveViolation(v.id)}
                                                    disabled={resolving === v.id}
                                                    id={`resolve-${v.id}`}
                                                >
                                                    <CheckCircle size={14} /> Resolve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {violations.length === 0 && (
                            <div className="empty-state">
                                <CheckCircle size={48} />
                                <h4>{showResolved ? 'No violations found' : 'No active violations'}</h4>
                                <p>Compliance violations will appear here when detected</p>
                            </div>
                        )}
                    </div>

                    {/* Violations — Mobile Cards */}
                    <div className="mobile-only">
                        {violations.map((v) => (
                            <div className="card" key={v.id} style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>
                                            {v.user ? `${v.user.firstName} ${v.user.lastName}` : v.userId.slice(0, 8)}
                                        </h4>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--sf-text-muted)' }}>
                                            {new Date(v.createdAt).toLocaleDateString('en-AU')}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                                        {severityBadge(v.severity)}
                                        {v.isResolved
                                            ? <span className="badge badge-success">Resolved</span>
                                            : <span className="badge badge-warning">Open</span>
                                        }
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                                    <span className="badge badge-info">{v.type.replace(/_/g, ' ')}</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--sf-text-secondary)', marginBottom: 10, lineHeight: 1.4 }}>{v.description}</p>
                                {!v.isResolved && (
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => resolveViolation(v.id)}
                                        disabled={resolving === v.id}
                                        style={{ width: '100%' }}
                                    >
                                        <CheckCircle size={14} /> Resolve
                                    </button>
                                )}
                            </div>
                        ))}
                        {violations.length === 0 && (
                            <div className="empty-state">
                                <CheckCircle size={48} />
                                <h4>{showResolved ? 'No violations found' : 'No active violations'}</h4>
                                <p>Compliance violations will appear here when detected</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
