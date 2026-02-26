// ============================================================
// Shift Assignments Page — Admin/Manager tracking view
// Shows assigned shifts + ability to assign open shifts
// ============================================================
import React, { useState, useEffect } from 'react';
import { shiftsApi, usersApi } from '../api/client';
import type { Shift, User } from '../types';
import {
    Calendar, Clock, MapPin, User as UserIcon, Search, Filter,
    CheckCircle, XCircle, AlertCircle, Edit2, X, UserCheck, UserX
} from 'lucide-react';

type Tab = 'assigned' | 'unassigned';

export default function ShiftAssignments() {
    const [tab, setTab] = useState<Tab>('assigned');
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<Record<string, string>>({});
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        loadShifts();
    }, [tab, page]);

    useEffect(() => {
        // Load users list for assigning
        usersApi.getAll(1, 100).then(res => setAllUsers(res.data.items)).catch(console.error);
    }, []);

    const loadShifts = async () => {
        try {
            const { data } = await shiftsApi.getAssignments(page, 20, {
                showOpen: tab === 'unassigned',
            });
            setShifts(data.items);
            setTotal(data.total);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAssign = async (shiftId: string) => {
        const userId = selectedUserId[shiftId];
        if (!userId) return;

        setAssigningId(shiftId);
        try {
            if (tab === 'assigned') {
                // Reassigning an already-assigned shift — use update to change userId
                await shiftsApi.update(shiftId, { userId });
            } else {
                // Assigning an open/unassigned shift — use assign endpoint
                await shiftsApi.assign(shiftId, userId);
            }
            loadShifts();
            setEditingId(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to assign shift');
        } finally {
            setAssigningId(null);
        }
    };

    const formatDateTime = (iso: string) =>
        new Date(iso).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            scheduled: 'info', in_progress: 'success', completed: 'primary',
            cancelled: 'danger', no_show: 'warning'
        };
        return <span className={`badge badge-${map[status] || 'info'}`}>{status.replace('_', ' ')}</span>;
    };

    const startEditing = (shift: Shift) => {
        setEditingId(shift.id);
        // Pre-fill with current assignee if exists
        if (shift.userId) {
            setSelectedUserId({ ...selectedUserId, [shift.id]: shift.userId });
        }
    };

    const cancelEditing = () => {
        setEditingId(null);
    };

    return (
        <div>
            {/* ... existing header and tabs ... */}
            <div className="page-header">
                <h2>Shift Assignments</h2>
                <p>Track who is assigned to each shift and assign open shifts to guards</p>
            </div>

            {/* Tabs */}
            <div className="assignments-tabs" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <button
                    className={`btn ${tab === 'assigned' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setTab('assigned'); setPage(1); setEditingId(null); }}
                    id="tab-assigned"
                >
                    <UserCheck size={16} />
                    Assigned Shifts
                </button>
                <button
                    className={`btn ${tab === 'unassigned' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setTab('unassigned'); setPage(1); setEditingId(null); }}
                    id="tab-unassigned"
                >
                    <UserX size={16} />
                    Open / Unassigned
                </button>
            </div>

            {/* Desktop Table */}
            <div className="data-table-container desktop-only">
                <table className="data-table">
                    <thead>
                        <tr>
                            {tab === 'assigned' && <th>Assigned To</th>}
                            <th>Location</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Status</th>
                            {tab === 'unassigned' && <th>Assign To</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {shifts.map((shift) => (
                            <tr key={shift.id}>
                                {tab === 'assigned' && (
                                    <td style={{ fontWeight: 600 }}>
                                        <div className="group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 8 }}>
                                            <span>{shift.user ? `${shift.user.firstName} ${shift.user.lastName}` : '—'}</span>
                                            <button className="btn-icon-sm"
                                                title="Reassign shift"
                                                onClick={(e) => { e.stopPropagation(); startEditing(shift); }}
                                                style={{ opacity: 0.5, cursor: 'pointer' }}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <MapPin size={14} style={{ color: 'var(--sf-text-muted)', flexShrink: 0 }} />
                                        {shift.location?.name || '—'}
                                    </div>
                                </td>
                                <td>{formatDateTime(shift.startTime)}</td>
                                <td>{formatDateTime(shift.endTime)}</td>
                                <td>{statusBadge(shift.status)}</td>
                                {tab === 'unassigned' && (
                                    <td>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <select
                                                className="form-input"
                                                style={{ maxWidth: 200, padding: '6px 10px', fontSize: '0.82rem' }}
                                                value={selectedUserId[shift.id] || ''}
                                                onChange={(e) => setSelectedUserId({ ...selectedUserId, [shift.id]: e.target.value })}
                                            >
                                                <option value="">Select guard...</option>
                                                {allUsers.filter(u => u.isActive).map((u) => (
                                                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                                ))}
                                            </select>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                disabled={!selectedUserId[shift.id] || assigningId === shift.id}
                                                onClick={() => handleAssign(shift.id)}
                                            >
                                                {assigningId === shift.id ? '...' : 'Assign'}
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile List */}
            <div className="mobile-only">
                {shifts.map((shift) => (
                    <div className="card" key={shift.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>
                                    {shift.location?.name || 'Unknown Location'}
                                </h4>
                                {tab === 'assigned' && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--sf-text-secondary)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                        <span>{shift.user ? `${shift.user.firstName} ${shift.user.lastName}` : '—'}</span>
                                        <button className="btn-icon-sm" onClick={() => startEditing(shift)}>
                                            <Edit2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginLeft: 8 }}>{statusBadge(shift.status)}</div>
                        </div>
                        {/* ... existing times display ... */}
                        <div style={{ background: 'var(--sf-bg-glass-light)', padding: '10px 12px', borderRadius: 'var(--sf-radius-sm)', marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                <span style={{ color: 'var(--sf-text-muted)' }}>Start</span>
                                <span>{formatDateTime(shift.startTime)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                <span style={{ color: 'var(--sf-text-muted)' }}>End</span>
                                <span>{formatDateTime(shift.endTime)}</span>
                            </div>
                        </div>

                        {tab === 'unassigned' && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <select
                                    className="form-input"
                                    style={{ flex: 1, padding: '8px 10px', fontSize: '0.82rem' }}
                                    value={selectedUserId[shift.id] || ''}
                                    onChange={(e) => setSelectedUserId({ ...selectedUserId, [shift.id]: e.target.value })}
                                >
                                    <option value="">Select guard...</option>
                                    {allUsers.filter(u => u.isActive).map((u) => (
                                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                    ))}
                                </select>
                                <button
                                    className="btn btn-primary btn-sm"
                                    disabled={!selectedUserId[shift.id] || assigningId === shift.id}
                                    onClick={() => handleAssign(shift.id)}
                                >
                                    Assign
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {shifts.length === 0 && (
                <div className="empty-state">
                    <Calendar size={48} />
                    <h4>{tab === 'assigned' ? 'No assigned shifts' : 'No open shifts'}</h4>
                    <p>{tab === 'assigned' ? 'All shifts are either open or completed' : 'All shifts have been assigned'}</p>
                </div>
            )}

            {total > 20 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                    <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
                    <span style={{ padding: '6px 14px', color: 'var(--sf-text-secondary)', fontSize: '0.85rem' }}>Page {page}</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPage(page + 1)}>Next</button>
                </div>
            )}

            {/* Reassignment Modal */}
            {editingId && (
                <div className="modal-overlay" onClick={cancelEditing}>
                    <div className="reassign-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Reassign Shift</h3>
                            <button className="modal-close" onClick={cancelEditing}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            {(() => {
                                const shift = shifts.find(s => s.id === editingId);
                                if (!shift) return null;
                                return (
                                    <>
                                        <div className="reassign-shift-detail">
                                            <div className="detail-row">
                                                <span className="label">Location</span>
                                                <span className="value">{shift.location?.name}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="label">Time</span>
                                                <span className="value">{formatDateTime(shift.startTime)}</span>
                                            </div>
                                            <div className="detail-row" style={{ marginTop: 8 }}>
                                                <span className="label">Currently Assigned</span>
                                                <span className="value">
                                                    {shift.user ? (
                                                        <span className="reassign-current-badge" style={{ background: 'rgba(48, 209, 88, 0.15)', color: '#30d158' }}>
                                                            <UserCheck size={12} /> {shift.user.firstName} {shift.user.lastName}
                                                        </span>
                                                    ) : <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><UserIcon size={12} /> Unassigned</span>}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Reassign To</label>
                                            <select
                                                className="form-input"
                                                value={selectedUserId[shift.id] || ''}
                                                onChange={(e) => setSelectedUserId({ ...selectedUserId, [shift.id]: e.target.value })}
                                            >
                                                <option value="">Select new guard...</option>
                                                {allUsers.filter(u => u.isActive && u.id !== shift.userId).map((u) => (
                                                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={cancelEditing}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                disabled={!selectedUserId[editingId] || assigningId === editingId}
                                onClick={() => handleAssign(editingId)}
                            >
                                {assigningId === editingId ? 'Saving...' : 'Confirm Reassignment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
