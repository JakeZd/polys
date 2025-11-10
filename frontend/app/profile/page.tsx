'use client';

import { Coins, Flame, Trophy, TrendingUp, Calendar, Award } from 'lucide-react';
import { NeuralBackground } from '@/components/NeuralBackground';
import { Header } from '@/components/Header';
import { ConnectWalletModal } from '@/components/ConnectWalletModal';
import { useAuthStore } from '@/store/authStore';
import { useDailyCheckin, useCanCheckin, useStreakInfo, usePointsHistory } from '@/hooks/usePoints';
import { useBetStats } from '@/hooks/useBets';
import { formatDistanceToNow } from 'date-fns';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const { mutate: checkin, isPending } = useDailyCheckin();
  const canCheckin = useCanCheckin();
  const streakInfo = useStreakInfo();
  const { data: statsData } = useBetStats();
  const { data: historyData } = usePointsHistory(undefined, 10);

  const stats = statsData?.stats;
  const history = historyData?.history || [];

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <NeuralBackground />
        <Header />
        <ConnectWalletModal />
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Profile</h1>
          <p className="text-slate-400">Connect wallet to view your profile</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="p-8 rounded-xl bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border border-indigo-500/30">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Profile</h1>
                  <p className="font-mono text-slate-400">{user.wallet}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-2">
                    <Coins className="w-6 h-6 text-yellow-400" />
                    <span className="text-4xl font-bold text-gradient">
                      {user.points.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">Total Points</p>
                </div>
              </div>

              {/* Daily Checkin */}
              <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <Flame className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Daily Check-in</h3>
                      <p className="text-sm text-slate-400">
                        Current streak: {streakInfo.currentStreak} days
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => checkin()}
                    disabled={!canCheckin || isPending}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? 'Checking in...' : canCheckin ? 'Check In' : 'Done Today!'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Next bonus at {streakInfo.nextBonus} days</span>
                  <span className="font-bold text-orange-400">
                    {streakInfo.daysUntilBonus} days to go
                  </span>
                </div>

                {/* Streak progress */}
                <div className="mt-4">
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                      style={{
                        width: `${(streakInfo.currentStreak / streakInfo.nextBonus) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Betting Stats */}
            {stats && (
              <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  Betting Statistics
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-slate-900/50">
                    <p className="text-slate-400 text-sm mb-1">Total Bets</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900/50">
                    <p className="text-slate-400 text-sm mb-1">Win Rate</p>
                    <p className="text-2xl font-bold text-green-400">
                      {stats.winRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900/50">
                    <p className="text-slate-400 text-sm mb-1">ROI</p>
                    <p
                      className={`text-2xl font-bold ${
                        stats.roi >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {stats.roi >= 0 ? '+' : ''}
                      {stats.roi.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900/50">
                    <p className="text-slate-400 text-sm mb-1">Profit</p>
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

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-green-950/30 border border-green-500/30">
                    <p className="text-3xl font-bold text-green-400 mb-1">{stats.won}</p>
                    <p className="text-sm text-slate-400">Won</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-950/30 border border-blue-500/30">
                    <p className="text-3xl font-bold text-blue-400 mb-1">{stats.active}</p>
                    <p className="text-sm text-slate-400">Active</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-950/30 border border-red-500/30">
                    <p className="text-3xl font-bold text-red-400 mb-1">{stats.lost}</p>
                    <p className="text-sm text-slate-400">Lost</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Points History */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Recent Activity
              </h2>

              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">
                    No activity yet
                  </p>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-slate-900/50 border border-slate-700"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm font-medium">{item.type.replace(/_/g, ' ')}</span>
                        <span
                          className={`font-bold ${
                            item.amount >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {item.amount >= 0 ? '+' : ''}
                          {item.amount}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-400">{item.description}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Achievements */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Achievements
              </h2>

              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-yellow-950/30 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="font-semibold">Early Adopter</span>
                  </div>
                  <p className="text-xs text-slate-400">Joined PolySynapse</p>
                </div>

                {streakInfo.currentStreak >= 7 && (
                  <div className="p-3 rounded-lg bg-orange-950/30 border border-orange-500/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="font-semibold">On Fire</span>
                    </div>
                    <p className="text-xs text-slate-400">7+ day streak</p>
                  </div>
                )}

                {stats && stats.won >= 10 && (
                  <div className="p-3 rounded-lg bg-green-950/30 border border-green-500/30">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="font-semibold">Winning Streak</span>
                    </div>
                    <p className="text-xs text-slate-400">10+ bets won</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
