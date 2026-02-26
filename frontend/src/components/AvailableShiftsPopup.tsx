// ============================================================
// Available Shifts Popup — Shown after login for employees
// Displays open shifts that guards can accept or skip
// ============================================================
import React, { useState, useEffect } from 'react';
import { shiftsApi } from '../api/client';
import type { Shift } from '../types';
import { MapPin, Clock, Check, X, Calendar, Briefcase } from 'lucide-react';

interface Props {
    onClose: () => void;
    onWatchLater: () => void;
}

export default function AvailableShiftsPopup({ onClose, onWatchLater }: Props) {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadOpenShifts();
    }, []);

    const loadOpenShifts = async () => {
        try {
            const { data } = await shiftsApi.getOpen();
            setShifts(data);
        } catch (err) {
            console.error('Failed to load open shifts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (shiftId: string) => {
        setActionLoading(shiftId);
        try {
            await shiftsApi.accept(shiftId);
            setShifts((prev) => prev.filter((s) => s.id !== shiftId));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to accept shift');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async (shiftId: string) => {
        setActionLoading(shiftId);
        try {
            await shiftsApi.decline(shiftId);
            setShifts((prev) => prev.filter((s) => s.id !== shiftId));
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });

    const getDuration = (start: string, end: string) => {
        const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
        return `${diff.toFixed(1)}h`;
    };

    // Don't show popup while loading or if no open shifts
    if (loading || shifts.length === 0) {
        return null;
    }

    return (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={onWatchLater}>
            <div className="available-shifts-popup animate-in" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="popup-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="popup-icon">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Available Shifts</h3>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--sf-text-secondary)', marginTop: 2 }}>
                                {shifts.length} shift{shifts.length !== 1 ? 's' : ''} available for you
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="btn btn-secondary btn-sm" onClick={onWatchLater} style={{ fontSize: '0.8rem' }}>
                            Watch Later
                        </button>
                        <button className="modal-close" onClick={onClose} aria-label="Close" title="Dismiss">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="popup-body">
                    {loading ? (
                        <div className="empty-state" style={{ padding: 32 }}>
                            <div className="spinner" />
                            <p>Loading available shifts...</p>
                        </div>
                    ) : (
                        <div className="shift-offers-list">
                            {shifts.map((shift) => (
                                <div className="shift-offer-card" key={shift.id}>
                                    <div className="shift-offer-info">
                                        <div className="shift-offer-location">
                                            <MapPin size={14} />
                                            <span>{shift.location?.name || 'Unknown Location'}</span>
                                        </div>
                                        {shift.location?.address && (
                                            <div className="shift-offer-address">
                                                {shift.location.address}
                                            </div>
                                        )}
                                        <div className="shift-offer-time">
                                            <div className="time-row">
                                                <Calendar size={13} />
                                                <span>{formatDate(shift.startTime)}</span>
                                            </div>
                                            <div className="time-row">
                                                <Clock size={13} />
                                                <span>{formatTime(shift.startTime)} — {formatTime(shift.endTime)}</span>
                                                <span className="badge badge-info" style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 8px' }}>
                                                    {getDuration(shift.startTime, shift.endTime)}
                                                </span>
                                            </div>
                                        </div>
                                        {shift.notes && (
                                            <div className="shift-offer-notes">{shift.notes}</div>
                                        )}
                                    </div>
                                    <div className="shift-offer-actions">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleAccept(shift.id)}
                                            disabled={actionLoading === shift.id}
                                            style={{ flex: 1 }}
                                        >
                                            <Check size={14} />
                                            {actionLoading === shift.id ? 'Accepting...' : 'Accept'}
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleDecline(shift.id)}
                                            disabled={actionLoading === shift.id}
                                            style={{ flex: 1 }}
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
