'use client';

/**
 * Auth Store Hooks - Client-side React hooks
 * Безопасные селекторы для использования в клиентских компонентах
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from './authStore.base';
import type { User } from '@/types';

// Selectors with SSR safety using useState + useEffect
export const useUser = (): User | null => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Only subscribe on client after hydration
    if (typeof window === 'undefined') return;

    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state._hasHydrated) {
        setUser(state.user);
      }
    });

    // Set initial value after mount
    const state = useAuthStore.getState();
    if (state._hasHydrated) {
      setUser(state.user);
    }

    return unsubscribe;
  }, []);

  return user;
};

export const useToken = (): string | null => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state._hasHydrated) {
        setToken(state.token);
      }
    });

    const state = useAuthStore.getState();
    if (state._hasHydrated) {
      setToken(state.token);
    }

    return unsubscribe;
  }, []);

  return token;
};

export const useIsAuthenticated = (): boolean => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state._hasHydrated) {
        setIsAuthenticated(state.isAuthenticated);
      }
    });

    const state = useAuthStore.getState();
    if (state._hasHydrated) {
      setIsAuthenticated(state.isAuthenticated);
    }

    return unsubscribe;
  }, []);

  return isAuthenticated;
};

export const useUserPoints = (): number => {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state._hasHydrated) {
        setPoints(state.user?.points ?? 0);
      }
    });

    const state = useAuthStore.getState();
    if (state._hasHydrated) {
      setPoints(state.user?.points ?? 0);
    }

    return unsubscribe;
  }, []);

  return points;
};
