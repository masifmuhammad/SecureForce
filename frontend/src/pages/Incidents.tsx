// ============================================================
// Incidents Page — Incident management with SLA tracking
// ============================================================
import React, { useState, useEffect } from 'react';
import { incidentsApi, locationsApi } from '../api/client';
import { AlertCircle, Clock, ArrowUpCircle, CheckCircle, Plus, ChevronDown, Shield, MessageSquare } from 'lucide-react';

interface Incident {
    id: string; title: string; description: string;
    severity: string; status: string; slaBreached: boolean;
    slaDeadline: string; escalationLevel: number;
    reportedById: string; assignedToId?: string;
    locationId: string; createdAt: string;
    acknowledgedAt?: string; resolvedAt?: string;
    reportedBy?: { firstName: string; lastName: string };
    location?: { name: string };
    assignedTo?: { firstName: string; lastName: string };
    timeline?: any[];
}

interface Stats { open: number; investigating: number; escalated: number; slaBreached: number; total: number; }

export default function Incidents() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [stats, setStats] = useState<Stats>({ open: 0, investigating: 0, escalated: 0, slaBreached: 0, total: 0 });
    const [statusFilter, setStatusFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [locations, setLocations] = useState<any[]>([]);
    const [form, setForm] = useState({ title: '', description: '', severity: 'medium', locationId: '' });

    useEffect(() => { loadData(); loadLocations(); }, [statusFilter, severityFilter]);

    const loadData = async () => {
        try {
            const [incRes, statsRes] = await Promise.all([
                incidentsApi.getAll({ status: statusFilter || undefined, severity: severityFilter || undefined }),
                incidentsApi.getStats(),
            ]);
            setIncidents(incRes.data);
            setStats(statsRes.data);
        } catch (err) { console.error(err); }
    };

    const loadLocations = async () => {
        try {
            const { data } = await locationsApi.getAll(1, 100);
            setLocations(data.items || data || []);
        } catch { }
    };

    const openDetail = async (id: string) => {
        try {
            const { data } = await incidentsApi.getOne(id);
            setSelectedIncident(data);
        } catch (err) { console.error(err); }
    };

    const createIncident = async () => {
        try {
            await incidentsApi.create(form);
            setShowCreate(false);
            setForm({ title: '', description: '', severity: 'medium', locationId: '' });
            loadData();
        } catch (err) { console.error(err); }
    };

    const acknowledge = async (id: string) => {
        try { await incidentsApi.acknowledge(id); loadData(); if (selectedIncident) openDetail(id); } catch (err) { console.error(err); }
    };

    const escalate = async (id: string) => {
        try { await incidentsApi.escalate(id); loadData(); if (selectedIncident) openDetail(id); } catch (err) { console.error(err); }
    };

    const updateStatus = async (id: string, status: string) => {
        const comment = prompt('Comment (optional):');
        try { await incidentsApi.updateStatus(id, status, comment || undefined); loadData(); if (selectedIncident) openDetail(id); } catch (err) { console.error(err); }
    };

    const addNote = async (id: string) => {
        if (!newNote.trim()) return;
        try { await incidentsApi.addNote(id, newNote); setNewNote(''); openDetail(id); } catch (err) { console.error(err); }
    };

    const severityBadge = (severity: string) => {
        const map: Record<string, string> = { critical: 'danger', high: 'warning', medium: 'info', low: 'primary' };
        return <span className={`badge badge-${map[severity] || 'info'}`}>{severity.toUpperCase()}</span>;
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = { open: 'danger', investigating: 'warning', escalated: 'danger', resolved: 'success', closed: 'primary' };
        return <span className={`badge badge-${map[status] || 'info'}`}>{status}</span>;
    };

    const slaStatus = (incident: Incident) => {
        if (incident.slaBreached) return <span className="badge badge-danger">SLA BREACHED</span>;
        const remaining = new Date(incident.slaDeadline).getTime() - Date.now();
        if (remaining < 0) return <span className="badge badge-danger">OVERDUE</span>;
        const mins = Math.floor(remaining / 60000);
        if (mins < 30) return <span className="badge badge-warning">{mins}m left</span>;
        return <span className="badge badge-success">{Math.floor(mins / 60)}h {mins % 60}m left</span>;
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Incident Management</h2>
                    <p>Track, manage, and resolve security incidents</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)} id="btn-new-incident">
                    <Plus size={16} /> Report Incident
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--sf-danger)' }}><AlertCircle size={20} /></div>
                    <div><div className="stat-value">{stats.open}</div><div className="stat-label">Open</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--sf-warning)' }}><Clock size={20} /></div>
                    <div><div className="stat-value">{stats.investigating}</div><div className="stat-label">Investigating</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--sf-danger)' }}><ArrowUpCircle size={20} /></div>
                    <div><div className="stat-value">{stats.escalated}</div><div className="stat-label">Escalated</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: stats.slaBreached > 0 ? 'var(--sf-danger)' : 'var(--sf-success)' }}><Shield size={20} /></div>
                    <div><div className="stat-value">{stats.slaBreached}</div><div className="stat-label">SLA Breached</div></div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <select className="form-input" style={{ width: 160, minWidth: 140, flex: '0 1 auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} id="filter-status">
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
                <select className="form-input" style={{ width: 160, minWidth: 140, flex: '0 1 auto' }} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} id="filter-severity">
                    <option value="">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>

            {/* Incidents Table — Desktop */}
            <div className="data-table-container desktop-only">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Severity</th>
                            <th>Status</th>
                            <th>Location</th>
                            <th>SLA</th>
                            <th>Escalation</th>
                            <th>Reported</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incidents.map((inc) => (
                            <tr key={inc.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(inc.id)}>
                                <td style={{ fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</td>
                                <td>{severityBadge(inc.severity)}</td>
                                <td>{statusBadge(inc.status)}</td>
                                <td>{inc.location?.name || '—'}</td>
                                <td>{slaStatus(inc)}</td>
                                <td>
                                    {inc.escalationLevel > 0
                                        ? <span className="badge badge-danger">Level {inc.escalationLevel}</span>
                                        : <span style={{ color: 'var(--sf-text-muted)' }}>—</span>}
                                </td>
                                <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                                    {new Date(inc.createdAt).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                                        {inc.status === 'open' && (
                                            <button className="btn btn-success btn-sm" onClick={() => acknowledge(inc.id)} title="Acknowledge">
                                                <CheckCircle size={14} />
                                            </button>
                                        )}
                                        {!['resolved', 'closed'].includes(inc.status) && (
                                            <button className="btn btn-warning btn-sm" onClick={() => escalate(inc.id)} title="Escalate">
                                                <ArrowUpCircle size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {incidents.length === 0 && (
                    <div className="empty-state">
                        <Shield size={48} />
                        <h4>No incidents found</h4>
                        <p>Report a new incident to get started</p>
                    </div>
                )}
            </div>

            {/* Incidents — Mobile Cards */}
            <div className="mobile-only">
                {incidents.map((inc) => (
                    <div className="card" key={inc.id} style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => openDetail(inc.id)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, flex: 1, marginRight: 8 }}>{inc.title}</h4>
                            {severityBadge(inc.severity)}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                            {statusBadge(inc.status)}
                            {slaStatus(inc)}
                            {inc.escalationLevel > 0 && <span className="badge badge-danger">Level {inc.escalationLevel}</span>}
                        </div>
                        <div style={{ background: 'var(--sf-bg-glass-light)', padding: '10px 12px', borderRadius: 'var(--sf-radius-sm)', marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                <span style={{ color: 'var(--sf-text-muted)' }}>Location</span>
                                <span>{inc.location?.name || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                <span style={{ color: 'var(--sf-text-muted)' }}>Reported</span>
                                <span>{new Date(inc.createdAt).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                            {inc.status === 'open' && (
                                <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => acknowledge(inc.id)}>
                                    <CheckCircle size={14} /> Acknowledge
                                </button>
                            )}
                            {!['resolved', 'closed'].includes(inc.status) && (
                                <button className="btn btn-warning btn-sm" style={{ flex: 1 }} onClick={() => escalate(inc.id)}>
                                    <ArrowUpCircle size={14} /> Escalate
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {incidents.length === 0 && (
                    <div className="empty-state">
                        <Shield size={48} />
                        <h4>No incidents found</h4>
                        <p>Report a new incident to get started</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h3>Report Incident</h3>
                            <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief incident title" id="input-title" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description" id="input-description" />
                            </div>
                            <div className="modal-form-grid">
                                <div className="form-group">
                                    <label className="form-label">Severity</label>
                                    <select className="form-input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} id="input-severity">
                                        <option value="critical">Critical</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <select className="form-input" value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })} id="input-location">
                                        <option value="">Select…</option>
                                        {locations.map((loc: any) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={createIncident} disabled={!form.title || !form.locationId} id="btn-submit-incident">
                                Report Incident
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedIncident && (
                <div className="modal-overlay" onClick={() => setSelectedIncident(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
                        <div className="modal-header">
                            <h3>{selectedIncident.title}</h3>
                            <button className="modal-close" onClick={() => setSelectedIncident(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                                {severityBadge(selectedIncident.severity)}
                                {statusBadge(selectedIncident.status)}
                                {slaStatus(selectedIncident)}
                                {selectedIncident.escalationLevel > 0 && <span className="badge badge-danger">Escalation Level {selectedIncident.escalationLevel}</span>}
                            </div>

                            <p style={{ color: 'var(--sf-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>{selectedIncident.description}</p>

                            <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: '0.85rem', color: 'var(--sf-text-muted)', flexWrap: 'wrap' }}>
                                <span>Reported by: <strong>{selectedIncident.reportedBy ? `${selectedIncident.reportedBy.firstName} ${selectedIncident.reportedBy.lastName}` : '—'}</strong></span>
                                <span>Location: <strong>{selectedIncident.location?.name || '—'}</strong></span>
                                {selectedIncident.assignedTo && <span>Assigned: <strong>{selectedIncident.assignedTo.firstName} {selectedIncident.assignedTo.lastName}</strong></span>}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                                {selectedIncident.status === 'open' && (
                                    <button className="btn btn-success btn-sm" onClick={() => acknowledge(selectedIncident.id)}>
                                        <CheckCircle size={14} /> Acknowledge
                                    </button>
                                )}
                                {!['resolved', 'closed'].includes(selectedIncident.status) && (
                                    <>
                                        <button className="btn btn-warning btn-sm" onClick={() => escalate(selectedIncident.id)}>
                                            <ArrowUpCircle size={14} /> Escalate
                                        </button>
                                        <button className="btn btn-success btn-sm" onClick={() => updateStatus(selectedIncident.id, 'resolved')}>Resolve</button>
                                    </>
                                )}
                                {selectedIncident.status === 'resolved' && (
                                    <button className="btn btn-primary btn-sm" onClick={() => updateStatus(selectedIncident.id, 'closed')}>Close</button>
                                )}
                            </div>

                            {/* Timeline */}
                            {selectedIncident.timeline && selectedIncident.timeline.length > 0 && (
                                <div style={{ borderTop: '1px solid var(--sf-border)', paddingTop: 16 }}>
                                    <h4 style={{ marginBottom: 12, fontSize: '0.9rem' }}>Timeline</h4>
                                    {selectedIncident.timeline.map((entry: any) => (
                                        <div key={entry.id} style={{ display: 'flex', gap: 10, marginBottom: 10, paddingLeft: 12, borderLeft: '2px solid var(--sf-border)', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                                                    <span className="badge badge-info" style={{ marginRight: 6 }}>{entry.action.replace(/_/g, ' ')}</span>
                                                    {entry.user && <span style={{ color: 'var(--sf-text-muted)' }}>{entry.user.firstName} {entry.user.lastName}</span>}
                                                </div>
                                                {entry.comment && <div style={{ fontSize: '0.82rem', color: 'var(--sf-text-secondary)', marginTop: 4 }}>{entry.comment}</div>}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--sf-text-muted)', whiteSpace: 'nowrap' }}>
                                                {new Date(entry.timestamp).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Note */}
                            <div style={{ borderTop: '1px solid var(--sf-border)', paddingTop: 12, marginTop: 12 }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input className="form-input" placeholder="Add a note…" value={newNote} onChange={(e) => setNewNote(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addNote(selectedIncident.id)} style={{ flex: 1 }} id="input-note" />
                                    <button className="btn btn-primary btn-sm" onClick={() => addNote(selectedIncident.id)} disabled={!newNote.trim()}>
                                        <MessageSquare size={14} /> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
