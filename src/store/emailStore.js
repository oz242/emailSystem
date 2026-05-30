import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useEmailStore = create(
  persist(
    (set, get) => ({
  // === Auth ===
  authToken: localStorage.getItem('auth-token') || null,
  user: null,
  authLoading: true,
  authError: '',
  login: async (email, password) => {
    set({ authError: '' });
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('auth-token', data.token);
    set({ authToken: data.token, user: data.user, authLoading: false, authError: '' });
    return data.user;
  },
  loadCurrentUser: async () => {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      set({ authToken: null, user: null, authLoading: false });
      return null;
    }

    try {
      set({ authLoading: true });
      const { data } = await api.get('/auth/me');
      set({ authToken: token, user: data.user, authLoading: false, authError: '' });
      return data.user;
    } catch (e) {
      get().logout(e.message);
      return null;
    }
  },
  logout: (message = '') => {
    localStorage.removeItem('auth-token');
    get().stopPolling();
    set({ authToken: null, user: null, authLoading: false, authError: message });
  },

  // === Theme ===
  theme: localStorage.getItem('theme') || 'dark',
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
    set({ theme: next });
  },

  // === Toasts ===
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Date.now();
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  // === SMTP ===
  smtps: [],
  fetchSmtps: async () => {
    try {
      const { data } = await api.get('/smtp');
      set({ smtps: data.smtps || [] });
    } catch (e) { console.error(e); }
  },
  saveSmtp: async (smtpData) => {
    const { data } = await api.post('/smtp', smtpData);
    get().fetchSmtps();
    return data;
  },
  deleteSmtp: async (id) => {
    await api.delete(`/smtp/${id}`);
    get().fetchSmtps();
  },
  testSmtp: async (params) => {
    const { data } = await api.post('/smtp/test', params);
    return data;
  },

  // === Upload / Sheet Data ===
  sheetData: null,        // { headers, preview, totalRows, filePath, originalName }
  columnMap: { email: '', name: '' }, // user mapping of columns
  setSheetData: (data) => {
    console.log(data, "data49");
    set({ sheetData: data, columnMap: { email: '', name: '' } });
  },
  setColumnMap: (map) => set({ columnMap: map }),
  clearSheet: () => set({ sheetData: null, columnMap: { email: '', name: '' } }),

  // === Campaign Compose ===
  compose: {
    name: '',
    subject: '',
    body: '',
    delaySeconds: 2,
    attachments: []
  },
  setCompose: (fields) => set(s => ({ compose: { ...s.compose, ...fields } })),
  clearCompose: () => set({
    compose: { name: '', subject: '', body: '', delaySeconds: 2, attachments: [] }
  }),

  // === Campaigns List ===
  campaigns: [],
  fetchCampaigns: async () => {
    try {
      const { data } = await api.get('/campaigns');
      set({ campaigns: data.campaigns || [] });
    } catch (e) { console.error(e); }
  },

  // === Active Campaign / Dashboard ===
  activeCampaignId: null,
  campaignStatus: null,  // { status, stats, progress, liveLogs }
  pollingInterval: null,

  setActiveCampaign: (id) => {
    get().stopPolling();
    set({ activeCampaignId: id, campaignStatus: null });
    if (id) get().startPolling(id);
  },

  startPolling: (id) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/campaigns/${id}/status`);
        set({ campaignStatus: data });
        // Update campaign list with latest stats
        get().fetchCampaigns();
        // Stop polling when done
        if (['completed', 'stopped', 'failed'].includes(data.status)) {
          get().stopPolling();
        }
      } catch (e) { console.error(e); }
    }, 1500);
    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },

  // === Campaign Actions ===
  sendCampaign: async (id, delaySeconds) => {
    const { data } = await api.post(`/campaigns/${id}/send`, { delaySeconds });
    get().setActiveCampaign(id);
    get().fetchCampaigns();
    return data;
  },
  pauseCampaign: async (id) => {
    const { data } = await api.post(`/campaigns/${id}/pause`);
    return data;
  },
  resumeCampaign: async (id) => {
    const { data } = await api.post(`/campaigns/${id}/resume`);
    get().startPolling(id);
    return data;
  },
  stopCampaign: async (id) => {
    const { data } = await api.post(`/campaigns/${id}/stop`);
    get().stopPolling();
    get().fetchCampaigns();
    return data;
  },
  retryFailed: async (id, delaySeconds) => {
    const { data } = await api.post(`/campaigns/${id}/retry`, { delaySeconds });
    get().setActiveCampaign(id);
    return data;
  },
  exportFailed: async (id) => {
    const { data } = await api.get(`/campaigns/${id}/export`, { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `failed-emails-${id}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },

  // === Admin Users ===
  adminUsers: [],
  fetchAdminUsers: async () => {
    const { data } = await api.get('/admin/users');
    set({ adminUsers: data.users || [] });
    return data.users || [];
  },
  createAdminUser: async (userData) => {
    const { data } = await api.post('/admin/users', userData);
    await get().fetchAdminUsers();
    return data.user;
  },
  updateAdminUser: async (id, updates) => {
    const { data } = await api.patch(`/admin/users/${id}`, updates);
    await get().fetchAdminUsers();
    return data.user;
  }
    }),
    {
      name: 'email-store',
      partialize: (state) => ({
        authToken: state.authToken,
        user: state.user,
        sheetData: state.sheetData,
        columnMap: state.columnMap
      })
    }
  )
);

export default useEmailStore;
