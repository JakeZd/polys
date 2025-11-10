/**
 * Bets Hooks - React Query
 * Умное управление ставками с оптимистичными обновлениями
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { betsApi } from '@/api';
import { useIsAuthenticated, useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import type { PlaceBetRequest } from '@/types';

// ============================================
// QUERIES
// ============================================

/**
 * Получение ставок пользователя
 */
export function useMyBets(
  status?: 'active' | 'settled' | 'won' | 'lost',
  limit = 50,
  offset = 0
) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: ['my-bets', status, limit, offset],
    queryFn: () => betsApi.getMyBets(status, limit, offset),
    enabled: isAuthenticated,
    staleTime: 15 * 1000, // 15 секунд
    refetchInterval: 30 * 1000, // Авто-обновление каждые 30 секунд
  });
}

/**
 * Получение активных ставок
 */
export function useActiveBets() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: ['active-bets'],
    queryFn: betsApi.getActiveBets,
    enabled: isAuthenticated,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000, // Важно для unrealized P&L
  });
}

/**
 * Получение завершенных ставок
 */
export function useSettledBets(limit = 50, offset = 0) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: ['settled-bets', limit, offset],
    queryFn: () => betsApi.getSettledBets(limit, offset),
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // Завершенные не меняются часто
  });
}

/**
 * Получение статистики ставок
 */
export function useBetStats() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: ['bet-stats'],
    queryFn: betsApi.getBetStats,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

/**
 * Получение одной ставки
 */
export function useBet(id: string | null) {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: ['bet', id],
    queryFn: () => betsApi.getBetById(id!),
    enabled: isAuthenticated && !!id,
    staleTime: 15 * 1000,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Размещение ставки
 * С оптимистичным обновлением поинтов
 */
export function usePlaceBet() {
  const queryClient = useQueryClient();
  const { updatePoints, user } = useAuthStore();

  return useMutation({
    mutationFn: (data: PlaceBetRequest) => betsApi.placeBet(data),
    
    // Optimistic update - сразу уменьшаем поинты
    onMutate: async (variables) => {
      if (user) {
        // Сохраняем старое значение для rollback
        const previousPoints = user.points;
        
        // Оптимистично обновляем поинты
        updatePoints(user.points - variables.stake);
        
        return { previousPoints };
      }
    },
    
    // Успешное размещение
    onSuccess: (data, variables) => {
      toast.success(`Bet placed: ${variables.side} for ${variables.stake} points`);
      
      // Инвалидируем связанные queries
      queryClient.invalidateQueries({ queryKey: ['my-bets'] });
      queryClient.invalidateQueries({ queryKey: ['active-bets'] });
      queryClient.invalidateQueries({ queryKey: ['bet-stats'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    
    // Ошибка - откатываем поинты
    onError: (error: any, variables, context) => {
      if (context?.previousPoints !== undefined) {
        updatePoints(context.previousPoints);
      }
      
      const message = error.response?.data?.error || 'Failed to place bet';
      toast.error(message);
    },
  });
}

/**
 * Хелпер для быстрой ставки
 */
export function useQuickBet(marketId: string) {
  const placeBet = usePlaceBet();

  const betYes = (stake: number, entryPrice: number) => {
    return placeBet.mutate({
      marketId,
      side: 'YES',
      stake,
      entryPrice,
    });
  };

  const betNo = (stake: number, entryPrice: number) => {
    return placeBet.mutate({
      marketId,
      side: 'NO',
      stake,
      entryPrice,
    });
  };

  return {
    betYes,
    betNo,
    isLoading: placeBet.isPending,
    error: placeBet.error,
  };
}

export default {
  useMyBets,
  useActiveBets,
  useSettledBets,
  useBetStats,
  useBet,
  usePlaceBet,
  useQuickBet,
};
