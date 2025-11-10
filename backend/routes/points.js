import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "./auth.js";

const router = express.Router();
const prisma = new PrismaClient();

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
