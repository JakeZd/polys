'use client';

/**
 * Auth Store Hooks - Client-side React hooks
 * Безопасные селекторы для использования в клиентских компонентах
 */

import { useAuthStore } from './authStore.base';
import type { User } from '@/types';

// Selectors with SSR safety
export const useUser = (): User | null => {
  const { user, _hasHydrated } = useAuthStore((state) => ({
    user: state?.user ?? null,
    _hasHydrated: state?._hasHydrated ?? false,
  }));

  // During SSR or before hydration, return null
  if (typeof window === 'undefined' || !_hasHydrated) {
    return null;
  }

  return user;
};

export const useToken = (): string | null => {
  const { token, _hasHydrated } = useAuthStore((state) => ({
    token: state?.token ?? null,
    _hasHydrated: state?._hasHydrated ?? false,
  }));

  if (typeof window === 'undefined' || !_hasHydrated) {
    return null;
  }

  return token;
};

export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated, _hasHydrated } = useAuthStore((state) => ({
    isAuthenticated: state?.isAuthenticated ?? false,
    _hasHydrated: state?._hasHydrated ?? false,
  }));

  if (typeof window === 'undefined' || !_hasHydrated) {
    return false;
  }

  return isAuthenticated;
};

export const useUserPoints = (): number => {
  const { points, _hasHydrated } = useAuthStore((state) => ({
    points: state?.user?.points ?? 0,
    _hasHydrated: state?._hasHydrated ?? false,
  }));

  if (typeof window === 'undefined' || !_hasHydrated) {
    return 0;
  }

  return points;
};
