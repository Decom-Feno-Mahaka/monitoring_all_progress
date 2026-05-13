import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Request interceptor — attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — refresh token on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason: any) => void }> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (!refreshToken) {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        const { accessToken, refreshToken: newRefresh } = res.data;
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', newRefresh);
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err as AxiosError, null);
        localStorage.clear();
        window.location.href = '/auth/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

// ===== API FUNCTIONS =====
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const projectsApi = {
  getPublic: (params?: Record<string, any>) => api.get('/projects/public', { params }),
  getPublicOne: (slug: string) => api.get(`/projects/public/${slug}`),
  getAll: (params?: Record<string, any>) => api.get('/projects', { params }),
  getOne: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getProgressHistory: (id: string) => api.get(`/projects/${id}/progress-history`),
};

export const milestonesApi = {
  getAll: (projectId: string) => api.get(`/projects/${projectId}/milestones`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/milestones`, data),
  update: (projectId: string, id: string, data: any) => api.patch(`/projects/${projectId}/milestones/${id}`, data),
  delete: (projectId: string, id: string) => api.delete(`/projects/${projectId}/milestones/${id}`),
  reorder: (projectId: string, ids: string[]) => api.post(`/projects/${projectId}/milestones/reorder`, { ids }),
};

export const activitiesApi = {
  getAll: (projectId: string, params?: Record<string, any>) =>
    api.get(`/projects/${projectId}/activities`, { params }),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/activities`, data),
  delete: (projectId: string, id: string) => api.delete(`/projects/${projectId}/activities/${id}`),
  addEvidence: (projectId: string, activityId: string, evidences: any[]) =>
    api.post(`/projects/${projectId}/activities/${activityId}/evidences`, { evidences }),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getTrends: (days?: number) => api.get('/analytics/trends', { params: { days } }),
  getHeatmap: (days?: number) => api.get('/analytics/heatmap', { params: { days } }),
  getMilestones: () => api.get('/analytics/milestones'),
};

export const uploadsApi = {
  uploadFile: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/uploads/file', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
