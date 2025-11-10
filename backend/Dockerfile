FROM node:20-alpine

# Установка необходимых зависимостей для Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Создаем non-root пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if(r.statusCode !== 200) throw new Error('Failed')})"

CMD ["node", "server.js"]
