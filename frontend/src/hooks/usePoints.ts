'use client';

/**
 * Points Hooks - React Query
 * Умное управление поинтами и leaderboard
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pointsApi } from '@/api';
import { useAuthStore, useIsAuthenticated, useUser } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import type { PointsTransactionType } from '@/types';

// ============================================
// QUERIES
// ============================================

/**
 * Получение истории поинтов
 */
export function usePointsHistory(
  type?: PointsTransactionType,
  limit = 50,
  offset = 0
) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: ['points-history', type, limit, offset],
    queryFn: () => pointsApi.getPointsHistory(type, limit, offset),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

/**
 * Получение leaderboard
 */
export function useLeaderboard(limit = 100) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => pointsApi.getLeaderboard(limit),
    staleTime: 60 * 1000, // 1 минута кеш
    refetchInterval: 5 * 60 * 1000, // Обновление каждые 5 минут
  });
}

/**
 * Получение топ 10
 */
export function useTopLeaders() {
  return useQuery({
    queryKey: ['top-leaders'],
    queryFn: pointsApi.getTopLeaders,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000, // Обновление каждые 2 минуты
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Ежедневный check-in
 * С оптимистичным обновлением
 */
export function useDailyCheckin(signCheckin: () => Promise<{ message: string; signature: string }>) {
  const queryClient = useQueryClient();
  const user = useUser();
  const updatePoints = useAuthStore((state) => state.updatePoints);
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async () => {
      // Запрашиваем подпись у пользователя
      toast.loading('Please sign the message in your wallet...', { id: 'checkin' });
      const { message, signature } = await signCheckin();

      // Отправляем check-in с подписью
      toast.loading('Processing check-in...', { id: 'checkin' });
      return pointsApi.dailyCheckin(signature, message);
    },

    onSuccess: (data) => {
      // Обновляем поинты в store
      updatePoints(data.newBalance);

      // Обновляем streak
      if (user) {
        updateUser({
          lastCheckin: new Date().toISOString(),
          streakDays: data.streak,
        });
      }

      // Инвалидируем связанные queries
      queryClient.invalidateQueries({ queryKey: ['points-history'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      // Показываем успешное сообщение
      if (data.streakBonus > 0) {
        toast.success(
          `+${data.reward} points! 🔥 ${data.streak} day streak! Bonus: +${data.streakBonus}`,
          { id: 'checkin', duration: 4000 }
        );
      } else {
        toast.success(
          `+${data.reward} points! Current streak: ${data.streak} days`,
          { id: 'checkin', duration: 3000 }
        );
      }
    },

    onError: (error: any) => {
      const message = error.response?.data?.error || 'Check-in failed';
      toast.error(message, { id: 'checkin' });
    },
  });
}

/**
 * Проверка возможности check-in
 * Check-in resets at 00:00 UTC
 */
export function useCanCheckin() {
  const user = useUser();

  if (!user || !user.lastCheckin) return true;

  const lastCheckin = new Date(user.lastCheckin);
  const today = new Date();

  // Use UTC time for consistent check-in across timezones
  lastCheckin.setUTCHours(0, 0, 0, 0);
  today.setUTCHours(0, 0, 0, 0);

  return lastCheckin.getTime() !== today.getTime();
}

/**
 * Хелпер для streak информации
 */
export function useStreakInfo() {
  const user = useUser();

  if (!user) {
    return {
      currentStreak: 0,
      canCheckin: false,
      nextBonus: 7,
      daysUntilBonus: 7,
    };
  }

  const canCheckin = useCanCheckin();
  const currentStreak = user.streakDays;
  const nextBonus = Math.ceil((currentStreak + 1) / 7) * 7;
  const daysUntilBonus = nextBonus - currentStreak;

  return {
    currentStreak,
    canCheckin,
    nextBonus,
    daysUntilBonus,
  };
}

export default {
  usePointsHistory,
  useLeaderboard,
  useTopLeaders,
  useDailyCheckin,
  useCanCheckin,
  useStreakInfo,
};
