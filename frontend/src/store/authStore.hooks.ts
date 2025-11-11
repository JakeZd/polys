'use client';

/**
 * Auth Store Hooks - Client-side React hooks
 * Безопасные селекторы для использования в клиентских компонентах
 */

import { useAuthStore } from './authStore.base';
import type { User } from '@/types';

// Selectors with SSR safety
export const useUser = (): User | null => {
  const user = useAuthStore((s) => s?.user ?? null);
  const hasHydrated = useAuthStore((s) => s?._hasHydrated ?? false);

  if (typeof window === 'undefined' || !hasHydrated) return null;
  return user;
};

export const useToken = (): string | null => {
  const token = useAuthStore((s) => s?.token ?? null);
  const hasHydrated = useAuthStore((s) => s?._hasHydrated ?? false);

  if (typeof window === 'undefined' || !hasHydrated) return null;
  return token;
};

export const useIsAuthenticated = (): boolean => {
  const isAuthenticated = useAuthStore((s) => s?.isAuthenticated ?? false);
  const hasHydrated = useAuthStore((s) => s?._hasHydrated ?? false);

  if (typeof window === 'undefined' || !hasHydrated) return false;
  return isAuthenticated;
};

export const useUserPoints = (): number => {
  const points = useAuthStore((s) => s?.user?.points ?? 0);
  const hasHydrated = useAuthStore((s) => s?._hasHydrated ?? false);

  if (typeof window === 'undefined' || !hasHydrated) return 0;
  return points;
};
