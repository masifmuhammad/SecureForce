// ============================================================
// Notification Bell — Header bell icon with dropdown
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { notificationsApi } from '../api/client';
import { AppNotification } from '../types';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadUnread();
        const interval = setInterval(loadUnread, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const loadUnread = async () => {
        try {
            const { data } = await notificationsApi.getUnreadCount();
            setUnread(data.unread);
        } catch { /* silent */ }
    };

    const loadNotifications = async () => {
        try {
            const { data } = await notificationsApi.getAll(1, 15);
            setNotifications(data.items);
        } catch { /* silent */ }
    };

    const toggleDropdown = () => {
        if (!open) loadNotifications();
        setOpen(!open);
    };

    const markRead = async (id: string) => {
        await notificationsApi.markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnread(prev => Math.max(0, prev - 1));
    };

    const markAllRead = async () => {
        await notificationsApi.markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnread(0);
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const typeIcon = (type: string) => {
        switch (type) {
            case 'incident': return '🔴';
            case 'compliance': return '⚠️';
            case 'shift': return '📅';
            case 'alert': return '🔔';
            default: return '💬';
        }
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button className="notification-bell" onClick={toggleDropdown}>
                <Bell size={20} />
                {unread > 0 && <span className="unread-dot" />}
            </button>

            {open && (
                <div className="notification-dropdown">
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)'
                    }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                            Notifications {unread > 0 && <span style={{
                                background: 'rgba(255,69,58,0.15)', color: '#ff453a',
                                padding: '2px 8px', borderRadius: '9999px', fontSize: '0.72rem',
                                marginLeft: 6
                            }}>{unread}</span>}
                        </span>
                        {unread > 0 && (
                            <button onClick={markAllRead} className="btn-ghost" style={{
                                fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4,
                                padding: '4px 8px', border: 'none', cursor: 'pointer',
                                color: 'rgba(255,255,255,0.5)', background: 'transparent'
                            }}>
                                <CheckCheck size={14} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{
                                padding: '40px 20px', textAlign: 'center',
                                color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem'
                            }}>
                                <Bell size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                                    onClick={() => !n.isRead && markRead(n.id)}
                                >
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{typeIcon(n.type)}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: n.isRead ? 500 : 600,
                                                fontSize: '0.85rem',
                                                marginBottom: 3,
                                                color: n.isRead ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.9)'
                                            }}>
                                                {n.title}
                                            </div>
                                            <div style={{
                                                fontSize: '0.78rem',
                                                color: 'rgba(255,255,255,0.4)',
                                                lineHeight: 1.4,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {n.message}
                                            </div>
                                            <div style={{
                                                fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)',
                                                marginTop: 4
                                            }}>
                                                {timeAgo(n.createdAt)}
                                            </div>
                                        </div>
                                        {!n.isRead && (
                                            <div style={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                background: '#0071e3', marginTop: 6, flexShrink: 0,
                                                boxShadow: '0 0 8px rgba(0,113,227,0.4)'
                                            }} />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
