'use client';

/**
 * Auth Store Hooks - Client-side React hooks
 * Безопасные селекторы для использования в клиентских компонентах
 */

import { useAuthStore } from './authStore.base';
import type { User } from '@/types';

// Selectors with SSR safety
export const useUser = (): User | null => {
  const hasHydrated = useAuthStore((state) => {
    if (typeof state === 'undefined' || state === null) return false;
    return state._hasHydrated ?? false;
  });

  const user = useAuthStore((state) => {
    if (typeof state === 'undefined' || state === null) return null;
    return state.user ?? null;
  });

  if (typeof window === 'undefined' || !hasHydrated) return null;
  return user;
};

export const useToken = (): string | null => {
  const hasHydrated = useAuthStore((state) => {
    if (typeof state === 'undefined' || state === null) return false;
    return state._hasHydrated ?? false;
  });

  const token = useAuthStore((state) => {
    if (typeof state === 'undefined' || state === null) return null;
    return state.token ?? null;
  });

  if (typeof window === 'undefined' || !hasHydrated) return null;
  return token;
};

export const useIsAuthenticated = (): boolean => {
  const hasHydrated = useAuthStore((state) => {
    if (typeof state === 'undefined' || state === null) return false;
    return state._hasHydrated ?? false;
  });

  const isAuthenticated = useAuthStore((state) => {
    if (typeof state === 'undefined' || state === null) return false;
    return state.isAuthenticated ?? false;
  });

  if (typeof window === 'undefined' || !hasHydrated) return false;
  return isAuthenticated;
};

export const useUserPoints = (): number => {
  const hasHydrated = useAuthStore((state) => {
    if (typeof state === 'undefined' || state === null) return false;
    return state._hasHydrated ?? false;
  });

  const points = useAuthStore((state) => {
    if (typeof state === 'undefined' || state === null) return 0;
    return state.user?.points ?? 0;
  });

  if (typeof window === 'undefined' || !hasHydrated) return 0;
  return points;
};
