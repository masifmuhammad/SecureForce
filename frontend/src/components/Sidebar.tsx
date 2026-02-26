// ============================================================
// Sidebar Component — Main navigation (overlay on mobile)
// ============================================================
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard, Users, Calendar, MapPin, CheckCircle,
    FileText, Shield, LogOut, ClipboardList, X,
    ShieldCheck, AlertCircle, Monitor, Building, Settings,
} from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const navItems = [
    {
        section: 'Overview', items: [
            { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        ]
    },
    {
        section: 'Management', items: [
            { path: '/employees', label: 'Employees', icon: Users, managerOnly: true },
            { path: '/shifts', label: 'Shifts', icon: Calendar },
            { path: '/shift-assignments', label: 'Assignments', icon: ClipboardList, managerOnly: true },
            { path: '/locations', label: 'Locations', icon: MapPin, managerOnly: true },
            { path: '/reports', label: 'Reports', icon: FileText },
        ]
    },
    {
        section: 'Operations', items: [
            { path: '/checkin', label: 'Check In/Out', icon: CheckCircle },
        ]
    },
    {
        section: 'Enterprise', items: [
            { path: '/compliance', label: 'Compliance', icon: ShieldCheck, managerOnly: true },
            { path: '/incidents', label: 'Incidents', icon: AlertCircle },
            { path: '/clients', label: 'Clients', icon: Building, managerOnly: true },
        ]
    },
    {
        section: 'Security', items: [
            { path: '/sessions', label: 'Sessions', icon: Monitor },
        ]
    },
    {
        section: 'System', items: [
            { path: '/audit', label: 'Audit Logs', icon: ClipboardList, managerOnly: true },
            { path: '/settings', label: 'Organization', icon: Settings, managerOnly: true },
        ]
    },
];

export default function Sidebar({ isOpen, onClose }: Props) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isManager } = useAuth();

    const handleNav = (path: string) => {
        navigate(path);
        onClose(); // close sidebar on mobile after navigation
    };

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
            {/* Logo */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="logo-icon"><Shield size={18} /></div>
                    <h1>SecureForce</h1>
                </div>
                {/* Mobile close button */}
                <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
                    <X size={18} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((section) => (
                    <div className="nav-section" key={section.section}>
                        <div className="nav-section-title">{section.section}</div>
                        {section.items
                            .filter((item) => !item.managerOnly || isManager)
                            .map((item) => (
                                <button
                                    key={item.path}
                                    className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                                    onClick={() => handleNav(item.path)}
                                    id={`nav-${item.label.toLowerCase().replace(/[\s/]/g, '-')}`}
                                >
                                    <item.icon />
                                    {item.label}
                                </button>
                            ))}
                    </div>
                ))}
            </nav>

            {/* User card */}
            <div className="sidebar-footer">
                <div className="user-card">
                    <div className="user-avatar">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div className="user-info">
                        <div className="user-name">{user?.firstName} {user?.lastName}</div>
                        <div className="user-role">{user?.role}</div>
                    </div>
                    <button
                        className="modal-close"
                        onClick={logout}
                        title="Logout"
                        id="btn-logout"
                        style={{ background: 'transparent' }}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
