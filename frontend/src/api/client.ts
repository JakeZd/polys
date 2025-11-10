/**
 * API Client - Централизованный Axios instance
 * 
 * Возможности:
 * - Автоматическое добавление токена
 * - Обработка ошибок
 * - Retry логика
 * - Request/Response interceptors
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Создаем Axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Автоматически добавляем токен из localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Логируем запросы в dev режиме
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================

apiClient.interceptors.response.use(
  (response) => {
    // Логируем успешные ответы в dev режиме
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Response ${response.status}:`, response.data);
    }

    return response;
  },
  (error: AxiosError<{ error?: string; message?: string }>) => {
    // Обработка ошибок
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;

    console.error('[API] Response error:', {
      status,
      message: errorMessage,
      url: error.config?.url,
    });

    // Обработка разных статусов
    switch (status) {
      case 401:
        // Unauthorized - удаляем токен и редиректим
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-storage');
          toast.error('Session expired. Please login again.');
          
          // Редирект на главную если не на ней
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }
        break;

      case 403:
        // Forbidden
        toast.error('Access denied');
        break;

      case 404:
        // Not found
        toast.error(errorMessage || 'Resource not found');
        break;

      case 429:
        // Too many requests
        toast.error('Too many requests. Please slow down.');
        break;

      case 500:
      case 502:
      case 503:
        // Server errors
        toast.error('Server error. Please try again later.');
        break;

      default:
        // Другие ошибки
        if (errorMessage) {
          toast.error(errorMessage);
        }
    }

    return Promise.reject(error);
  }
);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Проверка доступности API
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, {
      timeout: 5000,
    });
    return response.data.status === 'healthy';
  } catch (error) {
    console.error('[API] Health check failed:', error);
    return false;
  }
};

/**
 * Установка токена авторизации
 */
export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('auth-token', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('auth-token');
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

/**
 * Получение токена
 */
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth-token');
  }
  return null;
};

/**
 * Проверка наличия токена
 */
export const hasAuthToken = (): boolean => {
  return !!getAuthToken();
};

// ============================================
// ERROR TYPES
// ============================================

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Извлечение читаемой ошибки из Axios error
 */
export const getApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    return {
      message: error.response?.data?.error || error.response?.data?.message || error.message,
      status: error.response?.status,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'An unexpected error occurred',
  };
};

// ============================================
// RETRY LOGIC
// ============================================

/**
 * Retry функция для важных запросов
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Не повторяем при клиентских ошибках (4xx)
      if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
        throw error;
      }

      // Ждем перед следующей попыткой
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
};

export default apiClient;
