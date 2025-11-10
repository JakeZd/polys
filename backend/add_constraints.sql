cd /root/Polymarket261025/

# Создайте файл add_constraints.sql
cat > add_constraints.sql << 'EOF'
ALTER TABLE "User" ADD CONSTRAINT "User_points_check" 
  CHECK (points >= 0);

ALTER TABLE "User" ADD CONSTRAINT "User_winRate_check" 
  CHECK ("winRate" >= 0 AND "winRate" <= 1);

ALTER TABLE "User" ADD CONSTRAINT "User_totalBets_check" 
  CHECK ("totalBets" >= 0);

ALTER TABLE "User" ADD CONSTRAINT "User_totalWins_check" 
  CHECK ("totalWins" >= 0);

ALTER TABLE "User" ADD CONSTRAINT "User_streakDays_check" 
  CHECK ("streakDays" >= 0);

ALTER TABLE "AIBet" ADD CONSTRAINT "AIBet_stake_check" 
  CHECK (stake >= 0);

ALTER TABLE "AIBet" ADD CONSTRAINT "AIBet_entryPrice_check" 
  CHECK ("entryPrice" >= 0 AND "entryPrice" <= 1);

ALTER TABLE "AIBet" ADD CONSTRAINT "AIBet_confidence_check" 
  CHECK (confidence >= 0 AND confidence <= 1);

ALTER TABLE "UserBet" ADD CONSTRAINT "UserBet_stake_check" 
  CHECK (stake >= 10 AND stake <= 10000);

ALTER TABLE "UserBet" ADD CONSTRAINT "UserBet_entryPrice_check" 
  CHECK ("entryPrice" >= 0 AND "entryPrice" <= 1);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_createdAt_idx" 
  ON "User" ("createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_lastCheckin_idx" 
  ON "User" ("lastCheckin");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Market_composite_idx" 
  ON "Market" (category, resolved, "endTime");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Market_volume_idx" 
  ON "Market" (volume DESC NULLS LAST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "UserBet_userId_settled_idx" 
  ON "UserBet" ("userId", settled);
EOF

# Теперь запустите
psql -U polysynapse_user -d polysynapse_db -f add_constraints.sql