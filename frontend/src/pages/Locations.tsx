// ============================================================
// Locations Page — Security site management
// ============================================================
import React, { useState, useEffect } from 'react';
import { locationsApi } from '../api/client';
import type { Location } from '../types';
import { MapPin, Plus, X } from 'lucide-react';

export default function Locations() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', address: '', suburb: '', state: 'NSW', postcode: '',
        latitude: '', longitude: '', radiusMeters: '100', contactName: '', contactPhone: '', notes: '',
    });

    useEffect(() => { loadLocations(); }, [page]);

    const loadLocations = async () => {
        try {
            const { data } = await locationsApi.getAll(page, 20);
            setLocations(data.items);
            setTotal(data.total);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await locationsApi.create({
                ...formData,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                radiusMeters: parseInt(formData.radiusMeters),
            });
            setShowModal(false);
            setFormData({ name: '', address: '', suburb: '', state: 'NSW', postcode: '', latitude: '', longitude: '', radiusMeters: '100', contactName: '', contactPhone: '', notes: '' });
            loadLocations();
        } catch (err) { console.error(err); }
    };

    const auStates = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

    return (
        <div>
            <div className="page-header">
                <h2>Locations</h2>
                <p>Manage security sites and geofences</p>
            </div>

            <div style={{ marginBottom: 20 }}>
                <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-add-location">
                    <Plus size={16} /> Add Location
                </button>
            </div>

            {/* Location cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {locations.map((loc) => (
                    <div className="card" key={loc.id}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{loc.name}</h4>
                                <p style={{ fontSize: '0.82rem', color: 'var(--sf-text-secondary)' }}>{loc.address}</p>
                            </div>
                            <span className={`badge ${loc.isActive ? 'badge-success' : 'badge-danger'}`}>
                                {loc.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8rem' }}>
                            <div>
                                <span style={{ color: 'var(--sf-text-muted)' }}>Suburb:</span> {loc.suburb || '—'}
                            </div>
                            <div>
                                <span style={{ color: 'var(--sf-text-muted)' }}>State:</span> {loc.state || '—'}
                            </div>
                            <div>
                                <span style={{ color: 'var(--sf-text-muted)' }}>Radius:</span> {loc.radiusMeters}m
                            </div>
                            <div>
                                <span style={{ color: 'var(--sf-text-muted)' }}>GPS:</span>{' '}
                                <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                                    {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                                </span>
                            </div>
                        </div>
                        {loc.contactName && (
                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sf-border)', fontSize: '0.8rem' }}>
                                <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                                {loc.contactName} — {loc.contactPhone}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {locations.length === 0 && (
                <div className="empty-state">
                    <MapPin size={48} />
                    <h4>No locations yet</h4>
                    <p>Add a security site to get started</p>
                </div>
            )}

            {/* Create Location Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal animate-in" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Security Site</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label">Site Name</label>
                                <input className="form-input" required value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Westfield Sydney" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <input className="form-input" required value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label">Suburb</label>
                                    <input className="form-input" value={formData.suburb}
                                        onChange={(e) => setFormData({ ...formData, suburb: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">State</label>
                                    <select className="form-input" value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}>
                                        {auStates.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Postcode</label>
                                    <input className="form-input" value={formData.postcode}
                                        onChange={(e) => setFormData({ ...formData, postcode: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label">Latitude</label>
                                    <input className="form-input" type="number" step="any" required value={formData.latitude}
                                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} placeholder="-33.8688" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Longitude</label>
                                    <input className="form-input" type="number" step="any" required value={formData.longitude}
                                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} placeholder="151.2093" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Radius (m)</label>
                                    <input className="form-input" type="number" required value={formData.radiusMeters}
                                        onChange={(e) => setFormData({ ...formData, radiusMeters: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label">Contact Name</label>
                                    <input className="form-input" value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Phone</label>
                                    <input className="form-input" value={formData.contactPhone}
                                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" id="btn-submit-location">Add Location</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
