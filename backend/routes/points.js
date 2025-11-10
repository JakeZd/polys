import express from "express";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "./auth.js";

const router = express.Router();
const prisma = new PrismaClient();

const checkinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: 'Too many checkin attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Функция для маскировки кошелька
const maskWallet = (wallet) => {
  if (!wallet || wallet.length < 10) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
};

// GET /api/points/balance - Получить баланс пользователя
router.get("/balance", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        wallet: true,
        points: true,
        streakDays: true,
        lastCheckin: true
      }
    });
    
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }
    
    res.json({
      success: true,
      balance: user.points,
      streakDays: user.streakDays,
      lastCheckin: user.lastCheckin
    });
    
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({
      error: "Failed to fetch balance"
    });
  }
});

// GET /api/points/history - История транзакций
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0, type } = req.query;
    
    let where = { userId: req.userId };
    
    if (type && type !== "all") {
      where.type = type;
    }
    
    const transactions = await prisma.pointsLedger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    const total = await prisma.pointsLedger.count({ where });
    
    res.json({
      success: true,
      transactions,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({
      error: "Failed to fetch history"
    });
  }
});

// GET /api/points/checkin-rewards - Получить таблицу наград за чекин
router.get("/checkin-rewards", async (req, res) => {
  try {
    const rewards = [
      { day: 1, points: 20 },
      { day: 2, points: 30 },
      { day: 3, points: 40 },
      { day: 4, points: 50 },
      { day: 5, points: 60 },
      { day: 6, points: 70 },
      { day: 7, points: 100 },
      { day: 8, points: 120 },
      { day: 9, points: 140 },
      { day: 10, points: 160 },
      { day: 11, points: 180 },
      { day: 12, points: 200 },
      { day: 13, points: 220 },
      { day: 14, points: 250 },
      { day: 15, points: 300 },
      { day: 16, points: 350 },
      { day: 17, points: 400 },
      { day: 18, points: 450 },
      { day: 19, points: 500 },
      { day: 20, points: 550 },
      { day: 21, points: 600 },
      { day: 22, points: 650 },
      { day: 23, points: 700 },
      { day: 24, points: 750 },
      { day: 25, points: 800 },
      { day: 26, points: 850 },
      { day: 27, points: 900 },
      { day: 28, points: 950 },
      { day: 29, points: 1000 },
      { day: 30, points: 1500 }
    ];
    
    res.json({
      success: true,
      rewards
    });
    
  } catch (error) {
    console.error("Error fetching rewards:", error);
    res.status(500).json({
      error: "Failed to fetch rewards"
    });
  }
});

// POST /api/points/checkin - Daily check-in
router.post("/checkin", authMiddleware, checkinLimiter, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (user.lastCheckin) {
      const lastCheckin = new Date(user.lastCheckin);
      lastCheckin.setHours(0, 0, 0, 0);

      if (lastCheckin.getTime() === today.getTime()) {
        return res.status(400).json({
          error: "Already checked in today",
          nextCheckin: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        });
      }
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let streakDays = 1;

    if (user.lastCheckin) {
      const lastCheckin = new Date(user.lastCheckin);
      lastCheckin.setHours(0, 0, 0, 0);

      if (lastCheckin.getTime() === yesterday.getTime()) {
        streakDays = (user.streakDays || 0) + 1;
      }
    }

    const streakRewards = [
      20, 30, 40, 50, 60, 70, 100, 120, 140, 160,
      180, 200, 220, 250, 300, 350, 400, 450, 500, 550,
      600, 650, 700, 750, 800, 850, 900, 950, 1000, 1500
    ];

    const rewardIndex = Math.min(streakDays - 1, streakRewards.length - 1);
    const points = streakRewards[rewardIndex];

    const result = await prisma.$transaction([
      prisma.checkin.create({
        data: {
          userId: userId,
          wallet: user.wallet,
          day: streakDays,
          points: points
        }
      }),

      prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: points },
          streakDays: streakDays,
          lastCheckin: new Date()
        }
      }),

      prisma.pointsLedger.create({
        data: {
          userId: userId,
          wallet: user.wallet,
          amount: points,
          type: "checkin",
          reason: `Daily check-in - Day ${streakDays}`
        }
      })
    ]);

    res.json({
      success: true,
      streakDays: streakDays,
      points: points,
      newBalance: user.points + points,
      message: `Day ${streakDays} check-in complete! +${points} points`
    });

  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({
      error: "Check-in failed"
    });
  }
});

// GET /api/points/leaderboard - Leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const users = await prisma.user.findMany({
      orderBy: [
        { points: 'desc' },
        { winRate: 'desc' }
      ],
      select: {
        id: true,
        wallet: true,
        points: true,
        winRate: true,
        totalBets: true,
        totalWins: true,
        streakDays: true,
        createdAt: true
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.user.count();

    const leaderboard = users.map((user, index) => ({
      rank: parseInt(offset) + index + 1,
      id: user.id,
      wallet: maskWallet(user.wallet),
      points: user.points,
      winRate: user.winRate,
      totalBets: user.totalBets,
      totalWins: user.totalWins,
      streakDays: user.streakDays,
      joinDate: user.createdAt
    }));

    res.json({
      success: true,
      leaderboard,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      error: "Failed to fetch leaderboard"
    });
  }
});

// GET /api/points/stats - Статистика поинтов
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    // Получаем общую статистику пользователя
    const earned = await prisma.pointsLedger.aggregate({
      where: {
        userId: req.userId,
        amount: { gt: 0 }
      },
      _sum: { amount: true }
    });
    
    const spent = await prisma.pointsLedger.aggregate({
      where: {
        userId: req.userId,
        amount: { lt: 0 }
      },
      _sum: { amount: true }
    });
    
    // Статистика по типам
    const byType = await prisma.pointsLedger.groupBy({
      by: ['type'],
      where: { userId: req.userId },
      _sum: { amount: true },
      _count: true
    });
    
    // Последние чекины
    const checkins = await prisma.checkin.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 30
    });
    
    res.json({
      success: true,
      stats: {
        totalEarned: earned._sum.amount || 0,
        totalSpent: Math.abs(spent._sum.amount || 0),
        byType: byType,
        recentCheckins: checkins
      }
    });
    
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      error: "Failed to fetch stats"
    });
  }
});

export default router;
