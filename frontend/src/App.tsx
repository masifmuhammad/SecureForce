// ============================================================
// App — Root component with React Router
// Protected routes redirect to login if unauthenticated
// ============================================================
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import AvailableShiftsPopup from './components/AvailableShiftsPopup';
import NotificationBell from './components/NotificationBell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Shifts from './pages/Shifts';
import ShiftAssignments from './pages/ShiftAssignments';
import Locations from './pages/Locations';
import CheckIn from './pages/CheckIn';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import Compliance from './pages/Compliance';
import Incidents from './pages/Incidents';
import Sessions from './pages/Sessions';
import TenantSettings from './pages/TenantSettings';
import Clients from './pages/Clients';

/** Protected layout — renders sidebar + mobile nav + child route if authenticated */
function ProtectedLayout() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showShiftsPopup, setShowShiftsPopup] = useState(true);

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <span>Loading SecureForce...</span>
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    // Show available shifts popup only for guards (employees) and managers — NOT admins
    const isGuardOrManager = user && (user.role === 'employee' || user.role === 'manager');
    const shouldShowPopup = showShiftsPopup && isGuardOrManager && !sessionStorage.getItem('sf_shifts_popup_dismissed');

    const handleClosePopup = (permanently = false) => {
        setShowShiftsPopup(false);
        if (permanently) {
            sessionStorage.setItem('sf_shifts_popup_dismissed', 'true');
        }
    };

    const handleWatchLater = () => {
        // Save that user wants to see shifts on dashboard
        localStorage.setItem('sf_watch_later_shifts', 'true');
        setShowShiftsPopup(false);
    };

    return (
        <div className="app-layout">
            {/* Mobile overlay backdrop */}
            {sidebarOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="main-content">
                {/* Top bar with notification bell */}
                <div style={{
                    display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                    marginBottom: 8, paddingRight: 4
                }}>
                    <NotificationBell />
                </div>
                <Outlet />
            </main>
            <MobileNav onMenuOpen={() => setSidebarOpen(true)} />

            {/* Available Shifts Popup — shown for guards/managers only */}
            {shouldShowPopup && <AvailableShiftsPopup onClose={() => handleClosePopup(true)} onWatchLater={handleWatchLater} />}
        </div>
    );
}

/** Public route — redirect to dashboard if already authenticated */
function PublicRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return null;
    if (isAuthenticated) return <Navigate to="/" replace />;
    return <>{children}</>;
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

                    {/* Protected routes */}
                    <Route element={<ProtectedLayout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/employees" element={<Employees />} />
                        <Route path="/shifts" element={<Shifts />} />
                        <Route path="/shift-assignments" element={<ShiftAssignments />} />
                        <Route path="/locations" element={<Locations />} />
                        <Route path="/checkin" element={<CheckIn />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/audit" element={<AuditLogs />} />
                        <Route path="/compliance" element={<Compliance />} />
                        <Route path="/incidents" element={<Incidents />} />
                        <Route path="/sessions" element={<Sessions />} />
                        <Route path="/clients" element={<Clients />} />
                        <Route path="/settings" element={<TenantSettings />} />
                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
