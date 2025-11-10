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

// Selectors with SSR safety - combine state reads to avoid double subscription
export const useUser = () => {
  // Check if we're in SSR
  if (typeof window === 'undefined') return null;

  try {
    const state = useAuthStore((state) => {
      if (!state) return { user: null, hasHydrated: false };
      return {
        user: state.user,
        hasHydrated: state._hasHydrated
      };
    });

    // During SSR or before hydration, return null
    if (!state || !state.hasHydrated) return null;
    return state.user;
  } catch (error) {
    console.error('Error in useUser:', error);
    return null;
  }
};

export const useToken = () => {
  // Check if we're in SSR
  if (typeof window === 'undefined') return null;

  try {
    const state = useAuthStore((state) => {
      if (!state) return { token: null, hasHydrated: false };
      return {
        token: state.token,
        hasHydrated: state._hasHydrated
      };
    });

    if (!state || !state.hasHydrated) return null;
    return state.token;
  } catch (error) {
    console.error('Error in useToken:', error);
    return null;
  }
};

export const useIsAuthenticated = () => {
  // Check if we're in SSR
  if (typeof window === 'undefined') return false;

  try {
    const state = useAuthStore((state) => {
      if (!state) return { isAuthenticated: false, hasHydrated: false };
      return {
        isAuthenticated: state.isAuthenticated,
        hasHydrated: state._hasHydrated
      };
    });

    if (!state || !state.hasHydrated) return false;
    return state.isAuthenticated;
  } catch (error) {
    console.error('Error in useIsAuthenticated:', error);
    return false;
  }
};

export const useUserPoints = () => {
  // Check if we're in SSR
  if (typeof window === 'undefined') return 0;

  try {
    const state = useAuthStore((state) => {
      if (!state) return { points: 0, hasHydrated: false };
      return {
        points: state.user?.points ?? 0,
        hasHydrated: state._hasHydrated
      };
    });

    if (!state || !state.hasHydrated) return 0;
    return state.points;
  } catch (error) {
    console.error('Error in useUserPoints:', error);
    return 0;
  }
};

export default useAuthStore;
