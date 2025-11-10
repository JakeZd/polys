# 🚀 PolySynapse - Quick Start Guide

## Prerequisites

1. **Install Required Software**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Install PM2 (for production)
npm install -g pm2
```

2. **Setup PostgreSQL Database**
```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE polysynapse_db;
CREATE USER polysynapse_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE polysynapse_db TO polysynapse_user;
\q
```

## Installation Steps

### 1. Clone/Copy the Project
```bash
cd /path/to/your/project
# Copy all files from the output directory
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Required .env settings:**
```env
DATABASE_URL="postgresql://polysynapse_user:your_secure_password@localhost:5432/polysynapse_db"
OPENAI_API_KEY="sk-your-openai-api-key"
JWT_SECRET="generate-a-random-secret-key-here"
ADMIN_KEY="your-admin-secret-key"
PORT=4000
```

### 4. Setup Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed initial data
npm run prisma:seed
```

### 5. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
# Using PM2
pm2 start server.js --name polysynapse
pm2 save
pm2 startup
```

### 6. Access the Platform
- Frontend: http://localhost:4000
- API: http://localhost:4000/api

## 🔧 Configuration Details

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add it to your .env file

### Web3 Wallet Connection
- Users need MetaMask or another Web3 wallet
- Works on any EVM-compatible network
- No real crypto required (only signatures)

### Admin Access
Use the admin endpoints with `x-admin-key` header:
```bash
# Trigger AI analysis manually
curl -X POST http://localhost:4000/api/admin/ai/run \
  -H "x-admin-key: your-admin-secret-key"

# Get system stats
curl http://localhost:4000/api/admin/stats \
  -H "x-admin-key: your-admin-secret-key"
```

## 🎮 Using the Platform

### For Users:
1. **Connect Wallet** - Click "Connect Wallet" and sign with MetaMask
2. **Get 1000 Points** - Automatically credited on first login
3. **Daily Check-in** - Get bonus points every day (streak increases rewards)
4. **Place Bets** - Agree or disagree with AI predictions
5. **Track Progress** - View leaderboard and your betting history

### AI Betting:
- Runs automatically every 2 hours
- Analyzes markets from Polymarket
- Stakes 100 points per bet
- Minimum 65% confidence threshold
- Provides reasoning in English

## 📊 Database Management

### View Database
```bash
npx prisma studio
```
Opens at http://localhost:5555

### Reset Database
```bash
npx prisma migrate reset
```

### Backup Database
```bash
pg_dump -U ai_user -h localhost ai_vs_human_db > backup.sql
```

### Restore Database
```bash
psql -U ai_user -h localhost ai_vs_human_db < backup.sql
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 4000
lsof -i :4000
# Kill the process
kill -9 [PID]
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### OpenAI API Errors
- Check API key is valid
- Ensure you have credits in your OpenAI account
- Check rate limits

### WebSocket Issues (if enabled)
```bash
# Enable in .env
ENABLE_WEBSOCKET=true

# Check firewall
sudo ufw allow 4000
```

## 📈 Monitoring

### PM2 Monitoring
```bash
# View logs
pm2 logs ai-vs-human

# Monitor CPU/Memory
pm2 monit

# View status
pm2 status
```

### Health Check
```bash
curl http://localhost:4000/health
```

## 🔐 Security Recommendations

1. **Use HTTPS in Production**
   - Setup SSL certificates with Let's Encrypt
   - Use Nginx as reverse proxy

2. **Secure Database**
   - Use strong passwords
   - Limit connections to localhost
   - Regular backups

3. **API Rate Limiting**
   - Configure in .env
   - Adjust based on traffic

4. **Environment Variables**
   - Never commit .env to git
   - Use secrets management in production

## 📝 API Testing

### Postman Collection
Import the following endpoints:
- GET /api/markets
- GET /api/leaderboard
- POST /api/auth/verify
- POST /api/bets/place

### Example API Calls

**Get Active Markets:**
```bash
curl http://localhost:4000/api/markets
```

**Get AI Bets:**
```bash
curl http://localhost:4000/api/bets/ai
```

**Get Leaderboard:**
```bash
curl http://localhost:4000/api/leaderboard
```

## 🚀 Production Deployment

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["node", "server.js"]
```

### Using Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📞 Support

For issues or questions:
1. Check the README.md
2. Review error logs: `pm2 logs`
3. Check database: `npx prisma studio`

## ✅ Checklist Before Going Live

- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET
- [ ] Configure proper ADMIN_KEY
- [ ] Setup SSL certificate
- [ ] Configure firewall rules
- [ ] Setup database backups
- [ ] Test all endpoints
- [ ] Monitor error rates
- [ ] Setup alerts for failures
- [ ] Document API for users

Good luck with your AI vs Human platform! 🎉
