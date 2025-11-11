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
// ВАЖНО: Все проверки внутри селектора, чтобы не нарушать правила хуков
export const useIsAuthenticated = () => {
  return useAuthStore((s) => {
    if (typeof window === 'undefined') return false;
    if (!s?._hasHydrated) return false;
    return Boolean(s?.isAuthenticated);
  });
};

export const useUser = (): User | null => {
  return useAuthStore((s) => {
    if (typeof window === 'undefined') return null;
    if (!s?._hasHydrated) return null;
    return s?.user ?? null;
  });
};

export const useToken = (): string | null => {
  return useAuthStore((s) => {
    if (typeof window === 'undefined') return null;
    if (!s?._hasHydrated) return null;
    return s?.token ?? null;
  });
};

export const useUserPoints = (): number => {
  return useAuthStore((s) => {
    if (typeof window === 'undefined') return 0;
    if (!s?._hasHydrated) return 0;
    return s?.user?.points ?? 0;
  });
};
