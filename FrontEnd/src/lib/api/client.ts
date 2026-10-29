import axios from 'axios';
import { useAuthStore } from '../../stores/auth.store';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  config.headers.Accept = 'application/json';
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as typeof error.config & { _retry?: boolean };
    const isRefreshRequest = request?.url?.endsWith('/auth/refresh');

    if (error.response?.status !== 401 || request?._retry || isRefreshRequest) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      const response = await apiClient.post<{ data: { accessToken: string } }>(
        '/auth/refresh',
      );
      useAuthStore.getState().setAccessToken(response.data.data.accessToken);
      return apiClient(request);
    } catch (refreshError) {
      useAuthStore.getState().reset();
      return Promise.reject(refreshError);
    }
  },
);
