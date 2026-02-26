// ============================================================
// Reports Page — View and submit incident reports
// ============================================================
import React, { useState, useEffect } from 'react';
import { reportsApi } from '../api/client';
import type { Report } from '../types';
import { FileText, Plus, X } from 'lucide-react';

export default function Reports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', type: 'daily', priority: 'medium' });

    useEffect(() => { loadReports(); }, [page]);

    const loadReports = async () => {
        try {
            const { data } = await reportsApi.getAll(page, 20);
            setReports(data.items);
            setTotal(data.total);
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await reportsApi.create(formData);
            setShowModal(false);
            setFormData({ title: '', description: '', type: 'daily', priority: 'medium' });
            loadReports();
        } catch (err) { console.error(err); }
    };

    const priorityBadge = (p: string) => {
        const map: Record<string, string> = { low: 'info', medium: 'primary', high: 'warning', critical: 'danger' };
        return <span className={`badge badge-${map[p] || 'info'}`}>{p}</span>;
    };

    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Reports</h2>
                    <p>Incident reports and daily logs</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-new-report">
                    <Plus size={16} /> New Report
                </button>
            </div>

            {/* Desktop Table */}
            <div className="data-table-container desktop-only">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Priority</th>
                            <th>Submitted By</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((report) => (
                            <tr key={report.id} onClick={() => setSelectedReport(report)} style={{ cursor: 'pointer' }}>
                                <td style={{ fontWeight: 600 }}>{report.title}</td>
                                <td><span className="badge badge-primary">{report.type}</span></td>
                                <td>{priorityBadge(report.priority)}</td>
                                <td>{report.user?.firstName} {report.user?.lastName}</td>
                                <td>{new Date(report.createdAt).toLocaleDateString('en-AU')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {reports.length === 0 && (
                    <div className="empty-state">
                        <FileText size={48} />
                        <h4>No reports yet</h4>
                        <p>Submit a report to get started</p>
                    </div>
                )}
            </div>

            {/* Mobile Cards */}
            <div className="mobile-only">
                {reports.map((report) => (
                    <div className="card" key={report.id} style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => setSelectedReport(report)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, flex: 1, marginRight: 8 }}>{report.title}</h4>
                            {priorityBadge(report.priority)}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span className="badge badge-primary">{report.type}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--sf-text-muted)' }}>
                            <span>{report.user?.firstName} {report.user?.lastName}</span>
                            <span>{new Date(report.createdAt).toLocaleDateString('en-AU')}</span>
                        </div>
                    </div>
                ))}
                {reports.length === 0 && (
                    <div className="empty-state">
                        <FileText size={48} />
                        <h4>No reports yet</h4>
                        <p>Submit a report to get started</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {total > 20 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                    <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
                    <span style={{ padding: '6px 14px', color: 'var(--sf-text-secondary)', fontSize: '0.85rem' }}>Page {page}</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPage(page + 1)}>Next</button>
                </div>
            )}

            {/* View Report Details Modal */}
            {selectedReport && (
                <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
                    <div className="modal animate-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h3>Report Details</h3>
                            <button className="modal-close" onClick={() => setSelectedReport(null)}><X size={16} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <h4 style={{ fontSize: '1.1rem', marginBottom: 8 }}>{selectedReport.title}</h4>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                    <span className="badge badge-primary">{selectedReport.type}</span>
                                    {priorityBadge(selectedReport.priority)}
                                </div>
                            </div>

                            <div style={{ background: 'var(--sf-bg-glass-light)', padding: 16, borderRadius: 'var(--sf-radius)', border: '1px solid var(--sf-border)' }}>
                                <h5 style={{ fontSize: '0.85rem', color: 'var(--sf-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Description</h5>
                                <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedReport.description}</p>
                            </div>

                            <div className="modal-form-grid">
                                <div>
                                    <h5 style={{ fontSize: '0.8rem', color: 'var(--sf-text-muted)', marginBottom: 4 }}>Submitted By</h5>
                                    <div>{selectedReport.user?.firstName} {selectedReport.user?.lastName}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--sf-text-secondary)' }}>{selectedReport.user?.email}</div>
                                </div>
                                <div>
                                    <h5 style={{ fontSize: '0.8rem', color: 'var(--sf-text-muted)', marginBottom: 4 }}>Date Submitted</h5>
                                    <div>{new Date(selectedReport.createdAt).toLocaleString('en-AU')}</div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setSelectedReport(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Report Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal animate-in" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Submit Report</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input className="form-input" required value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Brief description..." />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" required value={formData.description} rows={4}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detailed incident description..." style={{ minHeight: 100, resize: 'vertical' }} />
                            </div>
                            <div className="modal-form-grid">
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select className="form-input" value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="daily">Daily</option>
                                        <option value="incident">Incident</option>
                                        <option value="observation">Observation</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <select className="form-input" value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" id="btn-submit-report">Submit Report</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
