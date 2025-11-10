import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create checkin rewards
  const checkinRewards = [
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

  for (const reward of checkinRewards) {
    await prisma.checkinReward.upsert({
      where: { day: reward.day },
      update: { points: reward.points },
      create: reward
    });
  }

  console.log('✅ Created checkin rewards');

  // Initialize system stats
  await prisma.systemStats.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      aiWinRate: 0,
      aiTotalBets: 0,
      aiTotalWins: 0,
      totalUsers: 0,
      totalUserBets: 0,
      totalVolume: 0
    }
  });

  console.log('✅ Initialized system stats');

  // Create test user (optional - for development)
  if (process.env.NODE_ENV === 'development') {
    const testUser = await prisma.user.upsert({
      where: { wallet: '0x742d35cc6634c0532925a3b844bc9e7595f0beb3' },
      update: {},
      create: {
        wallet: '0x742d35cc6634c0532925a3b844bc9e7595f0beb3',
        points: 5000,
        winRate: 65.5,
        totalBets: 20,
        totalWins: 13,
        streakDays: 7
      }
    });

    await prisma.pointsLedger.create({
      data: {
        userId: testUser.id,
        amount: 5000,
        type: 'signup',
        reason: 'Test user initial balance'
      }
    });

    console.log('✅ Created test user');
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
