'use client';

/**
 * Auth Store Hooks - Client-side React hooks
 * Безопасные селекторы для использования в клиентских компонентах
 */

import { useAuthStore } from './authStore.base';
import type { User } from '@/types';

// Селектор гидрации - самый базовый
export const useHasHydrated = () =>
  useAuthStore((s) => Boolean(s?._hasHydrated));

// Селекторы с проверкой гидрации - возвращают только примитивы
export const useIsAuthenticated = () => {
  const hydrated = useHasHydrated();
  // До гидрации всегда false, чтобы ничего не рушилось
  if (typeof window === 'undefined' || !hydrated) return false;
  return useAuthStore((s) => Boolean(s?.isAuthenticated));
};

export const useUser = (): User | null => {
  const hydrated = useHasHydrated();
  if (typeof window === 'undefined' || !hydrated) return null;
  return useAuthStore((s) => s?.user ?? null);
};

export const useToken = (): string | null => {
  const hydrated = useHasHydrated();
  if (typeof window === 'undefined' || !hydrated) return null;
  return useAuthStore((s) => s?.token ?? null);
};

export const useUserPoints = (): number => {
  const hydrated = useHasHydrated();
  if (typeof window === 'undefined' || !hydrated) return 0;
  return useAuthStore((s) => s?.user?.points ?? 0);
};
