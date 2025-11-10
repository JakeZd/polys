/**
 * Auth API - Методы аутентификации
 */

import apiClient from './client';
import type { AuthResponse, AuthMessage, User } from '@/types';

export const authApi = {
  /**
   * Генерация сообщения для подписи
   */
  generateMessage: async (wallet: string): Promise<AuthMessage> => {
    const response = await apiClient.post<AuthMessage>('/auth/message', { wallet });
    return response.data;
  },

  /**
   * Проверка подписи и авторизация
   */
  verifySignature: async (
    wallet: string,
    signature: string,
    message: string
  ): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/verify', {
      wallet,
      signature,
      message,
    });
    return response.data;
  },

  /**
   * Упрощенная авторизация (только для development!)
   */
  simpleAuth: async (wallet: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/simple', { wallet });
    return response.data;
  },

  /**
   * Получение профиля текущего пользователя
   */
  getProfile: async (): Promise<{ success: boolean; user: User }> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  /**
   * Logout
   */
  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  /**
   * Проверка валидности токена
   */
  checkToken: async (): Promise<{
    success: boolean;
    user: { id: string; wallet: string; points: number };
  }> => {
    const response = await apiClient.get('/auth/check');
    return response.data;
  },
};

export default authApi;
