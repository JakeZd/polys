/**
 * ПРИМЕР: Переделка компонента Markets
 * 
 * Показывает КАК использовать новую архитектуру
 * Дизайн и стили НЕ МЕНЯЮТСЯ!
 */

// ============================================
// ❌ БЫЛО (старый код)
// ============================================

/*
import { useState, useEffect } from 'react';

export function MarketsOld() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/markets');
      const data = await res.json();
      setMarkets(data.markets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="markets-container">
      <h1>Markets</h1>
      <div className="markets-grid">
        {markets.map(market => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </div>
  );
}
*/

// ============================================
// ✅ СТАЛО (новый код с TypeScript + React Query)
// ============================================

import { useMarkets } from '@/hooks/useMarkets';
import { MarketCard } from '@/components/MarketCard';
import type { Market } from '@/types';

export function MarketsNew() {
  // React Query автоматически управляет loading, error, cache!
  const { data, isLoading, isError, error } = useMarkets();

  if (isLoading) return <div className="loading">Loading...</div>;
  if (isError) return <div className="error">{error.message}</div>;

  return (
    <div className="markets-container"> {/* ТОЧНО ТАКОЙ ЖЕ КЛАСС! */}
      <h1>Markets</h1>
      <div className="markets-grid"> {/* ТОЧНО ТАКОЙ ЖЕ КЛАСС! */}
        {data?.markets.map((market: Market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// 🎯 ЧТО ИЗМЕНИЛОСЬ:
// ============================================

/**
 * 1. TypeScript типы - market теперь типизирован
 * 2. useMarkets hook - заменяет весь fetch код
 * 3. Автоматический кеш - не нужно refetch
 * 4. Авто-обновление - каждые 60 секунд
 * 5. NO UI CHANGES - классы остались те же!
 */

// ============================================
// ПРИМЕР 2: Размещение ставки
// ============================================

// ❌ БЫЛО
/*
const placeBet = async (marketId, side, stake) => {
  setLoading(true);
  try {
    const res = await fetch('http://localhost:4000/api/bets/place', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ marketId, side, stake, entryPrice: 0.5 })
    });
    const data = await res.json();
    if (data.success) {
      alert('Bet placed!');
      // Нужно вручную обновить все данные...
    }
  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};
*/

// ✅ СТАЛО
import { usePlaceBet } from '@/hooks/useBets';

export function BetButton({ marketId, side, entryPrice }: BetButtonProps) {
  const { mutate: placeBet, isPending } = usePlaceBet();

  const handleBet = () => {
    placeBet({
      marketId,
      side,
      stake: 100,
      entryPrice,
    });
    // React Query автоматически:
    // - Показывает toast уведомление
    // - Обновляет поинты оптимистично
    // - Инвалидирует все связанные queries
    // - Обрабатывает ошибки
  };

  return (
    <button 
      onClick={handleBet}
      disabled={isPending}
      className="bet-button" // СТИЛЬ НЕ МЕНЯЕТСЯ!
    >
      {isPending ? 'Placing...' : `Bet ${side}`}
    </button>
  );
}

// ============================================
// ПРИМЕР 3: Авторизация
// ============================================

// ❌ БЫЛО
/*
const login = async (wallet) => {
  const res = await fetch('http://localhost:4000/api/auth/simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet })
  });
  const data = await res.json();
  if (data.success) {
    localStorage.setItem('token', data.token);
    setUser(data.user);
  }
};
*/

// ✅ СТАЛО
import { useSimpleAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

export function LoginButton() {
  const { mutate: login, isPending } = useSimpleAuth();
  const { user } = useAuthStore();

  const handleLogin = () => {
    login('0x1234...'); // React Query + Zustand автоматически всё делают!
  };

  if (user) {
    return <div>Logged in: {user.wallet}</div>;
  }

  return (
    <button onClick={handleLogin} disabled={isPending}>
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

// ============================================
// ПРИМЕР 4: Check-in с оптимистичным обновлением
// ============================================

import { useDailyCheckin, useCanCheckin } from '@/hooks/usePoints';
import { useUserPoints } from '@/store/authStore';

export function CheckinButton() {
  const { mutate: checkin, isPending } = useDailyCheckin();
  const canCheckin = useCanCheckin();
  const points = useUserPoints();

  return (
    <div>
      <p>Points: {points}</p>
      <button 
        onClick={() => checkin()}
        disabled={!canCheckin || isPending}
      >
        {isPending ? 'Checking in...' : 'Daily Check-in'}
      </button>
    </div>
  );
}

// ============================================
// 🎁 ЧТО ВЫ ПОЛУЧАЕТЕ:
// ============================================

/**
 * 1. ✅ Меньше кода - hooks делают всё
 * 2. ✅ Автоматический кеш - быстрее работает
 * 3. ✅ TypeScript - меньше багов
 * 4. ✅ Оптимистичные обновления - лучший UX
 * 5. ✅ Автоматическая обработка ошибок
 * 6. ✅ Централизованное управление состоянием
 * 7. ❌ UI НЕ МЕНЯЕТСЯ - все классы остаются!
 */

export default {
  MarketsNew,
  BetButton,
  LoginButton,
  CheckinButton,
};
