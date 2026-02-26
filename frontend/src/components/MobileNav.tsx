// ============================================================
// MobileNav — Bottom tab navigation for mobile devices
// ============================================================
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard, Calendar, CheckCircle, MapPin, Menu,
} from 'lucide-react';

interface Props {
    onMenuOpen: () => void;
}

export default function MobileNav({ onMenuOpen }: Props) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isManager } = useAuth();

    const tabs = [
        { path: '/', label: 'Home', icon: LayoutDashboard },
        { path: '/shifts', label: 'Shifts', icon: Calendar },
        { path: '/checkin', label: 'Check In', icon: CheckCircle, primary: true },
        ...(isManager ? [{ path: '/locations', label: 'Sites', icon: MapPin }] : []),
        { path: '#menu', label: 'More', icon: Menu },
    ];

    const handleTap = (path: string) => {
        if (path === '#menu') {
            onMenuOpen();
        } else {
            navigate(path);
        }
    };

    return (
        <nav className="mobile-nav" id="mobile-nav">
            {tabs.map((tab) => (
                <button
                    key={tab.path}
                    className={`mobile-nav-tab ${location.pathname === tab.path ? 'active' : ''} ${tab.primary ? 'primary' : ''}`}
                    onClick={() => handleTap(tab.path)}
                    id={`mob-${tab.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                    <tab.icon size={22} />
                    <span>{tab.label}</span>
                </button>
            ))}
        </nav>
    );
}
