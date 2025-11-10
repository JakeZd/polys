import express from "express";
import { PrismaClient } from "@prisma/client";
import { MarketService } from "../services/market.js";
import { authMiddleware } from "./auth.js";

const router = express.Router();
const prisma = new PrismaClient();
const marketService = new MarketService(prisma);

router.get("/", async (req, res) => {
  try {
    const { category, search, limit = 250, offset = 0, status = 'all' } = req.query;
    
    // Строим WHERE условие для AI ставок
    let aiBetsWhere = { settled: false };
    
    // Фильтр по статусу рынка
    let marketWhere = {};
    if (status === 'active') {
      marketWhere.resolved = false;
    } else if (status === 'pending') {
      marketWhere.resolved = false;
      marketWhere.endTime = { lte: new Date() };
    }
    
    // Фильтр по категории - ВАЖНО: применяем на уровне SQL
    if (category && category !== "all") {
      marketWhere.category = category;
    }
    
    // Фильтр по поиску - тоже на уровне SQL
    if (search) {
      marketWhere.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Объединяем условия
    if (Object.keys(marketWhere).length > 0) {
      aiBetsWhere.market = marketWhere;
    }
    
    const aiBetsWithMarkets = await prisma.aIBet.findMany({
      where: aiBetsWhere,
      include: {
        market: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    const markets = aiBetsWithMarkets.map(bet => bet.market);
    
    const formatted = await Promise.all(markets.map(async (market) => {
      let currentPrices = null;
      try {
        currentPrices = await marketService.updateMarketPrices(market.id);
      } catch (error) {
        console.error(`Error fetching prices for ${market.id}:`, error.message);
      }
      
      const userBetsStats = await prisma.userBet.aggregate({
        where: { marketId: market.id },
        _count: true,
        _sum: { stake: true }
      });
      
      const aiBet = await prisma.aIBet.findFirst({
        where: { marketId: market.id },
        orderBy: { createdAt: 'desc' }
      });
      
      let pnl = 0;
      let potentialPayout = 0;
      let currentValue = 0;
      
      if (aiBet && currentPrices) {
        const currentPrice = aiBet.side === 'YES' ? currentPrices.yesPrice : currentPrices.noPrice;
        
        if (currentPrice > 0) {
          currentValue = (aiBet.stake / aiBet.entryPrice) * currentPrice;
        }
        
        pnl = currentValue - aiBet.stake;
        potentialPayout = Math.floor(aiBet.stake / aiBet.entryPrice);
      }
      
      const now = new Date();
      const endTime = new Date(market.endTime);
      const isExpired = endTime <= now;
      const daysUntilEnd = Math.ceil((endTime - now) / (1000 * 60 * 60 * 24));
      
      let marketStatus = 'active';
      if (market.resolved) {
        marketStatus = 'resolved';
      } else if (isExpired) {
        marketStatus = 'expired';
      }
      
      return {
        id: market.id,
        polymarketId: market.polymarketId,
        question: market.question,
        description: market.description,
        category: market.category,
        endTime: market.endTime,
        daysUntilEnd: daysUntilEnd,
        isExpired: isExpired,
        resolved: market.resolved,
        outcome: market.outcome,
        marketStatus: marketStatus,
        volume: market.volume,
        liquidity: market.liquidity,
        userBetsCount: userBetsStats._count || 0,
        totalUserVolume: userBetsStats._sum.stake || 0,
        currentPrices: currentPrices || {
          yesPrice: 0.5,
          noPrice: 0.5
        },
        aiBet: aiBet ? {
          id: aiBet.id,
          side: aiBet.side,
          confidence: aiBet.confidence,
          reasoning: aiBet.reasoning,
          entryPrice: aiBet.entryPrice,
          currentPrice: aiBet.side === 'YES' ? currentPrices?.yesPrice : currentPrices?.noPrice,
          expectedValue: aiBet.expectedValue,
          edge: aiBet.edge,
          stake: aiBet.stake,
          potentialPayout: potentialPayout,
          currentValue: Math.floor(currentValue),
          pnl: Math.floor(pnl),
          pnlPercentage: aiBet.stake > 0 ? ((pnl / aiBet.stake) * 100).toFixed(2) : 0,
          settled: aiBet.settled,
          won: aiBet.won,
          actualPayout: aiBet.payout,
          placedAt: aiBet.createdAt
        } : null
      };
    }));
    
    res.json({
      success: true,
      markets: formatted,
      count: formatted.length
    });
    
  } catch (error) {
    console.error("Error fetching markets:", error);
    res.status(500).json({ 
      error: "Failed to fetch markets" 
    });
  }
});

// Categories endpoint с подсчетом количества
router.get("/categories", async (req, res) => {
  try {
    const categories = [
      "politics",
      "crypto", 
      "sports",
      "finance",
      "world",
      "tech",
      "science",
      "pop-culture"
    ];
    
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await prisma.market.count({
          where: {
            category: cat,
            aiBets: {
              some: {
                settled: false
              }
            }
          }
        });
        
        return {
          name: cat,
          count: count
        };
      })
    );
    
    res.json({
      success: true,
      categories: categoriesWithCount
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/results", async (req, res) => {
  try {
    const { category, limit = 50, offset = 0 } = req.query;
    
    let where = {
      market: {
        resolved: true
      }
    };
    
    if (category && category !== "all") {
      where.market.category = category;
    }
    
    const settledBets = await prisma.aIBet.findMany({
      where: where,
      include: {
        market: true
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    const results = settledBets.map(bet => {
      const profit = (bet.payout || 0) - bet.stake;
      const profitPercentage = bet.stake > 0 ? ((profit / bet.stake) * 100).toFixed(2) : 0;
      
      return {
        id: bet.id,
        marketId: bet.market.id,
        question: bet.market.question,
        category: bet.market.category,
        side: bet.side,
        confidence: bet.confidence,
        reasoning: bet.reasoning,
        entryPrice: bet.entryPrice,
        stake: bet.stake,
        settled: bet.settled,
        won: bet.won,
        payout: bet.payout || 0,
        profit: profit,
        profitPercentage: profitPercentage,
        expectedValue: bet.expectedValue,
        edge: bet.edge,
        placedAt: bet.createdAt,
        settledAt: bet.updatedAt,
        outcome: bet.market.outcome,
        marketResolved: bet.market.resolved,
        endTime: bet.market.endTime
      };
    });
    
    const settledResults = results.filter(r => r.settled);
    const stats = {
      totalBets: results.length,
      settledBets: settledResults.length,
      wonBets: settledResults.filter(r => r.won).length,
      lostBets: settledResults.filter(r => !r.won).length,
      pendingBets: results.filter(r => !r.settled).length,
      winRate: settledResults.length > 0 ? 
        ((settledResults.filter(r => r.won).length / settledResults.length) * 100).toFixed(2) : 0,
      totalStaked: results.reduce((sum, r) => sum + r.stake, 0),
      totalPayout: settledResults.reduce((sum, r) => sum + r.payout, 0),
      totalProfit: settledResults.reduce((sum, r) => sum + r.profit, 0),
      roi: results.reduce((sum, r) => sum + r.stake, 0) > 0 ? 
        ((settledResults.reduce((sum, r) => sum + r.profit, 0) / results.reduce((sum, r) => sum + r.stake, 0)) * 100).toFixed(2) : 0
    };
    
    res.json({
      success: true,
      results,
      stats,
      count: results.length
    });
    
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({ 
      error: "Failed to fetch results" 
    });
  }
});

router.get("/expired", async (req, res) => {
  try {
    const expiredMarkets = await prisma.market.findMany({
      where: {
        resolved: false,
        endTime: {
          lte: new Date()
        }
      },
      include: {
        aiBets: {
          where: { settled: false }
        }
      },
      orderBy: { endTime: 'desc' }
    });
    
    res.json({
      success: true,
      markets: expiredMarkets,
      count: expiredMarkets.length
    });
    
  } catch (error) {
    console.error("Error fetching expired markets:", error);
    res.status(500).json({ 
      error: "Failed to fetch expired markets" 
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const market = await prisma.market.findUnique({
      where: { id: req.params.id },
      include: {
        aiBets: {
          orderBy: { createdAt: 'desc' }
        },
        userBets: {
          orderBy: { placedAt: 'desc' },
          take: 50,
          include: {
            user: {
              select: {
                id: true,
                wallet: true,
                winRate: true
              }
            }
          }
        }
      }
    });
    
    if (!market) {
      return res.status(404).json({
        error: "Market not found"
      });
    }
    
    let currentPrices = null;
    try {
      currentPrices = await marketService.updateMarketPrices(market.id);
    } catch (error) {
      console.error(`Error fetching prices for ${market.id}:`, error.message);
    }
    
    const now = new Date();
    const endTime = new Date(market.endTime);
    const isExpired = endTime <= now;
    const daysUntilEnd = Math.ceil((endTime - now) / (1000 * 60 * 60 * 24));
    
    let marketStatus = 'active';
    if (market.resolved) {
      marketStatus = 'resolved';
    } else if (isExpired) {
      marketStatus = 'expired';
    }
    
    res.json({
      success: true,
      market: {
        ...market,
        currentPrices: currentPrices || { yesPrice: 0.5, noPrice: 0.5 },
        daysUntilEnd,
        isExpired,
        marketStatus
      }
    });
    
  } catch (error) {
    console.error("Error fetching market:", error);
    res.status(500).json({
      error: "Failed to fetch market"
    });
  }
});

router.get("/meta/categories", async (req, res) => {
  try {
    const categories = [
      "politics",
      "crypto", 
      "sports",
      "finance",
      "world",
      "tech",
      "science",
      "pop-culture"
    ];
    
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await prisma.market.count({
          where: {
            category: cat,
            aiBets: {
              some: {
                settled: false
              }
            }
          }
        });
        
        return {
          name: cat,
          count: count
        };
      })
    );
    
    res.json({
      success: true,
      categories: categoriesWithCount
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default router;