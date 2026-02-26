// ============================================================
// API Client — Axios instance with JWT interceptor
// ============================================================
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : '/api/v1';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('sf_access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 — auto-refresh or redirect to login
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('sf_refresh_token');

            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
                    localStorage.setItem('sf_access_token', data.accessToken);
                    localStorage.setItem('sf_refresh_token', data.refreshToken);
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                    return api(originalRequest);
                } catch {
                    localStorage.removeItem('sf_access_token');
                    localStorage.removeItem('sf_refresh_token');
                    window.location.href = '/login';
                }
            } else {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    },
);

// ── Auth endpoints ──
export const authApi = {
    login: (email: string, password: string, twoFactorCode?: string) =>
        api.post('/auth/login', { email, password, twoFactorCode }),
    register: (data: any) => api.post('/auth/register', data),
    refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
    getProfile: () => api.get('/auth/me'),
    enable2FA: () => api.post('/auth/2fa/enable'),
    verify2FA: (code: string) => api.post('/auth/2fa/verify', { code }),
};

// ── Users endpoints ──
export const usersApi = {
    getAll: (page = 1, limit = 20) => api.get(`/users?page=${page}&limit=${limit}`),
    getOne: (id: string) => api.get(`/users/${id}`),
    update: (id: string, data: any) => api.put(`/users/${id}`, data),
    deactivate: (id: string) => api.delete(`/users/${id}`),
    getStats: () => api.get('/users/stats'),
    invite: (data: any) => api.post('/users/invite', data),
    updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
    reactivate: (id: string) => api.patch(`/users/${id}/reactivate`),
};

// ── Shifts endpoints ──
export const shiftsApi = {
    create: (data: any) => api.post('/shifts', data),
    getAll: (page = 1, limit = 20, filters?: any) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (filters?.userId) params.set('userId', filters.userId);
        if (filters?.status) params.set('status', filters.status);
        return api.get(`/shifts?${params}`);
    },
    getOne: (id: string) => api.get(`/shifts/${id}`),
    getUpcoming: () => api.get('/shifts/my-upcoming'),
    getByRange: (start: string, end: string) => api.get(`/shifts/range?start=${start}&end=${end}`),
    update: (id: string, data: any) => api.put(`/shifts/${id}`, data),
    cancel: (id: string) => api.delete(`/shifts/${id}`),
    getStats: () => api.get('/shifts/stats'),
    getOpen: () => api.get('/shifts/open'),
    accept: (id: string) => api.post(`/shifts/${id}/accept`),
    decline: (id: string) => api.post(`/shifts/${id}/decline`),
    getAssignments: (page = 1, limit = 20, filters?: { status?: string; showOpen?: boolean }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (filters?.status) params.set('status', filters.status);
        if (filters?.showOpen) params.set('showOpen', 'true');
        return api.get(`/shifts/assignments?${params}`);
    },
    assign: (shiftId: string, userId: string) => api.post(`/shifts/${shiftId}/assign`, { userId }),
};

// ── Locations endpoints ──
export const locationsApi = {
    create: (data: any) => api.post('/locations', data),
    getAll: (page = 1, limit = 20) => api.get(`/locations?page=${page}&limit=${limit}`),
    getOne: (id: string) => api.get(`/locations/${id}`),
    update: (id: string, data: any) => api.put(`/locations/${id}`, data),
    remove: (id: string) => api.delete(`/locations/${id}`),
};

// ── CheckIns endpoints ──
export const checkinsApi = {
    create: (data: any) => api.post('/checkins', data),
    getAll: (page = 1, limit = 20) => api.get(`/checkins?page=${page}&limit=${limit}`),
    getFlagged: (page = 1, limit = 20) => api.get(`/checkins/flagged?page=${page}&limit=${limit}`),
    getByShift: (shiftId: string) => api.get(`/checkins/shift/${shiftId}`),
    updateVerification: (id: string, status: string, notes?: string) =>
        api.put(`/checkins/${id}/verify`, { status, notes }),
};

// ── Reports endpoints ──
export const reportsApi = {
    create: (data: any) => api.post('/reports', data),
    getAll: (page = 1, limit = 20, filters?: any) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (filters?.type) params.set('type', filters.type);
        if (filters?.priority) params.set('priority', filters.priority);
        return api.get(`/reports?${params}`);
    },
    getOne: (id: string) => api.get(`/reports/${id}`),
    getStats: () => api.get('/reports/stats'),
};

