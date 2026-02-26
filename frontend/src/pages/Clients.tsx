// ============================================================
// Clients Page — Client organization management
// ============================================================
import React, { useState, useEffect } from 'react';
import { clientsApi } from '../api/client';
import type { ClientOrganization } from '../types';
import { Building, Search, X, Plus, Edit, Trash2 } from 'lucide-react';

const emptyForm = {
    name: '', abn: '', industry: '',
    primaryContactName: '', primaryContactEmail: '', primaryContactPhone: '',
    contractStartDate: '', contractEndDate: '', billingRate: '',
};

export default function Clients() {
    const [clients, setClients] = useState<ClientOrganization[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<ClientOrganization | null>(null);
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => { loadClients(); }, [page]);

    const loadClients = async () => {
        try {
            const { data } = await clientsApi.getAll(page, 20);
            setClients(data.items);
            setTotal(data.total);
        } catch (err) { console.error(err); }
    };

    const openAdd = () => {
        setEditing(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const openEdit = (client: ClientOrganization) => {
        setEditing(client);
        setFormData({
            name: client.name,
            abn: client.abn || '',
            industry: client.industry || '',
            primaryContactName: client.primaryContactName || '',
            primaryContactEmail: client.primaryContactEmail || '',
            primaryContactPhone: client.primaryContactPhone || '',
            contractStartDate: client.contractStartDate ? client.contractStartDate.split('T')[0] : '',
            contractEndDate: client.contractEndDate ? client.contractEndDate.split('T')[0] : '',
            billingRate: client.billingRate ? String(client.billingRate) : '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            billingRate: formData.billingRate ? parseFloat(formData.billingRate) : null,
            contractStartDate: formData.contractStartDate || null,
            contractEndDate: formData.contractEndDate || null,
        };
        try {
            if (editing) {
                await clientsApi.update(editing.id, payload);
            } else {
                await clientsApi.create(payload);
            }
            setShowModal(false);
            loadClients();
        } catch (err) { console.error(err); }
    };

    const handleDeactivate = async (id: string) => {
        if (confirm('Deactivate this client organization?')) {
            await clientsApi.deactivate(id);
            loadClients();
        }
    };

    const filtered = clients.filter((c) =>
        `${c.name} ${c.abn || ''} ${c.industry || ''}`.toLowerCase().includes(search.toLowerCase()),
    );

    const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-AU') : '—';

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Client Organizations</h2>
                    <p>Manage client companies your security firm serves</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd} id="btn-add-client">
                    <Plus size={16} /> Add Client
                </button>
            </div>

            {/* Search bar */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--sf-text-muted)' }} />
                    <input
                        className="form-input"
                        placeholder="Search clients..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 40 }}
                        id="search-clients"
                    />
                </div>
            </div>

            {/* Desktop Table */}
            <div className="data-table-container desktop-only">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Industry</th>
                            <th>Contact</th>
                            <th>Contract Period</th>
                            <th>Rate ($/hr)</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((client) => (
                            <tr key={client.id}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{client.name}</div>
                                    {client.abn && (
                                        <div style={{ fontSize: '0.78rem', color: 'var(--sf-text-muted)', fontFamily: 'monospace' }}>
                                            ABN: {client.abn}
                                        </div>
                                    )}
                                </td>
                                <td>{client.industry || '—'}</td>
                                <td>
                                    <div style={{ fontSize: '0.85rem' }}>{client.primaryContactName || '—'}</div>
                                    {client.primaryContactEmail && (
                                        <div style={{ fontSize: '0.78rem', color: 'var(--sf-text-muted)' }}>{client.primaryContactEmail}</div>
                                    )}
                                </td>
                                <td style={{ fontSize: '0.82rem' }}>
                                    {formatDate(client.contractStartDate)} – {formatDate(client.contractEndDate)}
                                </td>
                                <td style={{ fontFamily: 'monospace' }}>
                                    {client.billingRate ? `$${Number(client.billingRate).toFixed(2)}` : '—'}
                                </td>
                                <td>
                                    <span className={`badge ${client.isActive ? 'badge-success' : 'badge-danger'}`}>
                                        {client.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(client)} title="Edit">
                                        <Edit size={14} />
                                    </button>
                                    {client.isActive && (
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(client.id)} title="Deactivate">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="empty-state">
                        <Building size={48} />
                        <h4>No clients found</h4>
                        <p>Add your first client organization to get started</p>
                    </div>
                )}
            </div>

            {/* Mobile Cards */}
            <div className="mobile-only">
                {filtered.map((client) => (
                    <div className="card" key={client.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>{client.name}</h4>
                                {client.abn && (
                                    <div style={{ fontSize: '0.78rem', color: 'var(--sf-text-muted)', fontFamily: 'monospace' }}>
                                        ABN: {client.abn}
                                    </div>
                                )}
                            </div>
                            <span className={`badge ${client.isActive ? 'badge-success' : 'badge-danger'}`}>
                                {client.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div style={{ background: 'var(--sf-bg-glass-light)', padding: '10px 12px', borderRadius: 'var(--sf-radius-sm)', marginBottom: 10 }}>
                            {client.industry && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                    <span style={{ color: 'var(--sf-text-muted)' }}>Industry</span>
                                    <span>{client.industry}</span>
                                </div>
                            )}
                            {client.primaryContactName && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                    <span style={{ color: 'var(--sf-text-muted)' }}>Contact</span>
                                    <span>{client.primaryContactName}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                <span style={{ color: 'var(--sf-text-muted)' }}>Contract</span>
                                <span>{formatDate(client.contractStartDate)} – {formatDate(client.contractEndDate)}</span>
                            </div>
                            {client.billingRate && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                    <span style={{ color: 'var(--sf-text-muted)' }}>Rate</span>
                                    <span style={{ fontFamily: 'monospace' }}>${Number(client.billingRate).toFixed(2)}/hr</span>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(client)}>
                                <Edit size={14} /> Edit
                            </button>
                            {client.isActive && (
                                <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleDeactivate(client.id)}>
                                    <Trash2 size={14} /> Deactivate
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="empty-state">
                        <Building size={48} />
                        <h4>No clients found</h4>
                        <p>Add your first client organization to get started</p>
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

            {/* Add/Edit Client Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal animate-in" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editing ? 'Edit Client' : 'Add New Client'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Company Name *</label>
                                <input className="form-input" required value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="modal-form-grid">
                                <div className="form-group">
                                    <label className="form-label">ABN</label>
                                    <input className="form-input" value={formData.abn} placeholder="12 345 678 901"
                                        onChange={(e) => setFormData({ ...formData, abn: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Industry</label>
                                    <select className="form-input" value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}>
                                        <option value="">Select...</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Construction">Construction</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Education">Education</option>
                                        <option value="Hospitality">Hospitality</option>
                                        <option value="Government">Government</option>
                                        <option value="Logistics">Logistics</option>
                                        <option value="Events">Events</option>
                                        <option value="Corporate">Corporate</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <h4 style={{ margin: '16px 0 8px', color: 'var(--sf-text-secondary)', fontSize: '0.85rem' }}>Primary Contact</h4>
                            <div className="modal-form-grid modal-form-grid-3">
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input className="form-input" value={formData.primaryContactName}
                                        onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input className="form-input" type="email" value={formData.primaryContactEmail}
                                        onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" value={formData.primaryContactPhone}
                                        onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })} />
                                </div>
                            </div>

                            <h4 style={{ margin: '16px 0 8px', color: 'var(--sf-text-secondary)', fontSize: '0.85rem' }}>Contract Details</h4>
                            <div className="modal-form-grid modal-form-grid-3">
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input className="form-input" type="date" value={formData.contractStartDate}
                                        onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input className="form-input" type="date" value={formData.contractEndDate}
                                        onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Billing Rate ($/hr)</label>
                                    <input className="form-input" type="number" step="0.01" min="0" value={formData.billingRate}
                                        onChange={(e) => setFormData({ ...formData, billingRate: e.target.value })} placeholder="45.00" />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" id="btn-submit-client">
                                    {editing ? 'Save Changes' : 'Add Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
