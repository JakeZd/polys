/**
 * TypeScript Types для всего приложения
 * Полная типобезопасность!
 */

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  wallet: string;
  points: number;
  createdAt: string;
  lastCheckin: string | null;
  streakDays: number;
  stats?: UserStats;
}

export interface UserStats {
  totalBets: number;
  activeBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
}

// ============================================
// MARKET TYPES
// ============================================

export interface Market {
  id: string;
  polymarketId: string;
  question: string;
  description: string | null;
  category: string;
  endTime: string;
  volume: number;
  yesPrice: number;
  noPrice: number;
  lastPriceUpdate: string | null;
  resolved: boolean;
  outcome: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    userBets: number;
    aiBets: number;
  };
  aiBets?: AIBet[];
}

export interface MarketFilters {
  category?: string;
  search?: string;
  resolved?: boolean;
  limit?: number;
  offset?: number;
}

export interface PriceSnapshot {
  id: string;
  marketId: string;
  yesPrice: number;
  noPrice: number;
  timestamp: string;
}

// ============================================
// BET TYPES
// ============================================

export type BetSide = 'YES' | 'NO';

export interface UserBet {
  id: string;
  userId: string;
  marketId: string;
  side: BetSide;
  stake: number;
  entryPrice: number;
  agreeWithAI: boolean;
  placedAt: string;
  settled: boolean;
  won: boolean | null;
  payout: number | null;
  settledAt: string | null;
  currentPrice?: number;
  unrealizedPnL?: number;
  market?: Market;
}

export interface AIBet {
  id: string;
  marketId: string;
  side: BetSide;
  confidence: number;
  reasoning: string;
  entryPrice: number;
  expectedValue: number;
  stake: number;
  placedAt: string;
  settled: boolean;
  won: boolean | null;
  payout: number | null;
  settledAt: string | null;
}

export interface PlaceBetRequest {
  marketId: string;
  side: BetSide;
  stake: number;
  entryPrice: number;
  agreeWithAI?: boolean;
}

export interface BetStats {
  total: number;
  active: number;
  settled: number;
  won: number;
  lost: number;
  winRate: number;
  totalStaked: number;
  totalWon: number;
  profit: number;
  roi: number;
}

// ============================================
// POINTS TYPES
// ============================================

export type PointsTransactionType =
  | 'BET_PLACED'
  | 'BET_WON'
  | 'BET_LOST'
  | 'DAILY_CHECKIN'
  | 'STREAK_BONUS'
  | 'INITIAL_GRANT'
  | 'ADMIN_AWARD'
  | 'REFUND';

export interface PointsLedger {
  id: string;
  userId: string;
  amount: number;
  type: PointsTransactionType;
  description: string | null;
  metadata: any;
  createdAt: string;
}

export interface CheckinResult {
  success: boolean;
  reward: number;
  streak: number;
  streakBonus: number;
  newBalance: number;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  points: number;
  totalBets: number;
  wonBets: number;
  winRate: number;
}

// ============================================
// AUTH TYPES
// ============================================

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    wallet: string;
    points: number;
    isNew: boolean;
  };
}

export interface AuthMessage {
  success: boolean;
  message: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pages: number;
}

// Markets Response
export interface MarketsResponse {
  success: boolean;
  markets: Market[];
  total: number;
  page: number;
  pages: number;
}

// Bets Response
export interface BetsResponse {
  success: boolean;
  bets: UserBet[];
  total: number;
}

// Leaderboard Response
export interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
}

// Points History Response
export interface PointsHistoryResponse {
  success: boolean;
  history: PointsLedger[];
  total: number;
}

// Categories Response
export interface CategoriesResponse {
  success: boolean;
  categories: Array<{
    name: string;
    count: number;
  }>;
}

// ============================================
// FORM TYPES
// ============================================

export interface BetFormData {
  side: BetSide;
  stake: number;
  agreeWithAI: boolean;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface ModalState {
  isOpen: boolean;
  data?: any;
}

// ============================================
// CHART TYPES
// ============================================

export interface ChartDataPoint {
  timestamp: string;
  yesPrice: number;
  noPrice: number;
}

export type ChartPeriod = '1h' | '24h' | '7d' | '30d';

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

// ============================================
// UTILITY TYPES
// ============================================

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// ============================================
// EXPORT ALL
// ============================================

export type {
  // Re-export for convenience
  Market as IMarket,
  User as IUser,
  UserBet as IUserBet,
  AIBet as IAIBet,
};
