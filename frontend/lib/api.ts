import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth headers from session storage
apiClient.interceptors.request.use((config) => {
  const auth = typeof window !== 'undefined' ? localStorage.getItem('auth') : null;
  if (auth) {
    const authData = JSON.parse(auth);
    config.headers['X-User-ID'] = authData.userId;
    config.headers['X-User-Email'] = authData.email;
    config.headers['X-User-Name'] = authData.name;
    if (authData.avatar) {
      config.headers['X-User-Avatar'] = authData.avatar;
    }
  }
  return config;
});

// Types
export interface SendEmailPayload {
  senderEmail: string;
  subject: string;
  body: string;
  recipients: string[];
  delayBetweenMs?: number;
  hourlyLimit?: number;
}

export interface ScheduleEmailPayload extends SendEmailPayload {
  startTime: string;
}

export interface EmailBatch {
  id: string;
  subject: string;
  startTime: string;
  totalEmails: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

export interface EmailJob {
  id: string;
  batchId: string;
  recipientEmail: string;
  subject: string;
  sentTime: string;
  senderEmail: string;
}

export interface Sender {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

// API functions
export const emailApi = {
  send: async (payload: SendEmailPayload) => {
    const response = await apiClient.post('/emails/send', payload);
    return response.data;
  },

  schedule: async (payload: ScheduleEmailPayload) => {
    const response = await apiClient.post('/emails/schedule', payload);
    return response.data;
  },

  getScheduled: async () => {
    const response = await apiClient.get('/emails/scheduled');
    return response.data;
  },

  getSent: async (limit = 100, offset = 0) => {
    const response = await apiClient.get('/emails/sent', {
      params: { limit, offset },
    });
    return response.data;
  },

  getBatch: async (batchId: string) => {
    const response = await apiClient.get(`/emails/batch/${batchId}`);
    return response.data;
  },

  getRateLimitStatus: async (senderId?: string) => {
    const response = await apiClient.get('/emails/rate-limit-status', {
      params: { senderId },
    });
    return response.data;
  },
};

export const senderApi = {
  create: async (email: string, name?: string) => {
    const response = await apiClient.post('/senders', { email, name });
    return response.data;
  },

  list: async () => {
    const response = await apiClient.get('/senders');
    return response.data;
  },

  get: async (senderId: string) => {
    const response = await apiClient.get(`/senders/${senderId}`);
    return response.data;
  },
};

export default apiClient;
