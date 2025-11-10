'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Brain, TrendingUp, TrendingDown, Clock, DollarSign, Users, Target } from 'lucide-react';
import { NeuralBackground } from '@/components/NeuralBackground';
import { Header } from '@/components/Header';
import { ConnectWalletModal } from '@/components/ConnectWalletModal';
import { useMarket, useMarketPrices } from '@/hooks/useMarkets';
import { usePlaceBet } from '@/hooks/useBets';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';
import type { BetSide } from '@/types';

export default function MarketDetailsPage() {
  const params = useParams();
  const marketId = params.id as string;

  const { data: marketData, isLoading } = useMarket(marketId);
  const { data: pricesData } = useMarketPrices(marketId, '24h');
  const { mutate: placeBet, isPending: isPlacing } = usePlaceBet();
  const { isAuthenticated, user } = useAuthStore();

  const [selectedSide, setSelectedSide] = useState<BetSide>('YES');
  const [stake, setStake] = useState<number>(100);

  const market = marketData?.market;
  const aiPrediction = market?.aiBets?.[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <NeuralBackground />
        <Header />
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <NeuralBackground />
        <Header />
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Market Not Found</h1>
          <Link href="/" className="btn-primary">
            Back to Markets
          </Link>
        </main>
      </div>
    );
  }

  const currentPrice = selectedSide === 'YES' ? market.yesPrice : market.noPrice;
  const potentialPayout = Math.floor((stake / currentPrice) * 0.95); // 5% fee
  const timeUntilEnd = formatDistanceToNow(new Date(market.endTime), { addSuffix: true });

  const handlePlaceBet = () => {
    if (!isAuthenticated) {
      alert('Please connect wallet');
      return;
    }

    if (stake > (user?.points || 0)) {
      alert('Insufficient points');
      return;
    }

    placeBet({
      marketId: market.id,
      side: selectedSide,
      stake,
      entryPrice: currentPrice,
      agreeWithAI: aiPrediction ? selectedSide === aiPrediction.side : false,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NeuralBackground />
      <Header />
      <ConnectWalletModal />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Markets
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Market Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Header */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-start gap-4 mb-4">
                <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-indigo-500/20 text-indigo-400">
                  {market.category}
                </span>
                <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-slate-700 text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Ends {timeUntilEnd}
                </span>
              </div>

              <h1 className="text-3xl font-bold mb-4">{market.question}</h1>

              {market.description && (
                <p className="text-slate-400 leading-relaxed">{market.description}</p>
              )}

              <div className="mt-6 flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>${market.volume.toLocaleString()} volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{market._count?.userBets || 0} bets</span>
                </div>
              </div>
            </div>

            {/* AI Prediction */}
            {aiPrediction && (
              <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-950/50 to-blue-950/50 border border-cyan-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">AI Prediction</h3>
                    <p className="text-sm text-slate-400">Neural Network Analysis</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Prediction</p>
                    <p className="text-2xl font-bold text-cyan-400">{aiPrediction.side}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Confidence</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {aiPrediction.confidence.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    <strong className="text-cyan-400">Reasoning:</strong> {aiPrediction.reasoning}
                  </p>
                </div>
              </div>
            )}

            {/* Price Chart Placeholder */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Price History (24h)</h3>
              <div className="h-48 flex items-center justify-center text-slate-500">
                Price chart coming soon...
              </div>
            </div>
          </div>

          {/* Right Column - Betting */}
          <div className="space-y-6">
            {/* Current Prices */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Current Prices</h3>

              <div className="space-y-3">
                <button
                  onClick={() => setSelectedSide('YES')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedSide === 'YES'
                      ? 'border-green-500 bg-green-950/30'
                      : 'border-slate-700 hover:border-green-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="font-bold text-lg">YES</span>
                    </div>
                    <span className="text-2xl font-bold text-green-400">
                      {(market.yesPrice * 100).toFixed(1)}¢
                    </span>
                  </div>
                  {aiPrediction?.side === 'YES' && (
                    <div className="flex items-center gap-2 text-xs text-cyan-400">
                      <Target className="w-3 h-3" />
                      <span>AI agrees</span>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setSelectedSide('NO')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedSide === 'NO'
                      ? 'border-red-500 bg-red-950/30'
                      : 'border-slate-700 hover:border-red-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      <span className="font-bold text-lg">NO</span>
                    </div>
                    <span className="text-2xl font-bold text-red-400">
                      {(market.noPrice * 100).toFixed(1)}¢
                    </span>
                  </div>
                  {aiPrediction?.side === 'NO' && (
                    <div className="flex items-center gap-2 text-xs text-cyan-400">
                      <Target className="w-3 h-3" />
                      <span>AI agrees</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Bet Form */}
            {isAuthenticated ? (
              <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Place Your Bet</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Stake (Points)</label>
                    <input
                      type="number"
                      min="10"
                      max={user?.points || 1000}
                      value={stake}
                      onChange={(e) => setStake(Number(e.target.value))}
                      className="input"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Available: {user?.points.toLocaleString()} pts
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Entry Price</span>
                      <span className="font-bold">{(currentPrice * 100).toFixed(2)}¢</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Potential Payout</span>
                      <span className="font-bold text-green-400">
                        {potentialPayout.toLocaleString()} pts
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Potential Profit</span>
                      <span className="font-bold text-green-400">
                        +{(potentialPayout - stake).toLocaleString()} pts
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceBet}
                    disabled={isPlacing || stake < 10 || stake > (user?.points || 0)}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${
                      selectedSide === 'YES'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isPlacing ? 'Placing Bet...' : `Bet ${selectedSide} for ${stake} pts`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 text-center">
                <p className="text-slate-400 mb-4">Connect wallet to place bets</p>
                <button className="btn-primary w-full">Connect Wallet</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
