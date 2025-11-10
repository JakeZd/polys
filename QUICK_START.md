# Quick Start Guide - PolySynapse

## ✅ Web3 Wallet Integration готова к использованию!

### Шаг 1: Установка зависимостей (уже выполнено)

Все зависимости уже установлены. Если нужно переустановить:

```bash
# В корневой директории проекта
cd /home/user/polys
npm install
```

**Важно:** Это workspace проект, поэтому устанавливать зависимости нужно из корня!

### Шаг 2: Настройка переменных окружения

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Отредактируйте `.env` и установите:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/polysynapse"
JWT_SECRET="your-secret-key-change-this-in-production"
OPENAI_API_KEY="sk-your-openai-api-key"
```

#### Frontend (.env.local) - уже создан
```bash
cd ../frontend
```

Файл `frontend/.env.local` уже содержит:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=demo_project_id_replace_in_production
```

**Для production:** Получите свой WalletConnect Project ID:
1. Перейдите на https://cloud.walletconnect.com
2. Создайте проект
3. Замените `demo_project_id_replace_in_production` на ваш ID

### Шаг 3: Настройка базы данных

```bash
cd backend

# Применить миграции
npx prisma migrate dev

# (Опционально) Заполнить тестовыми данными
npm run prisma:seed
```

### Шаг 4: Запуск проекта

#### Вариант 1: Запустить всё сразу (из корня)
```bash
cd /home/user/polys
npm run dev
```

Это запустит:
- Backend на http://localhost:4000
- Frontend на http://localhost:3000

#### Вариант 2: Запустить отдельно

**Терминал 1 - Backend:**
```bash
cd /home/user/polys/backend
npm run dev
```

**Терминал 2 - Frontend:**
```bash
cd /home/user/polys/frontend
npm run dev
```

### Шаг 5: Тестирование Web3 подключения

1. Откройте браузер: http://localhost:3000

2. Убедитесь, что у вас установлен Web3 кошелек:
   - MetaMask (расширение для браузера)
   - Rabby Wallet
   - Или любой другой совместимый кошелек

3. Нажмите кнопку **"Connect Wallet"**

4. Выберите кошелек из списка:
   - **MetaMask** - прямое подключение через расширение
   - **WalletConnect** - QR код для мобильных кошельков
   - **Coinbase Wallet**
   - **Rabby Wallet**

5. Подтвердите подключение в кошельке

6. Подпишите сообщение (бесплатно, не транзакция)

7. Готово! Вы авторизованы и можете использовать приложение

## 🎯 Что работает:

### ✅ Web3 Wallet Integration
- Подключение MetaMask, WalletConnect, Coinbase Wallet, Rabby Wallet
- Криптографическая верификация подписи
- JWT authentication с 7-дневным сроком
- Автоматическое создание пользователя в БД

### ✅ Prediction Markets
- Просмотр рынков предсказаний
- Ставки с использованием очков
- Просмотр истории ставок
- Отслеживание прибыли/убытков

### ✅ AI Recommendations
- AI анализ рынков через OpenAI
- Рекомендации по ставкам
- Confidence scores
- Reasoning объяснения

### ✅ Points System
- Ежедневный check-in с бонусами
- Streak система (подряд дней)
- Начальные 1000 очков для новых пользователей
- Лидерборд

## 🔧 Troubleshooting

### Ошибка: "Module not found: @web3modal/ethers/react"

**Решение:**
```bash
# Убедитесь, что зависимости установлены из корня
cd /home/user/polys
npm install
```

### Ошибка: "Cannot connect to database"

**Решение:**
```bash
# Убедитесь, что PostgreSQL запущен
# Проверьте DATABASE_URL в backend/.env
# Примените миграции
cd backend
npx prisma migrate dev
```

### Ошибка: "WalletConnect connection failed"

**Решение:**
1. Проверьте, что `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` установлен в `frontend/.env.local`
2. Для тестирования можно использовать демо ID, но в production нужен реальный
3. Получите ID на https://cloud.walletconnect.com

### Frontend не компилируется

**Решение:**
```bash
# Очистите кеш и пересоберите
cd frontend
rm -rf .next node_modules
cd ..
npm install
cd frontend
npm run dev
```

### Backend ошибки аутентификации

**Решение:**
1. Проверьте, что JWT_SECRET установлен в backend/.env
2. Проверьте, что backend запущен на порту 4000
3. Проверьте NEXT_PUBLIC_API_URL в frontend/.env.local

## 📚 Дополнительные команды

### Database

```bash
cd backend

# Открыть Prisma Studio (GUI для БД)
npx prisma studio

# Создать новую миграцию
npx prisma migrate dev --name your_migration_name

# Сбросить БД (осторожно!)
npx prisma migrate reset
```

### Build для production

```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd backend
npm start
```

### Type checking

```bash
# Frontend
cd frontend
npm run type-check
```

## 🔗 Полезные ссылки

- **Основная документация:** [WEB3_SETUP.md](WEB3_SETUP.md)
- **Web3Modal Docs:** https://docs.walletconnect.com/web3modal/about
- **Ethers.js Docs:** https://docs.ethers.org/
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs

## 🎉 Готово!

Ваш Web3 prediction market platform полностью настроен и готов к использованию!

Если возникли вопросы, проверьте:
1. Логи в терминале
2. Консоль браузера (F12)
3. Network tab в DevTools
4. Backend логи

Удачи! 🚀
