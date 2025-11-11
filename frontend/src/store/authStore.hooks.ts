'use client';

/**
 * Auth Store Hooks - Client-side React hooks
 * Безопасные селекторы для использования в клиентских компонентах
 */

import { useAuthStore } from './authStore.base';
import type { User } from '@/types';

// Selectors with SSR safety
export const useUser = (): User | null => {
  const user = useAuthStore((state) => state?.user ?? null);
  const hasHydrated = useAuthStore((state) => state?._hasHydrated ?? false);

  // During SSR or before hydration, return null
  if (typeof window === 'undefined' || !hasHydrated) {
    return null;
  }

  return user;
};

export const useToken = (): string | null => {
  const token = useAuthStore((state) => state?.token ?? null);
  const hasHydrated = useAuthStore((state) => state?._hasHydrated ?? false);

  if (typeof window === 'undefined' || !hasHydrated) {
    return null;
  }

  return token;
};

export const useIsAuthenticated = (): boolean => {
  const isAuthenticated = useAuthStore((state) => state?.isAuthenticated ?? false);
  const hasHydrated = useAuthStore((state) => state?._hasHydrated ?? false);

  if (typeof window === 'undefined' || !hasHydrated) {
    return false;
  }

  return isAuthenticated;
};

export const useUserPoints = (): number => {
  const points = useAuthStore((state) => state?.user?.points ?? 0);
  const hasHydrated = useAuthStore((state) => state?._hasHydrated ?? false);

  if (typeof window === 'undefined' || !hasHydrated) {
    return 0;
  }

  return points;
};
