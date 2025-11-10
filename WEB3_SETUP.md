# Web3 Wallet Integration Setup

## Обзор

Ваш проект теперь поддерживает полноценное подключение Web3 кошельков, включая:
- MetaMask
- WalletConnect
- Coinbase Wallet
- Rabby Wallet
- И многие другие

## Что было сделано

### 1. Установлены библиотеки
```bash
npm install @web3modal/ethers ethers@^6.9.0
```

### 2. Созданные файлы
- `/frontend/src/providers/Web3Provider.tsx` - Провайдер для Web3Modal
- `/frontend/src/hooks/useWeb3Wallet.ts` - Хук для работы с кошельками
- `/frontend/app/layout.tsx` - Обновлен для включения Web3Provider
- `/frontend/src/components/ConnectWalletModal.tsx` - Полностью переработан для Web3

## Настройка

### Шаг 1: Получите WalletConnect Project ID

1. Перейдите на https://cloud.walletconnect.com
2. Создайте аккаунт или войдите
3. Создайте новый проект
4. Скопируйте Project ID

### Шаг 2: Настройте переменные окружения

Откройте файл `/frontend/.env.local` и замените значение:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=ваш_реальный_project_id
```

## Как это работает

### Полный flow аутентификации:

1. **Пользователь нажимает "Connect Wallet"**
   - Открывается модальное окно с выбором кошельков

2. **Пользователь выбирает кошелек** (MetaMask, WalletConnect, и т.д.)
   - Web3Modal управляет подключением

3. **Backend генерирует сообщение для подписи**
   - `GET /api/auth/message?wallet=0x...`
   - Возвращает уникальное сообщение с nonce

4. **Пользователь подписывает сообщение в кошельке**
   - Это НЕ транзакция, это бесплатно
   - Подтверждает владение кошельком

5. **Backend верифицирует подпись**
   - `POST /api/auth/verify`
   - Проверяет криптографическую подпись
   - Создает или находит пользователя в БД
   - Выдает JWT токен

6. **Пользователь авторизован**
   - JWT токен сохраняется в localStorage
   - Автоматически добавляется ко всем API запросам
   - Пользователь может делать ставки

## Тестирование

### Локальная разработка

1. Запустите backend:
```bash
cd backend
npm run dev
```

2. Запустите frontend:
```bash
cd frontend
npm run dev
```

3. Откройте http://localhost:3000

4. Нажмите "Connect Wallet"

5. Выберите кошелек (нужно иметь установленный MetaMask или другой кошелек)

### Важно для тестирования

- У вас должен быть установлен MetaMask или другое расширение кошелька
- Для WalletConnect будет работать QR код для мобильных кошельков
- В тестовой сети (Sepolia, Goerli) можно получить бесплатные токены из faucet

## Структура кода

```
frontend/
├── src/
│   ├── providers/
│   │   └── Web3Provider.tsx          # Конфигурация Web3Modal
│   ├── hooks/
│   │   ├── useWeb3Wallet.ts          # Хук для работы с кошельками
│   │   └── useAuth.ts                 # Хуки аутентификации
│   ├── components/
│   │   └── ConnectWalletModal.tsx    # UI для подключения
│   └── api/
│       └── auth.ts                    # API методы
└── app/
    └── layout.tsx                     # Web3Provider добавлен здесь
```

## API Endpoints (Backend)

### `GET /api/auth/message?wallet=0x...`
Генерирует сообщение для подписи

**Response:**
```json
{
  "message": "Welcome to PolySynapse! Sign this message to verify your wallet...",
  "nonce": "random-nonce-value"
}
```

### `POST /api/auth/verify`
Верифицирует подпись и авторизует пользователя

**Request:**
```json
{
  "wallet": "0x...",
  "signature": "0x...",
  "message": "Welcome to PolySynapse!..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "wallet": "0x...",
    "points": 1000,
    "isNew": true
  }
}
```

## Безопасность

- ✅ Криптографическая верификация подписи
- ✅ Уникальные nonce для предотвращения replay атак
- ✅ JWT токены с 7-дневным сроком действия
- ✅ Rate limiting на auth endpoints
- ✅ Автоматическое обновление токенов в headers

## Troubleshooting

### Проблема: "Project ID not found"
**Решение:** Убедитесь, что вы добавили `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` в `.env.local`

### Проблема: Кошелек не подключается
**Решение:**
1. Убедитесь, что MetaMask или другой кошелек установлен
2. Проверьте консоль браузера на ошибки
3. Попробуйте обновить страницу

### Проблема: Подпись не проходит верификацию
**Решение:**
1. Проверьте, что backend запущен
2. Убедитесь, что адрес кошелька правильный
3. Проверьте логи backend на ошибки

### Проблема: Backend не доступен
**Решение:**
1. Проверьте, что backend запущен на порту 4000
2. Проверьте `NEXT_PUBLIC_API_URL` в `.env.local`
3. Убедитесь, что нет CORS ошибок

## Production Deployment

### Frontend
1. Получите Production WalletConnect Project ID
2. Обновите `.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_production_project_id
```

### Backend
Убедитесь, что в backend `.env` настроены:
```env
JWT_SECRET=secure-random-secret
DATABASE_URL=postgresql://...
NODE_ENV=production
```

## Дополнительные возможности

### Добавить поддержку других сетей

Отредактируйте `/frontend/src/providers/Web3Provider.tsx`:

```typescript
const arbitrum = {
  chainId: 42161,
  name: 'Arbitrum One',
  currency: 'ETH',
  explorerUrl: 'https://arbiscan.io',
  rpcUrl: 'https://arb1.arbitrum.io/rpc'
};

// Добавьте в массив chains
chains: [mainnet, polygon, arbitrum]
```

### Кастомизация темы

В `Web3Provider.tsx`:

```typescript
themeVariables: {
  '--w3m-accent': '#6366f1',        // Основной цвет
  '--w3m-border-radius-master': '8px', // Радиус скругления
  '--w3m-font-family': 'Orbitron'   // Шрифт
}
```

## Дополнительная информация

- [Web3Modal Документация](https://docs.walletconnect.com/web3modal/about)
- [Ethers.js Документация](https://docs.ethers.org/)
- [MetaMask Документация](https://docs.metamask.io/)

## Поддержка

Если у вас возникли проблемы, проверьте:
1. Консоль браузера на ошибки
2. Логи backend сервера
3. Network tab в DevTools для проверки API запросов
