'use client';

/**
 * Auth Store Hooks - Client-side React hooks
 * Безопасные селекторы для использования в клиентских компонентах
 */

import { useAuthStore } from './authStore.base';
import type { User } from '@/types';

// Селектор гидрации - самый базовый
export const useHasHydrated = () =>
  useAuthStore((s) => s?._hasHydrated ?? false);

// Простые селекторы с проверкой гидрации
export const useIsAuthenticated = () =>
  useAuthStore((s) => (s?._hasHydrated ? Boolean(s.isAuthenticated) : false));

export const useUser = (): User | null =>
  useAuthStore((s) => (s?._hasHydrated ? s.user : null));

export const useToken = (): string | null =>
  useAuthStore((s) => (s?._hasHydrated ? s.token : null));

export const useUserPoints = (): number =>
  useAuthStore((s) => (s?._hasHydrated ? (s.user?.points ?? 0) : 0));
