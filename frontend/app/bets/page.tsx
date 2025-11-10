'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Trophy, XCircle, Clock } from 'lucide-react';
import { NeuralBackground } from '@/components/NeuralBackground';
import { Header } from '@/components/Header';
import { ConnectWalletModal } from '@/components/ConnectWalletModal';
import { useActiveBets, useSettledBets, useBetStats } from '@/hooks/useBets';
import { useIsAuthenticated } from '@/store/authStore';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { UserBet } from '@/types';

export default function BetsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active');
  const isAuthenticated = useIsAuthenticated();

  const { data: activeBetsData, isLoading: loadingActive } = useActiveBets();
  const { data: settledBetsData, isLoading: loadingSettled } = useSettledBets();
  const { data: statsData } = useBetStats();

  const activeBets = activeBetsData?.bets || [];
  const settledBets = settledBetsData?.bets || [];
  const stats = statsData?.stats;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <NeuralBackground />
        <Header />
        <ConnectWalletModal />
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 text-center">
          <h1 className="text-4xl font-bold mb-4">My Bets</h1>
          <p className="text-slate-400">Connect wallet to view your bets</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NeuralBackground />
      <Header />
      <ConnectWalletModal />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold mb-8">My Bets</h1>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <p className="text-slate-400 mb-1">Total Bets</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <p className="text-slate-400 mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-green-400">{stats.winRate.toFixed(1)}%</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <p className="text-slate-400 mb-1">Total Staked</p>
              <p className="text-2xl font-bold">{stats.totalStaked.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <p className="text-slate-400 mb-1">Profit</p>
              <p
                className={`text-2xl font-bold ${
                  stats.profit >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {stats.profit >= 0 ? '+' : ''}
                {stats.profit.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/50 border border-slate-700'
            }`}
          >
            Active ({activeBets.length})
          </button>
          <button
            onClick={() => setActiveTab('settled')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'settled'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/50 border border-slate-700'
            }`}
          >
            Settled ({settledBets.length})
          </button>
        </div>

        {/* Bets List */}
        {activeTab === 'active' ? (
          loadingActive ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeBets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">No active bets</p>
              <Link href="/" className="btn-primary">
                Browse Markets
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBets.map((bet) => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          )
        ) : loadingSettled ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : settledBets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No settled bets yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {settledBets.map((bet) => (
              <BetCard key={bet.id} bet={bet} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function BetCard({ bet }: { bet: UserBet }) {
  const isYes = bet.side === 'YES';
  const timeAgo = formatDistanceToNow(new Date(bet.placedAt), { addSuffix: true });

  return (
    <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link
            href={`/market/${bet.marketId}`}
            className="text-lg font-semibold hover:text-indigo-400 transition-colors"
          >
            {bet.market?.question || 'Market'}
          </Link>
          <p className="text-sm text-slate-400 mt-1">{timeAgo}</p>
        </div>

        {bet.settled && (
          <div
            className={`px-3 py-1 rounded-lg font-semibold ${
              bet.won
                ? 'bg-green-950/50 text-green-400 border border-green-500/30'
                : 'bg-red-950/50 text-red-400 border border-red-500/30'
            }`}
          >
            {bet.won ? (
              <>
                <Trophy className="w-4 h-4 inline mr-1" />
                Won
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 inline mr-1" />
                Lost
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Position</p>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
              isYes
                ? 'bg-green-950/30 text-green-400'
                : 'bg-red-950/30 text-red-400'
            }`}
          >
            {isYes ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-bold">{bet.side}</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1">Stake</p>
          <p className="font-bold">{bet.stake.toLocaleString()} pts</p>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1">Entry Price</p>
          <p className="font-bold">{(bet.entryPrice * 100).toFixed(1)}¢</p>
        </div>

        {bet.settled ? (
          <div>
            <p className="text-xs text-slate-400 mb-1">Payout</p>
            <p
              className={`font-bold ${
                bet.won ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {bet.won ? '+' : ''}
              {bet.payout?.toLocaleString() || 0} pts
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-400 mb-1">Current Price</p>
            <p className="font-bold">{(bet.currentPrice || bet.entryPrice) * 100}¢</p>
          </div>
        )}
      </div>

      {bet.agreeWithAI && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2 text-sm text-cyan-400">
            <Clock className="w-4 h-4" />
            <span>Agreed with AI prediction</span>
          </div>
        </div>
      )}
    </div>
  );
}
