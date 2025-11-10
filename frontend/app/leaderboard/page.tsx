'use client';

import { useState } from 'react';
import { Brain, Users, Trophy, TrendingUp, Target, Medal, Crown } from 'lucide-react';
import { NeuralBackground } from '@/components/NeuralBackground';
import { Header } from '@/components/Header';
import { ConnectWalletModal } from '@/components/ConnectWalletModal';
import { useLeaderboard } from '@/hooks/usePoints';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'topUsers' | 'aiVsHumans' | 'agreement'>('topUsers');
  const [sortBy, setSortBy] = useState<'points' | 'winRate' | 'streak'>('points');

  const { data: leaderboardData } = useLeaderboard();
  const topUsers = leaderboardData?.leaderboard || [];

  const aiVsHumansStats = {
    ai: {
      totalBets: 24531,
      winRate: 68.5,
      volume: 2450000,
      profit: 450000,
      avgConfidence: 76.2,
    },
    humans: {
      totalBets: 89342,
      winRate: 62.3,
      volume: 8930000,
      profit: 320000,
      agreementRate: 54.8,
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NeuralBackground />
      <Header />
      <ConnectWalletModal />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
          <p className="text-slate-400">Top predictors and AI performance comparison</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('topUsers')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'topUsers'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/50 border border-slate-700'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Top Users
          </button>
          <button
            onClick={() => setActiveTab('aiVsHumans')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'aiVsHumans'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/50 border border-slate-700'
            }`}
          >
            <Brain className="w-4 h-4 inline mr-2" />
            AI vs Humans
          </button>
          <button
            onClick={() => setActiveTab('agreement')}
            className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'agreement'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/50 border border-slate-700'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Agreement Analysis
          </button>
        </div>

        {/* Content */}
        {activeTab === 'topUsers' && (
          <TopUsersTab topUsers={topUsers} sortBy={sortBy} setSortBy={setSortBy} />
        )}
        {activeTab === 'aiVsHumans' && <AIvsHumansTab stats={aiVsHumansStats} />}
        {activeTab === 'agreement' && <AgreementAnalysisTab />}
      </main>
    </div>
  );
}

function TopUsersTab({
  topUsers,
  sortBy,
  setSortBy,
}: {
  topUsers: any[];
  sortBy: string;
  setSortBy: (sort: 'points' | 'winRate' | 'streak') => void;
}) {
  return (
    <div className="space-y-6">
      {/* Sort buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy('points')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            sortBy === 'points'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800/50 border border-slate-700'
          }`}
        >
          By Points
        </button>
        <button
          onClick={() => setSortBy('winRate')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            sortBy === 'winRate'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800/50 border border-slate-700'
          }`}
        >
          By Win Rate
        </button>
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {topUsers.slice(0, 3).map((user, index) => (
          <TopUserCard key={user.rank} user={user} position={index + 1} />
        ))}
      </div>

      {/* Table */}
      <div className="p-6 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                Rank
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                Wallet
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-400">
                Points
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-400">
                Win Rate
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-slate-400">
                Total Bets
              </th>
            </tr>
          </thead>
          <tbody>
            {topUsers.map((user) => (
              <tr
                key={user.rank}
                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {user.rank <= 3 && (
                      <Medal
                        className={`w-5 h-5 ${
                          user.rank === 1
                            ? 'text-yellow-400'
                            : user.rank === 2
                            ? 'text-slate-400'
                            : 'text-orange-400'
                        }`}
                      />
                    )}
                    <span className="font-semibold">#{user.rank}</span>
                  </div>
                </td>
                <td className="py-4 px-4 font-mono">{user.wallet}</td>
                <td className="py-4 px-4 text-right font-bold">
                  {user.points.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="px-2 py-1 rounded bg-green-950/50 text-green-400 text-sm font-semibold">
                    {user.winRate.toFixed(1)}%
                  </span>
                </td>
                <td className="py-4 px-4 text-right">{user.totalBets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TopUserCard({ user, position }: { user: any; position: number }) {
  const colors = [
    'from-yellow-500 to-orange-500',
    'from-slate-400 to-slate-500',
    'from-orange-500 to-red-500',
  ];

  const icons = [
    <Crown key={1} className="w-8 h-8" />,
    <Medal key={2} className="w-8 h-8" />,
    <Medal key={3} className="w-8 h-8" />,
  ];

  return (
    <div
      className={`relative p-6 rounded-xl bg-gradient-to-br ${colors[position - 1]}/20 border-2 border-${
        position === 1 ? 'yellow' : position === 2 ? 'slate' : 'orange'
      }-500/50`}
    >
      <div
        className={`absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-br ${colors[position - 1]} flex items-center justify-center shadow-lg`}
      >
        {icons[position - 1]}
      </div>
      <div className="text-center">
        <div className="text-6xl font-bold mb-2">#{position}</div>
        <div className="font-mono text-lg mb-4">{user.wallet}</div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Points</span>
            <span className="font-bold">{user.points.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Win Rate</span>
            <span className="font-bold text-green-400">{user.winRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Bets</span>
            <span className="font-bold">{user.totalBets}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIvsHumansTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Stats */}
        <div className="p-8 rounded-xl bg-gradient-to-br from-cyan-950/50 to-blue-950/50 border border-cyan-500/30">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-10 h-10 text-cyan-400" />
            <div>
              <h3 className="text-2xl font-bold">AI Models</h3>
              <p className="text-sm text-slate-400">Neural Network Predictions</p>
            </div>
          </div>
          <div className="space-y-4">
            <StatRow label="Total Bets" value={stats.ai.totalBets.toLocaleString()} />
            <StatRow
              label="Win Rate"
              value={`${stats.ai.winRate}%`}
              valueColor="text-cyan-400"
            />
            <StatRow
              label="Total Volume"
              value={`$${(stats.ai.volume / 1000).toFixed(0)}k`}
            />
            <StatRow
              label="Total Profit"
              value={`+$${(stats.ai.profit / 1000).toFixed(0)}k`}
              valueColor="text-green-400"
            />
          </div>
        </div>

        {/* Human Stats */}
        <div className="p-8 rounded-xl bg-gradient-to-br from-purple-950/50 to-pink-950/50 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-10 h-10 text-purple-400" />
            <div>
              <h3 className="text-2xl font-bold">Humans</h3>
              <p className="text-sm text-slate-400">Human Predictors</p>
            </div>
          </div>
          <div className="space-y-4">
            <StatRow label="Total Bets" value={stats.humans.totalBets.toLocaleString()} />
            <StatRow
              label="Win Rate"
              value={`${stats.humans.winRate}%`}
              valueColor="text-purple-400"
            />
            <StatRow
              label="Total Volume"
              value={`$${(stats.humans.volume / 1000).toFixed(0)}k`}
            />
            <StatRow
              label="Total Profit"
              value={`+$${(stats.humans.profit / 1000).toFixed(0)}k`}
              valueColor="text-green-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  valueColor = 'text-white',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-300">{label}</span>
      <span className={`font-bold text-lg ${valueColor}`}>{value}</span>
    </div>
  );
}

function AgreementAnalysisTab() {
  return (
    <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
      <p className="text-slate-400">Agreement analysis coming soon...</p>
    </div>
  );
}
