// src/api/axiosInstance.js
import axios from 'axios';

// In-memory token — never written to storage, not readable by XSS
let _accessToken = null;

export const setToken   = (token) => { _accessToken = token; };
export const clearToken = ()      => { _accessToken = null; };
export const getToken   = ()      => _accessToken;

const api = axios.create({
  baseURL: 'https://tahfeez-production.up.railway.app/api',
  withCredentials: true, // sends httpOnly refresh token cookie
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach access token from memory on every request
api.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Silently refresh access token on 401, retry original request once
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    const isAuthEndpoint =
      original.url?.includes('/auth/login') ||
      original.url?.includes('/auth/register') ||
      original.url?.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh-token');
        const newToken = data.data.accessToken;
        setToken(newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearToken();
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;