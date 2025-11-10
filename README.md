# 🧠 PolySynapse - Платформа предсказательных рынков с AI

PolySynapse - полнофункциональная платформа, где искусственный интеллект соревнуется с пользователями на предсказательных рынках на основе данных Polymarket.

## 🚀 Основные возможности

### Для пользователей:
- ✅ **Web3 аутентификация** через MetaMask и другие кошельки
- 💰 **1000 поинтов** за регистрацию
- 🎯 **Ставки на рынки** - соглашайтесь с AI или играйте против него
- 📅 **Ежедневные бонусы** - до 1500 поинтов за 30-дневный стрик
- 🏆 **Рейтинг игроков** - таблица лидеров
- 📊 **Live цены** с Polymarket

### AI функционал:
- 🤖 **Автоанализ рынков** каждые 2 часа
- 🔍 **Поиск информации** в интернете
- 📈 **Расчет EV и edge**
- 💬 **Объяснения решений**
- 📊 **Отслеживание винрейта**

### Технологии:
- **Backend**: Node.js, Express, PostgreSQL, Prisma ORM
- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **AI**: OpenAI GPT-4
- **Web3**: Ethers.js
- **Realtime**: Socket.io (опционально)

## 📋 Требования

- Node.js 18+
- PostgreSQL 14+
- OpenAI API ключ
- npm или yarn

## 🛠 Быстрый старт

### 1. Установка зависимостей

```bash
# Установка зависимостей бэкенда
cd backend
npm install

# Установка зависимостей фронтенда
cd ../frontend
npm install
```

### 2. Настройка базы данных

```bash
# Создайте PostgreSQL базу данных
createdb polysynapse_db

# Или через psql
psql -U postgres
CREATE DATABASE polysynapse_db;
CREATE USER polysynapse_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE polysynapse_db TO polysynapse_user;
\q
```

### 3. Конфигурация

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Отредактируйте `backend/.env`:
```env
DATABASE_URL="postgresql://polysynapse_user:your_password@localhost:5432/polysynapse_db"
OPENAI_API_KEY="sk-..."
JWT_SECRET="your-secret-key"
ADMIN_KEY="your-admin-key"
PORT=4000
RUN_AI_ON_START=true
FRONTEND_URL="http://localhost:3000"

# AI настройки
AI_CONFIDENCE_THRESHOLD=0.70
AI_MIN_ENTRY_PRICE=0.05
AI_MAX_ENTRY_PRICE=0.90
AI_MIN_EDGE=0.03
AI_BETS_PER_CATEGORY=2
AI_MAX_MARKET_DAYS=90
AI_STAKE_AMOUNT=100
```

#### Frontend (.env.local)
```bash
cd ../frontend
cp .env.example .env.local
```

Отредактируйте `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 4. Миграции базы данных

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed  # Опционально - заполнит тестовыми данными
```

### 5. Запуск проекта

#### Вариант 1: Два терминала

**Терминал 1 - Backend:**
```bash
cd backend
npm run dev
```

**Терминал 2 - Frontend:**
```bash
cd frontend
npm run dev
```

#### Вариант 2: С помощью npm-run-all (рекомендуется)

Из корневой директории:
```bash
npm install
npm run dev
```

### 6. Открыть приложение

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health
- **Prisma Studio**: `cd backend && npx prisma studio`

## 📁 Структура проекта

```
polysynapse-full/
├── backend/                 # Express.js API
│   ├── config/              # Конфигурация и брендинг
│   ├── migrations/          # Миграции базы данных
│   ├── prisma/              # Prisma схема и сиды
│   ├── public/              # Статичные файлы
│   ├── routes/              # API роуты
│   │   ├── auth.js          # Аутентификация
│   │   ├── markets.js       # Рынки
│   │   ├── bets.js          # Ставки
│   │   ├── points.js        # Поинты
│   │   ├── leaderboard.js   # Лидерборд
│   │   ├── profile.js       # Профили
│   │   └── admin.js         # Админка
│   ├── services/            # Бизнес-логика
│   │   ├── aiBetting.js     # AI анализ
│   │   ├── market.js        # Работа с рынками
│   │   └── settlement.js    # Подсчет результатов
│   ├── server.js            # Главный файл сервера
│   ├── schema.prisma        # Схема базы данных
│   └── package.json
│
├── frontend/                # Next.js приложение
│   ├── app/                 # App Router (Next.js 14)
│   │   ├── page.tsx         # Главная страница
│   │   ├── market/          # Страница рынка
│   │   ├── bets/            # История ставок
│   │   ├── leaderboard/     # Таблица лидеров
│   │   └── profile/         # Профиль пользователя
│   ├── src/
│   │   ├── api/             # API клиенты
│   │   ├── components/      # React компоненты
│   │   ├── hooks/           # Кастомные хуки
│   │   ├── store/           # Zustand state
│   │   ├── types/           # TypeScript типы
│   │   └── providers/       # React провайдеры
│   ├── public/              # Статичные файлы
│   └── package.json
│
├── package.json             # Root package.json
├── .gitignore              # Git ignore
└── README.md               # Этот файл
```

## 🔧 Доступные скрипты

### Root команды
```bash
npm run dev              # Запуск backend + frontend в dev режиме
npm run build            # Билд frontend
npm run start            # Production режим
```