// ── Audit endpoints ──
export const auditApi = {
    getAll: (page = 1, limit = 50) => api.get(`/audit?page=${page}&limit=${limit}`),
};

// ── Health ──
export const healthApi = {
    check: () => api.get('/health'),
};

// ── Compliance endpoints (Phase 2) ──
export const complianceApi = {
    getLicenses: () => api.get('/compliance/licenses'),
    getLicensesByUser: (userId: string) => api.get(`/compliance/licenses/user/${userId}`),
    createLicense: (data: any) => api.post('/compliance/licenses', data),
    updateLicense: (id: string, data: any) => api.put(`/compliance/licenses/${id}`, data),
    deleteLicense: (id: string) => api.delete(`/compliance/licenses/${id}`),
    getViolations: (resolved?: boolean, userId?: string) => {
        const params = new URLSearchParams();
        if (resolved !== undefined) params.set('resolved', String(resolved));
        if (userId) params.set('userId', userId);
        return api.get(`/compliance/violations?${params}`);
    },
    resolveViolation: (id: string, notes?: string) => api.post(`/compliance/violations/${id}/resolve`, { notes }),
    runScan: () => api.post('/compliance/scan'),
    getStats: () => api.get('/compliance/stats'),
};

// ── Incidents endpoints (Phase 2) ──
export const incidentsApi = {
    create: (data: any) => api.post('/incidents', data),
    getAll: (filters?: { status?: string; severity?: string; locationId?: string }) => {
        const params = new URLSearchParams();
        if (filters?.status) params.set('status', filters.status);
        if (filters?.severity) params.set('severity', filters.severity);
        if (filters?.locationId) params.set('locationId', filters.locationId);
        return api.get(`/incidents?${params}`);
    },
    getOne: (id: string) => api.get(`/incidents/${id}`),
    getStats: () => api.get('/incidents/stats'),
    acknowledge: (id: string) => api.post(`/incidents/${id}/acknowledge`),
    assign: (id: string, assignedToId: string) => api.post(`/incidents/${id}/assign`, { assignedToId }),
    updateStatus: (id: string, status: string, comment?: string) => api.put(`/incidents/${id}/status`, { status, comment }),
    escalate: (id: string) => api.post(`/incidents/${id}/escalate`),
    addNote: (id: string, comment: string) => api.post(`/incidents/${id}/notes`, { comment }),
    checkSla: () => api.post('/incidents/sla/check'),
};

// ── Sessions endpoints (Phase 2) ──
export const sessionsApi = {
    getMySessions: () => api.get('/sessions'),
    revokeSession: (id: string) => api.delete(`/sessions/${id}`),
    revokeAll: () => api.post('/sessions/revoke-all'),
};

// ── Tenant endpoints (Phase 3) ──
export const tenantApi = {
    getMyTenant: () => api.get('/tenants/my'),
    updateMyTenant: (data: any) => api.put('/tenants/my', data),
};

// ── Clients endpoints (Phase 3) ──
export const clientsApi = {
    getAll: (page = 1, limit = 20) => api.get(`/clients?page=${page}&limit=${limit}`),
    getOne: (id: string) => api.get(`/clients/${id}`),
    create: (data: any) => api.post('/clients', data),
    update: (id: string, data: any) => api.put(`/clients/${id}`, data),
    deactivate: (id: string) => api.delete(`/clients/${id}`),
    getStats: () => api.get('/clients/stats'),
};

// ── Analytics endpoints (Phase 4) ──
export const analyticsApi = {
    getDashboard: () => api.get('/analytics/dashboard'),
    getTrends: (period: '7d' | '30d' | '90d' = '7d') =>
        api.get(`/analytics/trends?period=${period}`),
};

// ── Notifications endpoints (Phase 4) ──
export const notificationsApi = {
    getAll: (page = 1, limit = 20) =>
        api.get(`/notifications?page=${page}&limit=${limit}`),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch('/notifications/read-all'),
};

// ── Enhanced Reports endpoints (Phase 4) ──
export const enhancedReportsApi = {
    getComplianceReport: () => api.get('/reports/compliance'),
    getIncidentSummary: (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        return api.get(`/reports/incidents?${params}`);
    },
    getCoverageAnalysis: () => api.get('/reports/coverage'),
};

export default api;

