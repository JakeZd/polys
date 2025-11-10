/**
 * React Query Provider
 * Настройка и провайдер для React Query
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Стандартные настройки для всех queries
            staleTime: 30 * 1000, // 30 секунд
            gcTime: 5 * 60 * 1000, // 5 минут (было cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            refetchOnReconnect: true,
          },
          mutations: {
            // Стандартные настройки для всех mutations
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}

export default QueryProvider;
