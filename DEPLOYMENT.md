# 🚀 Руководство по деплою PolySynapse

## Оглавление
- [Требования](#требования)
- [Локальная разработка](#локальная-разработка)
- [Production деплой](#production-деплой)
- [Настройка базы данных](#настройка-базы-данных)
- [Environment переменные](#environment-переменные)
- [Мониторинг](#мониторинг)

---

## Требования

### Минимальные
- Node.js 18+
- PostgreSQL 14+
- 1GB RAM
- 10GB диск

### Рекомендуемые (Production)
- Node.js 20+
- PostgreSQL 15+
- 2GB RAM
- 20GB SSD
- SSL сертификат

---

## Локальная разработка

### 1. Клонирование и установка

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd polysynapse-full

# Установите все зависимости
npm run install:all
```

### 2. Настройка базы данных

```bash
# Создайте базу данных
sudo -u postgres psql
CREATE DATABASE polysynapse_db;
CREATE USER polysynapse_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE polysynapse_db TO polysynapse_user;
\q
```

### 3. Конфигурация

```bash
# Backend
cd backend
cp .env.example .env
# Отредактируйте .env файл

# Frontend
cd ../frontend
cp .env.example .env.local
# Отредактируйте .env.local файл
```

### 4. Миграции

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed  # Опционально
```

### 5. Запуск

```bash
# Из корневой директории
npm run dev
```

Откройте:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

---

## Production деплой

### Вариант 1: VPS (Ubuntu/Debian)

#### Подготовка сервера

```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установите PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установите PM2
sudo npm install -g pm2

# Установите Nginx (для reverse proxy)
sudo apt install -y nginx

# Установите certbot (для SSL)
sudo apt install -y certbot python3-certbot-nginx
```

#### Настройка базы данных

```bash
sudo -u postgres psql

CREATE DATABASE polysynapse_db;
CREATE USER polysynapse_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE polysynapse_db TO polysynapse_user;

# Для production безопасность
ALTER DATABASE polysynapse_db OWNER TO polysynapse_user;
\q
```

#### Деплой приложения

```bash
# Клонируйте репозиторий
cd /var/www
git clone <your-repo-url> polysynapse
cd polysynapse

# Установите зависимости
npm run install:all

# Настройте environment
cd backend
cp .env.example .env
nano .env  # Отредактируйте все переменные

cd ../frontend
cp .env.example .env.local
nano .env.local

# Запустите миграции
cd ../backend
npx prisma generate
npx prisma migrate deploy

# Билд фронтенда
cd ../frontend
npm run build

# Запустите backend с PM2
cd ../backend
pm2 start server.js --name polysynapse-api
pm2 save
pm2 startup  # Следуйте инструкциям

# Запустите frontend с PM2
cd ../frontend
pm2 start npm --name polysynapse-frontend -- start
pm2 save
```

#### Настройка Nginx

```bash
sudo nano /etc/nginx/sites-available/polysynapse
```

Добавьте конфигурацию:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активируйте конфигурацию
sudo ln -s /etc/nginx/sites-available/polysynapse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### SSL сертификат

```bash
# Получите SSL сертификат
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal (уже настроен)
sudo certbot renew --dry-run
```

#### Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

### Вариант 2: Docker

#### Dockerfile для Backend

Создайте `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 4000

CMD ["node", "server.js"]
```

#### Dockerfile для Frontend

Создайте `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: polysynapse_db
      POSTGRES_USER: polysynapse_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://polysynapse_user:${DB_PASSWORD}@postgres:5432/polysynapse_db
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_KEY: ${ADMIN_KEY}
      PORT: 4000
      FRONTEND_URL: ${FRONTEND_URL}
    ports:
      - "4000:4000"
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

```bash
# Запуск
docker-compose up -d

# Миграции
docker-compose exec backend npx prisma migrate deploy

# Логи
docker-compose logs -f

# Остановка
docker-compose down
```

---

### Вариант 3: Heroku

#### Backend

```bash
cd backend

# Создайте Heroku app
heroku create your-app-name-api

# Добавьте PostgreSQL
heroku addons:create heroku-postgresql:mini

# Установите environment переменные
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set JWT_SECRET=your-secret
heroku config:set ADMIN_KEY=your-admin-key
heroku config:set FRONTEND_URL=https://your-frontend.vercel.app

# Деплой
git push heroku main

# Миграции
heroku run npx prisma migrate deploy
```

#### Frontend на Vercel

```bash
cd frontend

# Установите Vercel CLI
npm i -g vercel

# Деплой
vercel

# Установите environment переменную
vercel env add NEXT_PUBLIC_API_URL
# Введите: https://your-app-name-api.herokuapp.com/api

# Production деплой
vercel --prod
```

---

### Вариант 4: Railway

1. Создайте аккаунт на [railway.app](https://railway.app)
2. Подключите GitHub репозиторий
3. Railway автоматически обнаружит `backend` и `frontend`
4. Добавьте PostgreSQL через Marketplace
5. Установите environment переменные через Dashboard
6. Railway автоматически задеплоит при push в main

---

### Вариант 5: DigitalOcean App Platform

1. Создайте аккаунт на DigitalOcean
2. Перейдите в App Platform
3. Подключите GitHub репозиторий
4. Создайте Managed PostgreSQL Database
5. Настройте компоненты:
   - Backend (Node.js)
   - Frontend (Static Site)
6. Установите environment переменные
7. Нажмите "Create Resources"

---

## Настройка базы данных

### Production оптимизации PostgreSQL

```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Добавьте:

```conf
# Connections
max_connections = 100

# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 8MB

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query Planning
random_page_cost = 1.1
effective_io_concurrency = 200
```

```bash
sudo systemctl restart postgresql
```

### Backup стратегия

```bash
# Создайте backup скрипт
nano /home/polysynapse/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/polysynapse/backups"
DB_NAME="polysynapse_db"
DB_USER="polysynapse_user"

mkdir -p $BACKUP_DIR

pg_dump -U $DB_USER -d $DB_NAME -F c -f $BACKUP_DIR/backup_$DATE.dump

# Удаляем старые бекапы (старше 7 дней)
find $BACKUP_DIR -name "backup_*.dump" -mtime +7 -delete
```

```bash
chmod +x /home/polysynapse/backup.sh

# Добавьте в cron (ежедневно в 3:00 AM)
crontab -e
0 3 * * * /home/polysynapse/backup.sh
```

---

## Environment переменные

### Backend (.env)

```env
# КРИТИЧНО - обязательно замените!
DATABASE_URL="postgresql://user:password@host:5432/database"
OPENAI_API_KEY="sk-..."
JWT_SECRET="change-this-to-random-secret"
ADMIN_KEY="change-this-admin-key"

# Server
PORT=4000
NODE_ENV=production
FRONTEND_URL="https://yourdomain.com"

# AI Settings
RUN_AI_ON_START=true
AI_CONFIDENCE_THRESHOLD=0.70
AI_MIN_ENTRY_PRICE=0.05
AI_MAX_ENTRY_PRICE=0.90
AI_MIN_EDGE=0.03
AI_BETS_PER_CATEGORY=2
AI_MAX_MARKET_DAYS=90
AI_STAKE_AMOUNT=100

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

---

## Мониторинг

### PM2 Monitoring

```bash
# Статус
pm2 status

# Логи
pm2 logs

# Мониторинг в реальном времени
pm2 monit

# Restart
pm2 restart all

# Stop
pm2 stop all
```

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/health

# Database connection
cd backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$queryRaw\`SELECT 1\`.then(() => console.log('DB OK')).catch(e => console.error('DB Error:', e))"
```

### Logs

```bash
# Backend logs
pm2 logs polysynapse-api --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## Troubleshooting

### Backend не запускается

```bash
# Проверьте логи
pm2 logs polysynapse-api

# Проверьте подключение к БД
cd backend
npx prisma db pull

# Переустановите зависимости
rm -rf node_modules package-lock.json
npm install
```

### Frontend ошибки

```bash
# Пересоберите
cd frontend
rm -rf .next node_modules
npm install
npm run build
pm2 restart polysynapse-frontend
```

### Database проблемы

```bash
# Проверьте connection string
echo $DATABASE_URL

# Проверьте PostgreSQL статус
sudo systemctl status postgresql

# Проверьте логи
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### SSL Issues

```bash
# Обновите сертификат
sudo certbot renew

# Проверьте Nginx конфигурацию
sudo nginx -t

# Перезапустите Nginx
sudo systemctl restart nginx
```

---

## Обновления

### Обновление кода

```bash
cd /var/www/polysynapse

# Backup базы данных
./backup.sh

# Pull latest code
git pull origin main

# Backend
cd backend
npm install
npx prisma migrate deploy
pm2 restart polysynapse-api

# Frontend
cd ../frontend
npm install
npm run build
pm2 restart polysynapse-frontend
```

---

## Безопасность

### Checklist

- ✅ Смените все секретные ключи в .env
- ✅ Используйте сильные пароли для PostgreSQL
- ✅ Настройте firewall (UFW)
- ✅ Установите SSL сертификат
- ✅ Регулярные backup'ы базы данных
- ✅ Обновляйте зависимости (`npm audit`)
- ✅ Мониторинг логов на подозрительную активность
- ✅ Rate limiting включен
- ✅ CORS правильно настроен
- ✅ PostgreSQL доступен только локально

---

## Поддержка

При возникновении проблем:
1. Проверьте логи
2. Проверьте environment переменные
3. Проверьте статус всех сервисов
4. Создайте Issue на GitHub с детальным описанием

---

**Удачного деплоя! 🚀**
