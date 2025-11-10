/**
 * Auth Store - Zustand
 * Управление состоянием авторизации
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { setAuthToken } from '@/api';
import type { User } from '@/types';
import { useEffect, useState } from 'react';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (token: string, user: Partial<User> & { id: string; wallet: string; points: number }) => void;
  logout: () => void;
  updatePoints: (points: number) => void;
  updateUser: (updates: Partial<User>) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      // Set user
      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      // Set token
      setToken: (token) => {
        setAuthToken(token);
        set({ token, isAuthenticated: true });
      },

      // Login
      login: (token, user) => {
        setAuthToken(token);
        // Fill in missing fields with defaults
        const fullUser: User = {
          id: user.id,
          wallet: user.wallet,
          points: user.points,
          createdAt: user.createdAt || new Date().toISOString(),
          lastCheckin: user.lastCheckin || null,
          streakDays: user.streakDays || 0,
          stats: user.stats,
        };
        set({
          token,
          user: fullUser,
          isAuthenticated: true,
        });
      },

      // Logout
      logout: () => {
        setAuthToken(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      // Update points
      updatePoints: (points) => {
        const user = get().user;
        if (user) {
          set({
            user: { ...user, points },
          });
        }
      },

      // Update user
      updateUser: (updates) => {
        const user = get().user;
        if (user) {
          set({
            user: { ...user, ...updates },
          });
        }
      },

      // Set hydration state
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selectors with SSR safety - simple client-side check
export const useUser = () => {
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  // During SSR or before hydration, return null
  if (typeof window === 'undefined' || !hasHydrated) return null;
  return user;
};

export const useToken = () => {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  if (typeof window === 'undefined' || !hasHydrated) return null;
  return token;
};

export const useIsAuthenticated = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  if (typeof window === 'undefined' || !hasHydrated) return false;
  return isAuthenticated;
};

export const useUserPoints = () => {
  const points = useAuthStore((state) => state.user?.points ?? 0);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  if (typeof window === 'undefined' || !hasHydrated) return 0;
  return points;
};

export default useAuthStore;
