// ============================================================
// Auth Context — Global authentication state + protected routes
// ============================================================
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/client';
import { UserRole } from '../types';

interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isTwoFactorEnabled: boolean;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string, twoFactorCode?: string) => Promise<any>;
    logout: () => void;
    isAdmin: boolean;
    isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing token on mount
        const token = localStorage.getItem('sf_access_token');
        if (token) {
            authApi.getProfile()
                .then((res) => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem('sf_access_token');
                    localStorage.removeItem('sf_refresh_token');
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string, twoFactorCode?: string) => {
        const { data } = await authApi.login(email, password, twoFactorCode);

        if (data.requiresTwoFactor) {
            return data; // Requires 2FA, caller handles UI
        }

        localStorage.setItem('sf_access_token', data.accessToken);
        localStorage.setItem('sf_refresh_token', data.refreshToken);
        setUser(data.user);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('sf_access_token');
        localStorage.removeItem('sf_refresh_token');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                isAdmin: user?.role === UserRole.ADMIN,
                isManager: user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
