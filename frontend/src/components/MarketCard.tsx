'use client';

import Link from 'next/link';
import { Brain, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import type { Market } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const aiPrediction = market.aiBet || market.aiBets?.[0];
  const timeUntilEnd = formatDistanceToNow(new Date(market.endTime), { addSuffix: true });

  // Get prices from currentPrices or fallback to yesPrice/noPrice
  const yesPrice = market.currentPrices?.yesPrice ?? market.yesPrice;
  const noPrice = market.currentPrices?.noPrice ?? market.noPrice;

  // Determine if ending soon (< 24 hours)
  const hoursUntilEnd = (new Date(market.endTime).getTime() - Date.now()) / (1000 * 60 * 60);
  const isEndingSoon = hoursUntilEnd < 24;

  return (
    <Link href={`/market/${market.id}`}>
      <div className="group p-6 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-400">
                {market.category}
              </span>
              {isEndingSoon && (
                <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Ending Soon
                </span>
              )}
            </div>
            <h3 className="font-semibold text-lg leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2">
              {market.question}
            </h3>
          </div>
        </div>

        {/* AI Prediction */}
        {aiPrediction && (
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-cyan-950/50 to-blue-950/50 border border-cyan-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400">
                AI Prediction: {aiPrediction.side}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Confidence</span>
                <span className="font-bold text-cyan-400">
                  {aiPrediction.confidence.toFixed(1)}%
                </span>
              </div>
              {aiPrediction.pnl !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">AI P&L</span>
                  <span className={`font-bold ${
                    aiPrediction.pnl > 0 ? 'text-green-400' :
                    aiPrediction.pnl < 0 ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {aiPrediction.pnl > 0 ? '+' : ''}{aiPrediction.pnl.toLocaleString()} pts
                    {aiPrediction.pnlPercentage && (
                      <span className="ml-1 text-xs">
                        ({aiPrediction.pnl > 0 ? '+' : ''}{aiPrediction.pnlPercentage}%)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-green-950/30 border border-green-500/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-400">YES</span>
            </div>
            <p className="text-lg font-bold text-green-400">
              {(yesPrice * 100).toFixed(1)}¢
            </p>
          </div>
          <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400">NO</span>
            </div>
            <p className="text-lg font-bold text-red-400">
              {(noPrice * 100).toFixed(1)}¢
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-slate-700 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <DollarSign className="w-4 h-4" />
            <span>${market.volume.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{timeUntilEnd}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
