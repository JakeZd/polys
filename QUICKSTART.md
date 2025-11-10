# ⚡ Быстрый старт PolySynapse

## 🚀 Самый быстрый способ (5 минут)

### 1. Установка

```bash
# Запустите setup скрипт
chmod +x setup.sh
./setup.sh
```

### 2. Настройка базы данных

```bash
# Создайте PostgreSQL базу
createdb polysynapse_db

# Примените миграции
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed  # Опционально - добавит тестовые данные
cd ..
```

### 3. Конфигурация

Отредактируйте `backend/.env`:

```env
DATABASE_URL="postgresql://polysynapse_user:password@localhost:5432/polysynapse_db"
OPENAI_API_KEY="sk-..."  # ← ОБЯЗАТЕЛЬНО!
JWT_SECRET="your-secret"
ADMIN_KEY="your-admin-key"
```

### 4. Запуск

```bash
npm run dev
```

Откройте:
- 🌐 Frontend: http://localhost:3000
- 🔌 Backend: http://localhost:4000

---

## 🐳 Еще быстрее с Docker (3 минуты)

### 1. Настройте .env

```bash
cp .env.example .env
nano .env  # Добавьте OPENAI_API_KEY
```

### 2. Запустите

```bash
docker-compose up -d
```

### 3. Миграции

```bash
docker-compose exec backend npx prisma migrate deploy
```

Готово! Откройте http://localhost:3000

---

## 📝 Минимальные требования

- ✅ Node.js 18+
- ✅ PostgreSQL 14+ (или используйте Docker)
- ✅ OpenAI API ключ

---

## 🆘 Проблемы?

### Backend не запускается
```bash
cd backend
npm install
npx prisma generate
```

### Frontend ошибки
```bash
cd frontend
rm -rf .next node_modules
npm install
```

### База данных
```bash
# Проверьте PostgreSQL
psql -l

# Пересоздайте миграции
cd backend
npx prisma migrate reset
```

---

## 📚 Подробная документация

- 📖 [README.md](README.md) - Полная документация
- 🚀 [DEPLOYMENT.md](DEPLOYMENT.md) - Гайд по деплою
- 💻 [backend/README.md](backend/README.md) - Backend API
- 🎨 [frontend/README.md](frontend/README.md) - Frontend UI

---

**Удачи! 🎉**
