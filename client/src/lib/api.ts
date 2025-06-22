import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    profile: '/auth/profile',
    password: '/auth/password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  
  // Dashboard
  dashboard: {
    stats: '/dashboard/stats',
    recentActivity: '/dashboard/recent-activity',
    quickActions: '/dashboard/quick-actions',
  },
  
  // Social Accounts
  social: {
    list: '/social/accounts',
    create: '/social/accounts',
    update: (id: string) => `/social/accounts/${id}`,
    delete: (id: string) => `/social/accounts/${id}`,
    connect: (platform: string) => `/social/connect/${platform}`,
    disconnect: (id: string) => `/social/accounts/${id}/disconnect`,
    sync: (id: string) => `/social/accounts/${id}/sync`,
  },
  
  // Affiliate Networks
  affiliate: {
    networks: '/affiliate/networks',
    products: '/affiliate/products',
    sync: (networkId: string) => `/affiliate/networks/${networkId}/sync`,
  },
  
  // Campaigns
  campaigns: {
    list: '/campaigns',
    create: '/campaigns',
    update: (id: string) => `/campaigns/${id}`,
    delete: (id: string) => `/campaigns/${id}`,
    duplicate: (id: string) => `/campaigns/${id}/duplicate`,
    activate: (id: string) => `/campaigns/${id}/activate`,
    pause: (id: string) => `/campaigns/${id}/pause`,
  },
  
  // Affiliate Links
  links: {
    list: '/affiliate-links',
    create: '/affiliate-links',
    update: (id: string) => `/affiliate-links/${id}`,
    delete: (id: string) => `/affiliate-links/${id}`,
    generate: '/affiliate-links/generate',
    qrCode: (id: string) => `/affiliate-links/${id}/qr-code`,
  },
  
  // Analytics
  analytics: {
    overview: '/analytics/overview',
    campaigns: '/analytics/campaigns',
    links: '/analytics/links',
    social: '/analytics/social',
    geographic: '/analytics/geographic',
    device: '/analytics/device',
    timeline: '/analytics/timeline',
  },
  
  // Earnings
  earnings: {
    overview: '/earnings/overview',
    history: '/earnings/history',
    networks: '/earnings/networks',
    payouts: '/earnings/payouts',
  },
  
  // Settings
  settings: {
    profile: '/settings/profile',
    subscription: '/settings/subscription',
    integrations: '/settings/integrations',
    notifications: '/settings/notifications',
    security: '/settings/security',
  },
  
  // AI
  ai: {
    generateContent: '/ai/generate-content',
    optimizeContent: '/ai/optimize-content',
    suggestHashtags: '/ai/suggest-hashtags',
    analyzePerformance: '/ai/analyze-performance',
  },
  
  // Webhooks
  webhooks: {
    stripe: '/webhooks/stripe',
    clickbank: '/webhooks/clickbank',
    amazon: '/webhooks/amazon',
  },
};

// Helper functions for common API operations
export const apiHelpers = {
  // Get data with error handling
  async get<T>(url: string, params?: any): Promise<T> {
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Post data with error handling
  async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Put data with error handling
  async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Delete with error handling
  async delete<T>(url: string): Promise<T> {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Handle API errors
  handleError(error: any) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return new Error(data?.error || `HTTP ${status}: ${data?.message || 'Unknown error'}`);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error: No response received');
    } else {
      // Something else happened
      return new Error(error.message || 'Unknown error occurred');
    }
  },
};

export default api; 