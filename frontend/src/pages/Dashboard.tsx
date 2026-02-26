// ============================================================
// Dashboard — Phase 4 Analytics with Liquid Glass design
// ============================================================
import { useState, useEffect } from 'react';
import {
    Shield, Users, Clock, AlertTriangle, MapPin, TrendingUp,
    CheckCircle, Activity, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsApi, shiftsApi, reportsApi } from '../api/client';
import type { AnalyticsDashboard } from '../types';

export default function Dashboard() {
    const { user, isManager } = useAuth();
    const [stats, setStats] = useState<AnalyticsDashboard | null>(null);
    const [upcomingShifts, setUpcomingShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const [dashRes, shiftsRes] = await Promise.all([
                analyticsApi.getDashboard().catch(() => null),
                shiftsApi.getUpcoming().catch(() => ({ data: [] })),
            ]);
            if (dashRes?.data) setStats(dashRes.data);
            setUpcomingShifts(Array.isArray(shiftsRes.data) ? shiftsRes.data.slice(0, 5) : []);
        } catch { /* silent */ }
        setLoading(false);
    };

    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

    const statCards = stats ? [
        {
            label: 'Active Guards', value: stats.activeGuards, total: stats.totalGuards,
            icon: Users, color: '#0071e3', tint: 'card-blue'
        },
        {
            label: 'Shifts Today', value: stats.shiftsToday, extra: `${stats.activeShifts} active`,
            icon: Clock, color: '#30d5c8', tint: 'card-green'
        },
        {
            label: 'Compliance', value: `${stats.complianceScore}%`, extra: 'Overall score',
            icon: CheckCircle, color: '#30d158', tint: 'card-green'
        },
        {
            label: 'Open Incidents', value: stats.openIncidents, total: stats.totalIncidents,
            icon: AlertTriangle, color: stats.openIncidents > 0 ? '#ff453a' : '#30d158',
            tint: stats.openIncidents > 0 ? 'card-red' : 'card-green'
        },
    ] : [];

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <h2>{greeting}, {user?.firstName}</h2>
                <p>{isManager
                    ? 'Here\'s your operations overview — everything at a glance'
                    : 'Your schedule and activity summary'
                }</p>
            </div>

            {/* KPI Stats Grid */}
            <div className="stats-grid">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="stat-card">
                            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12, marginBottom: 16 }} />
                            <div className="skeleton" style={{ width: 80, height: 28, marginBottom: 8 }} />
                            <div className="skeleton" style={{ width: 100, height: 14 }} />
                        </div>
                    ))
                ) : (
                    statCards.map((s, i) => (
                        <div key={i} className={`stat-card animate-in stagger-${i + 1}`}>
                            <div className="stat-icon" style={{
                                color: s.color,
                                background: `${s.color}10`,
                                border: `1px solid ${s.color}20`
                            }}>
                                <s.icon size={20} />
                            </div>
                            <div className="stat-value">{s.value}</div>
                            <div className="stat-label">
                                {s.label}
                                {s.total !== undefined && (
                                    <span style={{ color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>
                                        / {s.total}
                                    </span>
                                )}
                                {s.extra && (
                                    <span style={{ color: s.color, marginLeft: 6, fontSize: '0.72rem' }}>
                                        {s.extra}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Main Grid */}
            <div className="dashboard-grid">
                {/* Upcoming Shifts */}
                <div className="card animate-in stagger-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                            <Activity size={16} style={{ marginRight: 8, color: '#0071e3', verticalAlign: 'middle' }} />
                            Upcoming Shifts
                        </h3>
                        <span className="badge badge-info">{upcomingShifts.length} scheduled</span>
                    </div>

                    {upcomingShifts.length === 0 ? (
                        <div className="empty-state">
                            <Clock size={32} />
                            <h4>No upcoming shifts</h4>
                            <p>Your schedule is clear</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {upcomingShifts.map((shift: any) => (
                                <div key={shift.id} className="open-shift-dash-card">
                                    <div className="shift-detail">
                                        <div className="shift-location">
                                            <MapPin size={14} />
                                            {shift.location?.name || 'Unknown'}
                                        </div>
                                        <div className="shift-timing">
                                            <Clock size={12} />
                                            {new Date(shift.startTime).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            {' · '}
                                            {new Date(shift.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                                            {' – '}
                                            {new Date(shift.endTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <span className={`badge ${shift.status === 'in_progress' ? 'badge-success' : 'badge-info'}`}>
                                        {shift.status?.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Stats Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card animate-in stagger-4" style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.92rem', marginBottom: 20, fontWeight: 700 }}>
                            <TrendingUp size={16} style={{ marginRight: 8, color: '#30d5c8', verticalAlign: 'middle' }} />
                            Quick Stats
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[
                                { label: 'Check-ins Today', value: stats?.checkinsToday ?? '—', icon: CheckCircle, color: '#30d158' },
                                { label: 'Active Shifts', value: stats?.activeShifts ?? '—', icon: Activity, color: '#0071e3' },
                                { label: 'Open Incidents', value: stats?.openIncidents ?? '—', icon: AlertTriangle, color: '#ff453a' },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 14px', borderRadius: 12,
                                    background: 'rgba(255,255,255,0.025)',
                                    border: '1px solid rgba(255,255,255,0.04)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <item.icon size={16} style={{ color: item.color }} />
                                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Local Time */}
                    <div className="card animate-in stagger-5" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
                            Local Time
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                            {now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                            {now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
