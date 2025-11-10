'use client';

import { useState } from 'react';
import { Search, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { NeuralBackground } from '@/components/NeuralBackground';
import { Header } from '@/components/Header';
import { ConnectWalletModal } from '@/components/ConnectWalletModal';
import { MarketCard } from '@/components/MarketCard';
import { ResolvedMarketCard } from '@/components/ResolvedMarketCard';
import { useMarkets, useCategories, useMarketResults } from '@/hooks/useMarkets';

type TabType = 'active' | 'resolved';

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: marketsData, isLoading: marketsLoading } = useMarkets({
    category: category === 'all' ? undefined : category,
    search: search || undefined,
    limit: 250,
    status: 'all'
  });

  const { data: resultsData, isLoading: resultsLoading } = useMarketResults(
    category === 'all' ? undefined : category,
    250,
    0
  );

  const { data: categoriesData } = useCategories();

  const markets = marketsData?.markets || [];
  const results = resultsData?.results || [];
  const resultsStats = resultsData?.stats;
  const categories = categoriesData?.categories || [];
  const isLoading = activeTab === 'active' ? marketsLoading : resultsLoading;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NeuralBackground />
      <Header />
      <ConnectWalletModal />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Prediction Markets
          </h1>
          <p className="text-slate-400 text-lg">
            Bet on real-world outcomes with AI-powered insights
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500/50'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Active Markets
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'resolved'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500/50'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Resolved Markets
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                category === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              All Markets
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setCategory(cat.name)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  category === cat.name
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        {activeTab === 'active' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <span className="text-slate-400">Active Markets</span>
              </div>
              <p className="text-2xl font-bold">{markets.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span className="text-slate-400">Ending Soon</span>
              </div>
              <p className="text-2xl font-bold">
                {markets.filter(m => {
                  const hoursUntilEnd = (new Date(m.endTime).getTime() - Date.now()) / (1000 * 60 * 60);
                  return hoursUntilEnd < 24;
                }).length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-slate-400">Total Volume</span>
              </div>
              <p className="text-2xl font-bold">
                ${markets.reduce((sum, m) => sum + m.volume, 0).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-indigo-400" />
                <span className="text-slate-400">Total Bets</span>
              </div>
              <p className="text-2xl font-bold">{resultsStats?.totalBets || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-slate-400">Win Rate</span>
              </div>
              <p className="text-2xl font-bold">{resultsStats?.winRate || 0}%</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span className="text-slate-400">Total Profit</span>
              </div>
              <p className={`text-2xl font-bold ${
                (resultsStats?.totalProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {(resultsStats?.totalProfit || 0) >= 0 ? '+' : ''}
                {(resultsStats?.totalProfit || 0).toLocaleString()} pts
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="text-slate-400">ROI</span>
              </div>
              <p className={`text-2xl font-bold ${
                (resultsStats?.roi || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {(resultsStats?.roi || 0) >= 0 ? '+' : ''}{resultsStats?.roi || 0}%
              </p>
            </div>
          </div>
        )}

        {/* Markets Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-slate-400">
              Loading {activeTab === 'active' ? 'markets' : 'results'}...
            </p>
          </div>
        ) : activeTab === 'active' ? (
          markets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No markets found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )
        ) : (
          results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No resolved markets found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result) => (
                <ResolvedMarketCard key={result.id} result={result} />
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}