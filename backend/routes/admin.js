import express from "express";
import { PrismaClient } from "@prisma/client";
import { AIBettingService } from "../services/aiBetting.js";
import { SettlementService } from "../services/settlement.js";
import { MarketService } from "../services/market.js";

const router = express.Router();
const prisma = new PrismaClient();

// Простая проверка админа (в продакшене использовать более надежную систему)
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }
  
  next();
};

// POST /api/admin/ai/run - Запустить AI анализ вручную
router.post("/ai/run", adminAuth, async (req, res) => {
  try {
    const aiBettingService = new AIBettingService(prisma);
    const marketService = new MarketService(prisma);
    
    // Получаем активные рынки
    const markets = await marketService.getActiveMarkets();
    
    // AI анализирует и делает ставки
    const aiBets = await aiBettingService.analyzeAndBet(markets);
    
    res.json({
      success: true,
      message: `AI analyzed ${markets.length} markets and placed ${aiBets.length} bets`,
      bets: aiBets
    });
    
  } catch (error) {
    console.error("AI run error:", error);
    res.status(500).json({
      error: "Failed to run AI analysis"
    });
  }
});

// POST /api/admin/markets/settle/:id - Вручную разрешить рынок
router.post("/markets/settle/:id", adminAuth, async (req, res) => {
  try {
    const { outcome } = req.body;
    
    if (!["YES", "NO", "CANCELLED"].includes(outcome)) {
      return res.status(400).json({
        error: "Invalid outcome. Must be YES, NO, or CANCELLED"
      });
    }
    
    const market = await prisma.market.findUnique({
      where: { id: req.params.id }
    });
    
    if (!market) {
      return res.status(404).json({
        error: "Market not found"
      });
    }
    
    if (market.resolved) {
      return res.status(400).json({
        error: "Market already resolved"
      });
    }
    
    // Обновляем рынок
    await prisma.market.update({
      where: { id: req.params.id },
      data: {
        resolved: true,
        outcome: outcome
      }
    });
    
    // Разрешаем ставки
    const settlementService = new SettlementService(prisma);
    await settlementService.settleMarket(req.params.id);
    
    res.json({
      success: true,
      message: `Market ${req.params.id} settled with outcome ${outcome}`
    });
    
  } catch (error) {
    console.error("Market settlement error:", error);
    res.status(500).json({
      error: "Failed to settle market"
    });
  }
});

// POST /api/admin/settlement/run - Запустить проверку всех завершенных рынков
router.post("/settlement/run", adminAuth, async (req, res) => {
  try {
    const marketService = new MarketService(prisma);
    const settlementService = new SettlementService(prisma);
    
    const marketsToSettle = await marketService.getMarketsToSettle();
    
    let settledCount = 0;
    for (const market of marketsToSettle) {
      const settled = await settlementService.settleMarket(market.id);
      if (settled) settledCount++;
    }
    
    res.json({
      success: true,
      message: `Settled ${settledCount} out of ${marketsToSettle.length} markets`
    });
    
  } catch (error) {
    console.error("Settlement run error:", error);
    res.status(500).json({
      error: "Failed to run settlement"
    });
  }
});

// GET /api/admin/stats - Получить статистику системы
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // За последние 7 дней
        }
      }
    });
    
    const totalMarkets = await prisma.market.count();
    const activeMarkets = await prisma.market.count({
      where: {
        resolved: false,
        endTime: { gt: new Date() }
      }
    });
    
    const totalUserBets = await prisma.userBet.count();
    const totalAIBets = await prisma.aIBet.count();
    
    const userBetVolume = await prisma.userBet.aggregate({
      _sum: { stake: true }
    });
    
    const aiBetVolume = await prisma.aIBet.aggregate({
      _sum: { stake: true }
    });
    
    const totalPoints = await prisma.user.aggregate({
      _sum: { points: true }
    });
    
    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers
        },
        markets: {
          total: totalMarkets,
          active: activeMarkets
        },
        bets: {
          userBets: totalUserBets,
          aiBets: totalAIBets,
          userVolume: userBetVolume._sum.stake || 0,
          aiVolume: aiBetVolume._sum.stake || 0
        },
        economy: {
          totalPointsInCirculation: totalPoints._sum.points || 0
        }
      }
    });
    
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({
      error: "Failed to fetch stats"
    });
  }
});

// POST /api/admin/users/:id/add-points - Добавить поинты пользователю
router.post("/users/:id/add-points", adminAuth, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    if (!amount || amount === 0) {
      return res.status(400).json({
        error: "Amount is required and must be non-zero"
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });
    
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }
    
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.params.id },
        data: {
          points: { increment: amount }
        }
      }),
      prisma.pointsLedger.create({
        data: {
          userId: req.params.id,
          wallet: user.wallet,
          amount: amount,
          type: "admin_adjustment",
          reason: reason || "Admin adjustment"
        }
      })
    ]);
    
    res.json({
      success: true,
      message: `Added ${amount} points to user ${req.params.id}`,
      newBalance: user.points + amount
    });
    
  } catch (error) {
    console.error("Add points error:", error);
    res.status(500).json({
      error: "Failed to add points"
    });
  }
});

export default router;