import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001';

export const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Cache-Control': 'no-cache',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.detail ?? error.message;
      return Promise.reject(new Error(message));
    }
    if (error.request) {
      return Promise.reject(new Error('网络请求失败，请检查服务器是否可用。'));
    }
    return Promise.reject(error);
  },
);
