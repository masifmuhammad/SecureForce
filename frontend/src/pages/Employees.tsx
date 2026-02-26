// ============================================================
// Employees Page — Staff management with invite, edit, role change
// ============================================================
import React, { useState, useEffect } from 'react';
import { usersApi, authApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';
import { UserPlus, Search, X, Edit, Shield, RefreshCw, Copy, Check } from 'lucide-react';

export default function Employees() {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [search, setSearch] = useState('');
    const [inviteResult, setInviteResult] = useState<{ temporaryPassword: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '', phone: '', role: 'employee', securityLicenseNumber: '',
    });

    const [inviteData, setInviteData] = useState({
        firstName: '', lastName: '', email: '', phone: '', role: 'employee', securityLicenseNumber: '',
    });

    const [editData, setEditData] = useState({
        firstName: '', lastName: '', phone: '', securityLicenseNumber: '',
    });

    useEffect(() => { loadUsers(); }, [page]);

    const loadUsers = async () => {
        try {
            const { data } = await usersApi.getAll(page, 20);
            setUsers(data.items);
            setTotal(data.total);
        } catch (err) { console.error(err); }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authApi.register(formData);
            setShowModal(false);
            setFormData({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'employee', securityLicenseNumber: '' });
            loadUsers();
        } catch (err) { console.error(err); }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await usersApi.invite(inviteData);
            setInviteResult({ temporaryPassword: data.temporaryPassword });
            loadUsers();
        } catch (err) { console.error(err); }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            await usersApi.update(editingUser.id, editData);
            setEditingUser(null);
            loadUsers();
        } catch (err) { console.error(err); }
    };

    const handleDeactivate = async (id: string) => {
        if (confirm('Deactivate this employee?')) {
            await usersApi.deactivate(id);
            loadUsers();
        }
    };

    const handleReactivate = async (id: string) => {
        if (confirm('Reactivate this employee?')) {
            await usersApi.reactivate(id);
            loadUsers();
        }
    };

    const handleRoleChange = async (id: string, role: string) => {
        try {
            await usersApi.updateRole(id, role);
            loadUsers();
        } catch (err) { console.error(err); }
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        setEditData({
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || '',
            securityLicenseNumber: user.securityLicenseNumber || '',
        });
    };

    const closeInviteModal = () => {
        setShowInviteModal(false);
        setInviteResult(null);
        setInviteData({ firstName: '', lastName: '', email: '', phone: '', role: 'employee', securityLicenseNumber: '' });
        setCopied(false);
    };

    const copyPassword = () => {
        if (inviteResult) {
            navigator.clipboard.writeText(inviteResult.temporaryPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const filtered = users.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Employees</h2>
                    <p>Manage security staff and their details</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => setShowInviteModal(true)} id="btn-invite-employee">
                        <UserPlus size={16} /> Invite
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-add-employee">
                        <UserPlus size={16} /> Add Employee
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--sf-text-muted)' }} />
                    <input
                        className="form-input"
                        placeholder="Search employees..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 40 }}
                        id="search-employees"
                    />
                </div>
            </div>

            {/* Desktop Table */}
            <div className="data-table-container desktop-only">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>License</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((user) => (
                            <tr key={user.id}>
                                <td style={{ fontWeight: 600 }}>{user.firstName} {user.lastName}</td>
                                <td>{user.email}</td>
                                <td>{user.phone || '—'}</td>
                                <td>
                                    {isAdmin ? (
                                        <select
                                            className="form-input"
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            style={{ padding: '4px 8px', fontSize: '0.8rem', minWidth: 100 }}
                                            id={`role-${user.id}`}
                                        >
                                            <option value="employee">Employee</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    ) : (
                                        <span className="badge badge-primary">{user.role}</span>
                                    )}
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{user.securityLicenseNumber || '—'}</td>
                                <td>
                                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(user)} title="Edit">
                                        <Edit size={14} />
                                    </button>
                                    {user.isActive ? (
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(user.id)}>
                                            Deactivate
                                        </button>
                                    ) : (
                                        <button className="btn btn-primary btn-sm" onClick={() => handleReactivate(user.id)}>
                                            <RefreshCw size={14} /> Reactivate
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="empty-state"><h4>No employees found</h4></div>
                )}
            </div>

            {/* Mobile Cards */}
            <div className="mobile-only">
                {filtered.map((user) => (
                    <div className="card" key={user.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>{user.firstName} {user.lastName}</h4>
                                <div style={{ fontSize: '0.82rem', color: 'var(--sf-text-muted)' }}>{user.email}</div>
                            </div>
                            <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div style={{ background: 'var(--sf-bg-glass-light)', padding: '10px 12px', borderRadius: 'var(--sf-radius-sm)', marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                <span style={{ color: 'var(--sf-text-muted)' }}>Role</span>
                                {isAdmin ? (
                                    <select
                                        className="form-input"
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        style={{ padding: '2px 6px', fontSize: '0.78rem', width: 'auto', minWidth: 90, height: 'auto' }}
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                ) : (
                                    <span className="badge badge-primary">{user.role}</span>
                                )}
                            </div>
                            {user.phone && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                    <span style={{ color: 'var(--sf-text-muted)' }}>Phone</span>
                                    <span>{user.phone}</span>
                                </div>
                            )}
                            {user.securityLicenseNumber && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                    <span style={{ color: 'var(--sf-text-muted)' }}>License</span>
                                    <span style={{ fontFamily: 'monospace' }}>{user.securityLicenseNumber}</span>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(user)}>
                                <Edit size={14} /> Edit
                            </button>
                            {user.isActive ? (
                                <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleDeactivate(user.id)}>
                                    Deactivate
                                </button>
                            ) : (
                                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleReactivate(user.id)}>
                                    <RefreshCw size={14} /> Reactivate
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="empty-state"><h4>No employees found</h4></div>
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

            {/* Add Employee Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal animate-in" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New Employee</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleAdd}>
                            <div className="modal-form-grid">
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input className="form-input" required value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input className="form-input" required value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" required value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input className="form-input" type="password" required minLength={8} value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div className="modal-form-grid">
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+61..." />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select className="form-input" value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="employee">Employee</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Security License Number</label>
                                <input className="form-input" value={formData.securityLicenseNumber}
                                    onChange={(e) => setFormData({ ...formData, securityLicenseNumber: e.target.value })} placeholder="SEC-12345" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" id="btn-submit-employee">Add Employee</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invite Employee Modal */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={closeInviteModal}>
                    <div className="modal animate-in" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{inviteResult ? 'Employee Invited!' : 'Invite Employee'}</h3>
                            <button className="modal-close" onClick={closeInviteModal}><X size={16} /></button>
                        </div>

                        {inviteResult ? (
                            <div>
                                <div style={{
                                    background: 'var(--sf-bg-tertiary)', borderRadius: 12, padding: 20, marginBottom: 16,
                                    border: '1px solid var(--sf-border)',
                                }}>
                                    <p style={{ marginBottom: 12, color: 'var(--sf-text-secondary)', fontSize: '0.85rem' }}>
                                        Share this temporary password with the employee. They should change it after first login.
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <code style={{
                                            flex: 1, padding: '10px 14px', background: 'var(--sf-bg-primary)',
                                            borderRadius: 8, fontFamily: 'monospace', fontSize: '1.1rem',
                                            letterSpacing: 1, border: '1px solid var(--sf-border)',
                                        }}>
                                            {inviteResult.temporaryPassword}
                                        </code>
                                        <button className="btn btn-secondary btn-sm" onClick={copyPassword} title="Copy">
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn btn-primary" onClick={closeInviteModal}>Done</button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleInvite}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">First Name</label>
                                        <input className="form-input" required value={inviteData.firstName}
                                            onChange={(e) => setInviteData({ ...inviteData, firstName: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Last Name</label>
                                        <input className="form-input" required value={inviteData.lastName}
                                            onChange={(e) => setInviteData({ ...inviteData, lastName: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input className="form-input" type="email" required value={inviteData.email}
                                        onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input className="form-input" value={inviteData.phone}
                                            onChange={(e) => setInviteData({ ...inviteData, phone: e.target.value })} placeholder="+61..." />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Role</label>
                                        <select className="form-input" value={inviteData.role}
                                            onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}>
                                            <option value="employee">Employee</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Security License Number</label>
                                    <input className="form-input" value={inviteData.securityLicenseNumber}
                                        onChange={(e) => setInviteData({ ...inviteData, securityLicenseNumber: e.target.value })} placeholder="SEC-12345" />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={closeInviteModal}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" id="btn-submit-invite">Invite Employee</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {editingUser && (
                <div className="modal-overlay" onClick={() => setEditingUser(null)}>
                    <div className="modal animate-in" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Employee</h3>
                            <button className="modal-close" onClick={() => setEditingUser(null)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleEdit}>
                            <div className="modal-form-grid">
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input className="form-input" required value={editData.firstName}
                                        onChange={(e) => setEditData({ ...editData, firstName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input className="form-input" required value={editData.lastName}
                                        onChange={(e) => setEditData({ ...editData, lastName: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input className="form-input" value={editData.phone}
                                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })} placeholder="+61..." />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Security License Number</label>
                                <input className="form-input" value={editData.securityLicenseNumber}
                                    onChange={(e) => setEditData({ ...editData, securityLicenseNumber: e.target.value })} placeholder="SEC-12345" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" id="btn-submit-edit">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
