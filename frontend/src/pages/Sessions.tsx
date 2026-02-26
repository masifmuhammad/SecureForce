// ============================================================
// Sessions Page — Active session/device management
// ============================================================
import React, { useState, useEffect } from 'react';
import { sessionsApi } from '../api/client';
import { Smartphone, Monitor, Trash2, LogOut, Globe, Clock } from 'lucide-react';

interface Session {
    id: string; userId: string; ipAddress: string;
    userAgent: string; deviceFingerprint?: string;
    lastActiveAt: string; expiresAt: string;
    isRevoked: boolean; createdAt: string;
}

export default function Sessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [revoking, setRevoking] = useState<string | null>(null);

    useEffect(() => { loadSessions(); }, []);

    const loadSessions = async () => {
        try {
            const { data } = await sessionsApi.getMySessions();
            setSessions(data);
        } catch (err) { console.error(err); }
    };

    const revokeSession = async (id: string) => {
        if (!confirm('Revoke this session? That device will be logged out.')) return;
        setRevoking(id);
        try {
            await sessionsApi.revokeSession(id);
            loadSessions();
        } catch (err) { console.error(err); }
        setRevoking(null);
    };

    const revokeAll = async () => {
        if (!confirm('Revoke ALL sessions? You will be logged out from all devices.')) return;
        try {
            await sessionsApi.revokeAll();
            loadSessions();
        } catch (err) { console.error(err); }
    };

    const parseUA = (ua: string) => {
        if (!ua) return { device: 'Unknown', browser: 'Unknown' };
        const isMobile = /Mobile|Android|iPhone/i.test(ua);
        const browser = /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : /Edge/.test(ua) ? 'Edge' : 'Other';
        return { device: isMobile ? 'Mobile' : 'Desktop', browser };
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Active Sessions</h2>
                    <p>Manage your active login sessions and devices</p>
                </div>
                <button className="btn btn-danger" onClick={revokeAll} id="btn-revoke-all">
                    <LogOut size={16} /> Revoke All Sessions
                </button>
            </div>

            {sessions.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 40 }}>
                    <Monitor size={48} />
                    <h4>No active sessions</h4>
                    <p>Your login sessions will appear here</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {sessions.map((s) => {
                        const ua = parseUA(s.userAgent);
                        return (
                            <div key={s.id} className="stat-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 10,
                                    background: 'var(--sf-primary)', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    {ua.device === 'Mobile' ? <Smartphone size={22} /> : <Monitor size={22} />}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                        {ua.browser} — {ua.device}
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--sf-text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Globe size={12} /> {s.ipAddress || '—'}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Clock size={12} /> Last active: {timeAgo(s.lastActiveAt)}
                                        </span>
                                        <span>Created: {new Date(s.createdAt).toLocaleDateString('en-AU')}</span>
                                    </div>
                                </div>

                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => revokeSession(s.id)}
                                    disabled={revoking === s.id}
                                    id={`revoke-${s.id}`}
                                >
                                    <Trash2 size={14} /> Revoke
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
