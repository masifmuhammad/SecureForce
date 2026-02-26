// ============================================================
// Check-In Page — GPS-verified check-in/check-out
// Uses browser Geolocation API to capture coordinates
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { shiftsApi, checkinsApi } from '../api/client';
import type { Shift } from '../types';
import { Navigation, Crosshair, CheckCircle, XCircle, MapPin } from 'lucide-react';

interface GpsPosition {
    latitude: number;
    longitude: number;
    accuracy: number;
}

export default function CheckInPage() {
    const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([]);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [gpsPosition, setGpsPosition] = useState<GpsPosition | null>(null);
    const [gpsError, setGpsError] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const watchIdRef = useRef<number | null>(null);

    useEffect(() => {
        loadShifts();
        acquireGps();
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    const loadShifts = async () => {
        try {
            const { data } = await shiftsApi.getUpcoming();
            setUpcomingShifts(data);
            if (data.length > 0) setSelectedShift(data[0]);
        } catch (err) { console.error(err); }
    };

    const acquireGps = () => {
        if (!navigator.geolocation) {
            setGpsError('Geolocation is not supported by your browser');
            return;
        }

        // First try getCurrentPosition for immediate result
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGpsPosition({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
                setGpsError('');
            },
            () => {
                // Silently fall through to watchPosition
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );

        // Then start watching for continuous updates
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                setGpsPosition({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
                setGpsError('');
            },
            (err) => {
                if (err.code === 1) {
                    setGpsError('Location permission denied. Please allow location access in your browser settings.');
                } else if (err.code === 2) {
                    setGpsError('Location unavailable. Please check your device settings.');
                } else {
                    setGpsError('Location request timed out. Retrying...');
                }
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
        );
    };

    const handleCheckIn = async (type: 'check_in' | 'check_out') => {
        if (!selectedShift || !gpsPosition) return;
        setLoading(true);
        setResult(null);

        try {
            const { data } = await checkinsApi.create({
                shiftId: selectedShift.id,
                type,
                latitude: gpsPosition.latitude,
                longitude: gpsPosition.longitude,
                accuracyMeters: gpsPosition.accuracy,
            });
            setResult({
                success: data.verificationStatus === 'verified',
                message: data.verificationStatus === 'verified'
                    ? `${type === 'check_in' ? 'Checked in' : 'Checked out'} successfully. Distance: ${Number(data.distanceFromSite).toFixed(0)}m from site.`
                    : `${type === 'check_in' ? 'Check-in' : 'Check-out'} recorded — ${data.verificationStatus}. ${data.verificationNotes}`,
            });
            loadShifts();
        } catch (err: any) {
            setResult({
                success: false,
                message: err.response?.data?.message || 'Check-in failed. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h2>Check In / Out</h2>
                <p>GPS-verified attendance tracking</p>
            </div>

            <div className="checkin-card animate-in">
                {/* GPS Status */}
                <div className={`gps-status ${gpsPosition ? 'active' : 'inactive'}`}>
                    {gpsPosition ? <Crosshair size={32} /> : <Navigation size={32} />}
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>
                    {gpsPosition ? 'GPS Active' : 'Acquiring GPS...'}
                </h3>

                {gpsError && (
                    <p style={{ color: 'var(--sf-red)', fontSize: '0.78rem', marginBottom: 12, maxWidth: 320, margin: '0 auto 12px' }}>{gpsError}</p>
                )}

                {gpsPosition && (
                    <p className="gps-coords">
                        <MapPin size={12} style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                        {gpsPosition.latitude.toFixed(6)}, {gpsPosition.longitude.toFixed(6)} ({'\u00B1'}{gpsPosition.accuracy.toFixed(0)}m)
                    </p>
                )}

                {/* Shift Selector */}
                {upcomingShifts.length > 0 ? (
                    <div style={{ marginTop: 28 }}>
                        <div className="form-group" style={{ textAlign: 'left', maxWidth: 320, margin: '0 auto' }}>
                            <label className="form-label">Select Shift</label>
                            <select
                                className="form-input"
                                value={selectedShift?.id || ''}
                                onChange={(e) => setSelectedShift(upcomingShifts.find((s) => s.id === e.target.value) || null)}
                                id="select-shift"
                            >
                                {upcomingShifts.map((shift) => (
                                    <option key={shift.id} value={shift.id}>
                                        {shift.location?.name} — {new Date(shift.startTime).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
                            <button
                                className="btn btn-checkin"
                                style={{ background: 'var(--sf-green)', color: 'white', maxWidth: 200, borderRadius: 'var(--sf-radius)' }}
                                onClick={() => handleCheckIn('check_in')}
                                disabled={!gpsPosition || loading}
                                id="btn-check-in"
                            >
                                <CheckCircle size={16} /> Check In
                            </button>
                            <button
                                className="btn btn-checkin"
                                style={{ background: 'var(--sf-red)', color: 'white', maxWidth: 200, borderRadius: 'var(--sf-radius)' }}
                                onClick={() => handleCheckIn('check_out')}
                                disabled={!gpsPosition || loading}
                                id="btn-check-out"
                            >
                                <XCircle size={16} /> Check Out
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ marginTop: 28, color: 'var(--sf-text-secondary)', fontSize: '0.84rem' }}>
                        <p>No upcoming shifts assigned.</p>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div
                        className="animate-in"
                        style={{
                            marginTop: 20,
                            padding: '14px 18px',
                            borderRadius: 'var(--sf-radius-sm)',
                            background: result.success ? 'rgba(48, 209, 88, 0.08)' : 'rgba(255, 159, 10, 0.08)',
                            border: `1px solid ${result.success ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 159, 10, 0.2)'}`,
                            fontSize: '0.82rem',
                            textAlign: 'left',
                            color: result.success ? 'var(--sf-green)' : 'var(--sf-orange)',
                        }}
                    >
                        {result.message}
                    </div>
                )}
            </div>
        </div>
    );
}
