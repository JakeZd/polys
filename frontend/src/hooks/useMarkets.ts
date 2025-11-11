/**
 * Markets Hooks - React Query
 * Умное управление данными рынков с кешированием
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { marketsApi } from '@/api';
import type { MarketFilters, ChartPeriod } from '@/types';

// ============================================
// QUERIES
// ============================================

/**
 * Получение списка рынков
 * С автоматическим кешированием на 30 секунд
 */
export function useMarkets(filters?: MarketFilters) {
  return useQuery({
    queryKey: ['markets', filters],
    queryFn: () => marketsApi.getMarkets(filters),
    staleTime: 30 * 1000, // 30 секунд кеш
    refetchInterval: 60 * 1000, // Авто-обновление каждую минуту
  });
}

/**
 * Получение одного рынка
 */
export function useMarket(id: string | null) {
  return useQuery({
    queryKey: ['market', id],
    queryFn: () => marketsApi.getMarketById(id!),
    enabled: !!id,
    staleTime: 15 * 1000, // 15 секунд кеш
    refetchInterval: 30 * 1000, // Авто-обновление каждые 30 секунд
  });
}

/**
 * Получение истории цен
 */
export function useMarketPrices(id: string | null, period: ChartPeriod = '24h') {
  return useQuery({
    queryKey: ['market-prices', id, period],
    queryFn: () => marketsApi.getMarketPrices(id!, period),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 минута кеш
  });
}

/**
 * Получение категорий
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: marketsApi.getCategories,
    staleTime: 5 * 60 * 1000, // 5 минут кеш
  });
}

/**
 * Поиск рынков
 */
export function useSearchMarkets(query: string, limit = 20) {
  return useQuery({
    queryKey: ['search-markets', query, limit],
    queryFn: () => marketsApi.searchMarkets(query, limit),
    enabled: typeof query === 'string' && query !== '',
    staleTime: 30 * 1000,
  });
}

/**
 * Получение рынков по категории
 */
export function useMarketsByCategory(category: string, limit = 50) {
  return useQuery({
    queryKey: ['markets-by-category', category, limit],
    queryFn: () => marketsApi.getMarketsByCategory(category, limit),
    enabled: !!category,
    staleTime: 30 * 1000,
  });
}

/**
 * Получение активных рынков
 */
export function useActiveMarkets(limit = 50) {
  return useQuery({
    queryKey: ['active-markets', limit],
    queryFn: () => marketsApi.getActiveMarkets(limit),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Получение результатов AI ставок (resolved markets)
 */
export function useMarketResults(category?: string, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['market-results', category, limit, offset],
    queryFn: () => marketsApi.getMarketResults(category, limit, offset),
    staleTime: 2 * 60 * 1000, // 2 минуты кеш (resolved markets don't change often)
  });
}

/**
 * Infinite scroll для рынков
 */
export function useInfiniteMarkets(filters?: Omit<MarketFilters, 'offset'>) {
  return useInfiniteQuery({
    queryKey: ['infinite-markets', filters],
    queryFn: ({ pageParam = 0 }) =>
      marketsApi.getMarkets({ ...filters, offset: pageParam, limit: 20 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const nextOffset = allPages.length * 20;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
    staleTime: 30 * 1000,
  });
}

// ============================================
// PREFETCH HELPERS
// ============================================

/**
 * Prefetch рынка для быстрого открытия
 */
export function usePrefetchMarket() {
  // Можно использовать в onMouseEnter для prefetch
  return (id: string) => {
    // Реализация prefetch через queryClient если нужно
  };
}

export default {
  useMarkets,
  useMarket,
  useMarketPrices,
  useCategories,
  useSearchMarkets,
  useMarketsByCategory,
  useActiveMarkets,
  useMarketResults,
  useInfiniteMarkets,
};
