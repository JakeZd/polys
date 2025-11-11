'use client';

/**
 * Auth Hooks - React Query
 * Умное управление данными авторизации с кешированием
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api';
import { useAuthStore, useIsAuthenticated, useToken } from '@/store/authStore';
import { toast } from 'react-hot-toast';

// ============================================
// QUERIES
// ============================================

/**
 * Получение профиля пользователя
 */
export function useProfile() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 секунд
  });
}

/**
 * Проверка токена
 */
export function useCheckToken() {
  const token = useToken();

  return useQuery({
    queryKey: ['check-token'],
    queryFn: authApi.checkToken,
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Генерация сообщения для подписи
 */
export function useGenerateMessage() {
  return useMutation({
    mutationFn: (wallet: string) => authApi.generateMessage(wallet),
  });
}

/**
 * Проверка подписи и авторизация
 */
export function useVerifySignature() {
  const login = useAuthStore((state) => state.login);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      wallet,
      signature,
      message,
    }: {
      wallet: string;
      signature: string;
      message: string;
    }) => authApi.verifySignature(wallet, signature, message),
    onSuccess: (data) => {
      login(data.token, data.user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(data.user.isNew ? 'Welcome to PolySynapse!' : 'Welcome back!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Authentication failed');
    },
  });
}

/**
 * Упрощенная авторизация (dev only)
 */
export function useSimpleAuth() {
  const login = useAuthStore((state) => state.login);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wallet: string) => authApi.simpleAuth(wallet),
    onSuccess: (data) => {
      login(data.token, data.user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(data.user.isNew ? 'Account created!' : 'Logged in!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Login failed');
    },
  });
}

/**
 * Logout
 */
export function useLogout() {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logout();
      queryClient.clear(); // Очищаем весь кеш
      toast.success('Logged out successfully');
    },
  });
}

export default {
  useProfile,
  useCheckToken,
  useGenerateMessage,
  useVerifySignature,
  useSimpleAuth,
  useLogout,
};
