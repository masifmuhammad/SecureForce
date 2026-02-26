// ============================================================
// Tenant Settings Page — Admin portal for organization settings
// ============================================================
import React, { useState, useEffect } from 'react';
import { tenantApi } from '../api/client';
import type { TenantInfo } from '../types';
import { Building2, Save, Users, Globe, Phone, Mail, Clock } from 'lucide-react';

export default function TenantSettings() {
    const [tenant, setTenant] = useState<TenantInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: '', domain: '', abn: '',
        primaryContactName: '', primaryContactEmail: '', primaryContactPhone: '',
        timezone: 'Australia/Sydney', locale: 'en-AU',
    });

    useEffect(() => { loadTenant(); }, []);

    const loadTenant = async () => {
        try {
            const { data } = await tenantApi.getMyTenant();
            setTenant(data);
            setFormData({
                name: data.name || '',
                domain: data.domain || '',
                abn: data.abn || '',
                primaryContactName: data.primaryContactName || '',
                primaryContactEmail: data.primaryContactEmail || '',
                primaryContactPhone: data.primaryContactPhone || '',
                timezone: (data.settings as any)?.timezone || 'Australia/Sydney',
                locale: (data.settings as any)?.locale || 'en-AU',
            });
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { timezone, locale, ...rest } = formData;
            await tenantApi.updateMyTenant({
                ...rest,
                settings: { ...((tenant?.settings || {}) as any), timezone, locale },
            });
            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
            loadTenant();
        } catch (err) { console.error(err); }
        setSaving(false);
    };

    if (loading) return <div className="loading-screen"><div className="spinner" /><span>Loading settings...</span></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Organization Settings</h2>
                    <p>Manage your company details and configuration</p>
                </div>
            </div>

            {success && (
                <div style={{
                    padding: '12px 16px', borderRadius: 10, marginBottom: 20,
                    background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981', fontSize: '0.85rem',
                }}>
                    ✓ {success}
                </div>
            )}

            {/* Usage Stats */}
            {tenant && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
                    <div className="stat-card">
                        <div className="stat-label"><Users size={14} /> Users</div>
                        <div className="stat-value">{tenant.usage.currentUsers} / {tenant.usage.maxUsers}</div>
                        <div style={{
                            height: 6, borderRadius: 3, background: 'var(--sf-bg-tertiary)', marginTop: 8, overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%', borderRadius: 3, width: `${Math.min(tenant.usage.usagePercent, 100)}%`,
                                background: tenant.usage.usagePercent > 90 ? '#ef4444' : tenant.usage.usagePercent > 70 ? '#f59e0b' : 'var(--sf-primary)',
                                transition: 'width 0.5s ease',
                            }} />
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label"><Building2 size={14} /> Plan</div>
                        <div className="stat-value" style={{ textTransform: 'capitalize' }}>{tenant.plan}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label"><Globe size={14} /> Slug</div>
                        <div className="stat-value" style={{ fontSize: '0.95rem' }}>{tenant.slug}</div>
                    </div>
                </div>
            )}

            {/* Settings Form */}
            <div className="stat-card" style={{ padding: 24 }}>
                <h3 style={{ marginBottom: 20 }}>Company Information</h3>
                <form onSubmit={handleSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label className="form-label"><Building2 size={12} style={{ display: 'inline', marginRight: 6 }} />Company Name</label>
                            <input className="form-input" value={formData.name} required
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label"><Globe size={12} style={{ display: 'inline', marginRight: 6 }} />Custom Domain</label>
                            <input className="form-input" value={formData.domain} placeholder="acme.secureforce.com.au"
                                onChange={(e) => setFormData({ ...formData, domain: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">ABN (Australian Business Number)</label>
                        <input className="form-input" value={formData.abn} placeholder="12 345 678 901"
                            onChange={(e) => setFormData({ ...formData, abn: e.target.value })} />
                    </div>

                    <h4 style={{ margin: '24px 0 12px', color: 'var(--sf-text-secondary)' }}>Primary Contact</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label className="form-label"><Users size={12} style={{ display: 'inline', marginRight: 6 }} />Name</label>
                            <input className="form-input" value={formData.primaryContactName}
                                onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label"><Mail size={12} style={{ display: 'inline', marginRight: 6 }} />Email</label>
                            <input className="form-input" type="email" value={formData.primaryContactEmail}
                                onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label"><Phone size={12} style={{ display: 'inline', marginRight: 6 }} />Phone</label>
                            <input className="form-input" value={formData.primaryContactPhone}
                                onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })} />
                        </div>
                    </div>

                    <h4 style={{ margin: '24px 0 12px', color: 'var(--sf-text-secondary)' }}>Preferences</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label className="form-label"><Clock size={12} style={{ display: 'inline', marginRight: 6 }} />Timezone</label>
                            <select className="form-input" value={formData.timezone}
                                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}>
                                <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                                <option value="Australia/Melbourne">Australia/Melbourne (AEST)</option>
                                <option value="Australia/Brisbane">Australia/Brisbane (AEST)</option>
                                <option value="Australia/Perth">Australia/Perth (AWST)</option>
                                <option value="Australia/Adelaide">Australia/Adelaide (ACST)</option>
                                <option value="Australia/Darwin">Australia/Darwin (ACST)</option>
                                <option value="Australia/Hobart">Australia/Hobart (AEST)</option>
                                <option value="Pacific/Auckland">New Zealand (NZST)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label"><Globe size={12} style={{ display: 'inline', marginRight: 6 }} />Locale</label>
                            <select className="form-input" value={formData.locale}
                                onChange={(e) => setFormData({ ...formData, locale: e.target.value })}>
                                <option value="en-AU">English (Australia)</option>
                                <option value="en-NZ">English (New Zealand)</option>
                                <option value="en-GB">English (UK)</option>
                                <option value="en-US">English (US)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" disabled={saving} id="btn-save-settings">
                            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
