#!/bin/bash

echo "🚀 PolySynapse Development Setup"
echo "================================="
echo ""

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 18+ и попробуйте снова."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js 18+. Текущая версия: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) найден"

# Проверка PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL не найден. Установите PostgreSQL или используйте Docker."
    echo "   Инструкции: https://www.postgresql.org/download/"
fi

# Установка зависимостей
echo ""
echo "📦 Установка зависимостей..."
echo ""

# Root dependencies
echo "→ Корневые зависимости..."
npm install

# Backend dependencies
echo "→ Backend зависимости..."
cd backend
npm install
cd ..

# Frontend dependencies
echo "→ Frontend зависимости..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Зависимости установлены!"

# Проверка .env файлов
echo ""
echo "🔧 Проверка конфигурации..."

if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env не найден"
    echo "→ Копирую backend/.env.example в backend/.env"
    cp backend/.env.example backend/.env
    echo "⚠️  ВАЖНО: Отредактируйте backend/.env и укажите:"
    echo "   - DATABASE_URL"
    echo "   - OPENAI_API_KEY"
    echo "   - JWT_SECRET"
    echo "   - ADMIN_KEY"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  frontend/.env.local не найден"
    echo "→ Копирую frontend/.env.example в frontend/.env.local"
    cp frontend/.env.example frontend/.env.local
fi

echo ""
echo "📊 Настройка базы данных..."
echo "→ Запустите следующие команды для настройки PostgreSQL:"
echo ""
echo "   createdb polysynapse_db"
echo "   cd backend"
echo "   npx prisma generate"
echo "   npx prisma migrate deploy"
echo "   npx prisma db seed  # Опционально"
echo ""

echo "================================="
echo "✅ Установка завершена!"
echo ""
echo "📝 Следующие шаги:"
echo ""
echo "1. Настройте PostgreSQL базу данных (см. выше)"
echo "2. Отредактируйте backend/.env файл"
echo "3. Запустите: npm run dev"
echo ""
echo "🌐 После запуска:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:4000"
echo ""
echo "📚 Документация: README.md"
echo "🚀 Деплой: DEPLOYMENT.md"
echo "================================="
