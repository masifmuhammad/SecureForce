// ============================================================
// Shifts Page — Roster scheduling with create modal
// ============================================================
import React, { useState, useEffect } from 'react';
import { shiftsApi, usersApi, locationsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Shift, User, Location } from '../types';
import { Plus, X, Calendar } from 'lucide-react';

export default function Shifts() {
    const { isManager } = useAuth();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allLocations, setAllLocations] = useState<Location[]>([]);
    const [formData, setFormData] = useState({ userId: '', locationId: '', startTime: '', endTime: '', notes: '' });

    useEffect(() => { loadShifts(); }, [page]);

    const loadShifts = async () => {
        try {
            const { data } = await shiftsApi.getAll(page, 20);
            setShifts(data.items);
            setTotal(data.total);
        } catch (err) { console.error(err); }
    };

    const openCreateModal = async () => {
        try {
            const [usersRes, locsRes] = await Promise.all([usersApi.getAll(1, 100), locationsApi.getAll(1, 100)]);
            setAllUsers(usersRes.data.items);
            setAllLocations(locsRes.data.items);
            setShowModal(true);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Strip empty userId so backend treats it as open shift
            const payload: any = { ...formData };
            if (!payload.userId) delete payload.userId;
            await shiftsApi.create(payload);
            setShowModal(false);
            setFormData({ userId: '', locationId: '', startTime: '', endTime: '', notes: '' });
            loadShifts();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to create shift');
        }
    };

    const handleCancel = async (id: string) => {
        if (confirm('Cancel this shift?')) {
            await shiftsApi.cancel(id);
            loadShifts();
        }
    };

    const formatDateTime = (iso: string) =>
        new Date(iso).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const statusBadge = (status: string) => {
        const map: Record<string, string> = { scheduled: 'info', in_progress: 'success', completed: 'primary', cancelled: 'danger', no_show: 'warning' };
        return <span className={`badge badge-${map[status] || 'info'}`}>{status.replace('_', ' ')}</span>;
    };

    return (
        <div>
            <div className="page-header">
                <h2>Shifts</h2>
                <p>Schedule and manage security shifts</p>
            </div>

            {isManager && (
                <div style={{ marginBottom: 20 }}>
                    <button className="btn btn-primary" onClick={openCreateModal} id="btn-create-shift">
                        <Plus size={16} /> Create Shift
                    </button>
                </div>
            )}

            <div className="data-table-container desktop-only">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Assigned To</th>
                            <th>Location</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Status</th>
                            {isManager && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {shifts.map((shift) => (
                            <tr key={shift.id}>
                                <td style={{ fontWeight: 600 }}>
                                    {shift.user
                                        ? `${shift.user.firstName} ${shift.user.lastName}`
                                        : <span className="badge badge-warning">Open Shift</span>
                                    }
                                </td>
                                <td>{shift.location?.name || '—'}</td>
                                <td>{formatDateTime(shift.startTime)}</td>
                                <td>{formatDateTime(shift.endTime)}</td>
                                <td>{statusBadge(shift.status)}</td>
                                {isManager && (
                                    <td>
                                        {shift.status === 'scheduled' && (
                                            <button className="btn btn-danger btn-sm" onClick={() => handleCancel(shift.id)}>Cancel</button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile List View */}
            <div className="mobile-only mobile-shifts-list">
                {shifts.map((shift) => (
                    <div className="card shift-card" key={shift.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>
                                    {shift.location?.name || 'Unknown Location'}
                                </h4>
                                <div style={{ fontSize: '0.85rem', color: 'var(--sf-text-secondary)' }}>
                                    {shift.user ? `${shift.user.firstName} ${shift.user.lastName}` : <span className="badge badge-warning">Open Shift</span>}
                                </div>
                            </div>
                            {statusBadge(shift.status)}
                        </div>

                        <div className="shift-time-block" style={{ background: 'var(--sf-bg-glass-light)', padding: '10px 12px', borderRadius: 'var(--sf-radius-sm)', marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                <span style={{ color: 'var(--sf-text-muted)' }}>Start</span>
                                <span>{formatDateTime(shift.startTime)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                <span style={{ color: 'var(--sf-text-muted)' }}>End</span>
                                <span>{formatDateTime(shift.endTime)}</span>
                            </div>
                        </div>

                        {isManager && shift.status === 'scheduled' && (
                            <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => handleCancel(shift.id)}>
                                Cancel Shift
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {shifts.length === 0 && (
                <div className="empty-state">
                    <Calendar size={48} />
                    <h4>No shifts found</h4>
                    <p>Create a shift to get started</p>
                </div>
            )}

            {total > 20 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                    <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
                    <span style={{ padding: '6px 14px', color: 'var(--sf-text-secondary)', fontSize: '0.85rem' }}>Page {page}</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPage(page + 1)}>Next</button>
                </div>
            )}

            {/* Create Shift Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal animate-in" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Shift</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    Assign To
                                    <span style={{ fontSize: '0.75rem', color: 'var(--sf-text-muted)', fontWeight: 400 }}>Optional</span>
                                </label>
                                <select className="form-input" value={formData.userId}
                                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}>
                                    <option value="">Open shift (anyone can accept)</option>
                                    {allUsers.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <select className="form-input" required value={formData.locationId}
                                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}>
                                    <option value="">Select location...</option>
                                    {allLocations.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.address}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                                    <label className="form-label">Start Time</label>
                                    <input className="form-input" type="datetime-local" required value={formData.startTime}
                                        style={{ fontSize: '0.9rem', width: '100%' }}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                                    <label className="form-label">End Time</label>
                                    <input className="form-input" type="datetime-local" required value={formData.endTime}
                                        style={{ fontSize: '0.9rem', width: '100%' }}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <input className="form-input" value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes..." />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" id="btn-submit-shift">Create Shift</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