### Backend команды
```bash
cd backend
npm run dev              # Режим разработки с nodemon
npm start                # Production запуск
npm run prisma:generate  # Генерация Prisma Client
npm run prisma:migrate   # Запуск миграций
npm run prisma:studio    # Открыть Prisma Studio
npm run prisma:seed      # Заполнить базу тестовыми данными
```

### Frontend команды
```bash
cd frontend
npm run dev              # Режим разработки
npm run build            # Production билд
npm start                # Production запуск
npm run lint             # Проверка кода
npm run type-check       # Проверка типов TypeScript
```

## 📡 API Endpoints

### Аутентификация
- `GET /api/auth/nonce/:wallet` - Получить nonce для подписи
- `POST /api/auth/verify` - Верифицировать подпись
- `POST /api/auth/checkin` - Ежедневный чекин

### Рынки
- `GET /api/markets` - Список активных рынков
- `GET /api/markets/:id` - Детали рынка
- `GET /api/markets/:id/prices` - История цен
- `GET /api/markets/meta/categories` - Категории

### Ставки
- `POST /api/bets/place` - Сделать ставку
- `GET /api/bets/my` - Мои ставки
- `GET /api/bets/my/:id` - Детали ставки

### Поинты и чекины
- `GET /api/points/balance` - Баланс поинтов
- `GET /api/points/history` - История транзакций
- `GET /api/points/checkin/status` - Статус чекина

### Лидерборд
- `GET /api/leaderboard` - Топ пользователей
- `GET /api/leaderboard/position` - Моя позиция

### Профиль
- `GET /api/profile/me` - Мой профиль
- `GET /api/profile/stats` - Моя статистика

### Админ (требует ADMIN_KEY в заголовке x-admin-key)
- `POST /api/admin/ai/run` - Запустить AI цикл
- `POST /api/admin/settlement/run` - Запустить settlement
- `GET /api/admin/stats` - Системная статистика

## 🤖 AI Configuration

AI анализирует рынки каждые 2 часа и делает ставки на основе:

1. **Web scraping** - поиск новостей и данных
2. **Sentiment analysis** - анализ настроений
3. **Expected Value** - расчет матожидания
4. **Edge calculation** - преимущество над рынком

Настройки в `backend/.env`:
- `AI_CONFIDENCE_THRESHOLD` - минимальная уверенность (0-1)
- `AI_MIN_ENTRY_PRICE` - минимальная цена входа
- `AI_MAX_ENTRY_PRICE` - максимальная цена входа
- `AI_MIN_EDGE` - минимальный edge
- `AI_BETS_PER_CATEGORY` - ставок на категорию

## 🔐 Безопасность

### Rate Limiting
Все API endpoints защищены rate limiting:
- Обычные запросы: 100 req/15min
- Аутентификация: 5 req/15min
- Ставки: 10 req/min

### CORS
```javascript
// backend/server.js
cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
})
```

### JWT
Токены подписываются `JWT_SECRET` и имеют срок действия 7 дней.

## 🚀 Деплой

### Backend (Node.js)

**Heroku / Railway / Render:**
```bash
# Установите переменные окружения
# Деплой через Git
git push heroku main
```

**VPS (Ubuntu):**
```bash
# Установите Node.js, PostgreSQL, PM2
npm install -g pm2
cd backend
npm install
npx prisma migrate deploy
pm2 start server.js --name polysynapse-api
pm2 save
pm2 startup
```

### Frontend (Next.js)

**Vercel (рекомендуется):**
```bash
npm install -g vercel
cd frontend
vercel
```

**Netlify:**
```bash
cd frontend
npm run build
netlify deploy --prod
```

### База данных

**Рекомендуемые хостинги:**
- Supabase (бесплатный tier)
- Railway
- Neon
- DigitalOcean Managed PostgreSQL

## 🐛 Решение проблем

### Backend не запускается
```bash
# Проверьте подключение к БД
cd backend
npx prisma db push

# Проверьте логи
npm run dev
```

### Frontend ошибки CORS
Убедитесь что `FRONTEND_URL` в `backend/.env` указывает на URL фронтенда.

### AI не работает
1. Проверьте `OPENAI_API_KEY`
2. Проверьте баланс OpenAI аккаунта
3. Проверьте логи: `npm run dev` в backend

### База данных ошибки
```bash
cd backend
npx prisma migrate reset  # ВНИМАНИЕ: удалит все данные
npx prisma migrate deploy
npx prisma db seed
```

## 📊 Мониторинг

### Health Check
```bash
curl http://localhost:4000/health
```

### Prisma Studio
```bash
cd backend
npx prisma studio
```

### Логи
Backend логи идут в консоль. Для продакшена используйте:
- PM2 logs: `pm2 logs`
- Docker logs: `docker logs container_name`

## 🤝 Вклад в проект

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

MIT License - используйте свободно!

## 🔗 Полезные ссылки

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Polymarket API](https://docs.polymarket.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [Ethers.js](https://docs.ethers.org/)

## 💬 Поддержка

Если возникли проблемы:
1. Проверьте этот README
2. Посмотрите Issues на GitHub
3. Создайте новый Issue с детальным описанием

---

**Сделано с ❤️ для комьюнити предсказательных рынков**
