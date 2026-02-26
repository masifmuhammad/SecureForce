// ============================================================
// Login Page — Email + password with 2FA support
// ============================================================
import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Mail, Lock, Key } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [useBackupCode, setUseBackupCode] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password, showTwoFactor ? twoFactorCode : undefined);
            if (result?.requiresTwoFactor) {
                setShowTwoFactor(true);
                setLoading(false);
                return;
            }
            navigate('/');

            // Clear the popup dismissal flag so it shows again on new login
            sessionStorage.removeItem('sf_shifts_popup_dismissed');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card animate-in">
                {/* Logo Section */}
                <div className="logo-section">
                    <div className="logo-icon"><Shield size={24} /></div>
                    <h2>SecureForce</h2>
                    <p className="subtitle">Security Workforce Management</p>
                </div>

                {/* Error Message */}
                {error && <div className="login-error" id="login-error">{error}</div>}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="login-email">
                            <Mail size={14} style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
                            Email Address
                        </label>
                        <input
                            id="login-email"
                            className="form-input"
                            type="email"
                            placeholder="admin@secureforce.com.au"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="login-password">
                            <Lock size={14} style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
                            Password
                        </label>
                        <input
                            id="login-password"
                            className="form-input"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>

                    {showTwoFactor && (
                        <>
                            <div className="form-group animate-in">
                                <label className="form-label">
                                    {useBackupCode ? 'Backup Code' : 'Two-Factor Code'}
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={useBackupCode ? 'Enter backup code (e.g. A1B2C3D4)' : 'Enter 6-digit code'}
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value)}
                                    autoFocus
                                    style={{ textAlign: 'center', letterSpacing: useBackupCode ? 2 : 4, fontSize: '1.1rem' }}
                                    id="two-factor-code-input"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => { setUseBackupCode(!useBackupCode); setTwoFactorCode(''); }}
                                style={{
                                    background: 'none', border: 'none', color: 'var(--sf-primary)',
                                    cursor: 'pointer', fontSize: '0.82rem', padding: '4px 0', marginBottom: 8,
                                }}
                                id="toggle-backup-code"
                            >
                                {useBackupCode ? '← Use authenticator code' : 'Use a backup code instead'}
                            </button>
                        </>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        id="btn-login"
                    >
                        {loading ? 'Signing in...' : showTwoFactor ? 'Verify & Sign In' : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.78rem', color: 'var(--sf-text-muted)' }}>
                    Protected by SecureForce © {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
