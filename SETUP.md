# Email Scheduler Setup Guide

Complete step-by-step setup for backend and frontend.

## Overview

This project has **two separate services**:

- **Backend** (`/backend`) - Express.js API on port 3001
- **Frontend** (`/frontend`) - Next.js React on port 3000
- **Infrastructure** - PostgreSQL + Redis (Docker)

Both need to run for the system to work.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Docker & Docker Compose
- (Optional) Ethereal Email account

## Step 1: Infrastructure (2 min)

Start PostgreSQL and Redis:

```bash
# From project root
docker-compose up -d

# Verify services started
docker ps
```

You should see two containers:
- `email_scheduler_db` - PostgreSQL on 5432
- `email_scheduler_redis` - Redis on 6379

## Step 2: Backend Setup (3 min)

Setup the Express API:

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Edit `.env` file:**

Open `backend/.env` and update these values:

```env
# Get free credentials from https://ethereal.email/
SMTP_USER=your-email@ethereal.email
SMTP_PASSWORD=your-password

# Leave rest as-is for development
DATABASE_URL=postgresql://scheduler_user:scheduler_password@localhost:5432/email_scheduler
REDIS_URL=redis://localhost:6379
PORT=3001
```

**Setup database:**

```bash
# Run migrations (creates tables)
npm run prisma:migrate

# Start backend server
npm run dev
```

Wait for output:
```
[SERVER] Server running on http://localhost:3001
```

**Backend is now running!** Keep this terminal open.

## Step 3: Frontend Setup (2 min)

In a **new terminal**, setup the React dashboard:

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Start frontend
npm run dev
```

Wait for output:
```
Ready in X.XXs
```

**Frontend is now running!** Open http://localhost:3000 in browser.

## Step 4: Verify Everything Works

1. **Open frontend**: http://localhost:3000
2. **Backend API**: http://localhost:3001
3. **Login page** should load
4. **Click "Compose Email"** to test the API connection
5. **Backend logs** should show API requests

## Running Both Services

You need **3 terminal windows**:

```bash
# Terminal 1: Infrastructure
docker-compose up -d

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend  
cd frontend && npm run dev
```

All three must be running for the system to work.

## Verify Services

### Check Backend is Running

```bash
# Should return server info
curl http://localhost:3001/health
```

### Check Frontend is Running

```bash
# Open in browser
http://localhost:3000
```

### Check PostgreSQL Connection

```bash
# Terminal 4
psql postgresql://scheduler_user:scheduler_password@localhost:5432/email_scheduler

# In psql prompt
\dt  -- List tables
\q   -- Quit
```

### Check Redis Connection

```bash
# Terminal 4
redis-cli ping
# Should return: PONG
```

## Test the System

### Create Test Data

First, create a sender via the backend API:

```bash
# Create sender (replace with your email)
curl -X POST http://localhost:3001/api/senders \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-123" \
  -H "X-User-Email: test@example.com" \
  -d '{
    "name": "Marketing",
    "email": "marketing@company.com"
  }'
```

### Schedule Test Emails

Create a test file `recipients.txt`:

```
john@example.com
jane@example.com
bob@example.com
```

Then schedule via API:

```bash
curl -X POST http://localhost:3001/api/emails/schedule \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-123" \
  -H "X-User-Email: test@example.com" \
  -d '{
    "senderId": "sender-id-from-create",
    "subject": "Test Email",
    "body": "<h1>Hello</h1><p>This is a test</p>",
    "recipients": ["john@example.com", "jane@example.com"],
    "startTime": '$(date -d '+5 minutes' +%s000)',
    "delayBetweenEmails": 2000,
    "maxEmailsPerHour": 100
  }'
```

### Monitor Progress

1. **Frontend Dashboard**: http://localhost:3000
   - Go to **Scheduled Emails** tab
   - See campaigns being processed
   - Go to **Sent Emails** tab
   - See completed sends

2. **Backend Logs**: Watch the terminal where you ran `npm run dev`
   - See email worker processing
   - See rate limit decisions
   - See SMTP interactions

## Troubleshooting

### Backend Won't Start

**Error: Database connection failed**

```bash
cd backend

# Check .env file
cat .env

# Verify database is running
docker ps | grep postgres

# Try manual connection
psql postgresql://scheduler_user:scheduler_password@localhost:5432/email_scheduler
```

**Error: Cannot find module**

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

**Error: Prisma migration failed**

```bash
cd backend

# Check migration status
npm run prisma:migrate -- --status

# Reset database (development only!)
npm run prisma:migrate -- --reset

# Then run migrations
npm run prisma:migrate
```

### Frontend Won't Start

**Error: Cannot connect to backend**

```bash
# Check backend is running
curl http://localhost:3001

# Check .env.local
cat frontend/.env.local

# Should have:
# NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

**Error: Clear cache and reinstall**

```bash
cd frontend
rm -rf node_modules .next package-lock.json
npm install
npm run dev
```

### Docker Services Won't Start

**Error: Port already in use**

```bash
# Check what's using ports
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Stop conflicting services
docker-compose down
# Kill the process using the port
kill -9 <PID>

# Restart
docker-compose up -d
```

**Error: Docker daemon not running**

```bash
# On Mac
open /Applications/Docker.app

# On Linux
sudo systemctl start docker

# On Windows
# Open Docker Desktop app
```

### Emails Not Sending

**Step 1: Verify SMTP credentials**

```bash
# Check .env has credentials
grep SMTP backend/.env

# Create Ethereal account at https://ethereal.email/
# Get SMTP_USER and SMTP_PASSWORD
```

**Step 2: Check backend logs**

```bash
cd backend
npm run dev

# Look for errors in output
# Should see: [WORKER] Email sent to...
```

**Step 3: Test SMTP directly**

```bash
cd backend

npm run prisma:studio
# Open http://localhost:5555
# Check email_jobs table for status
```

### Rate Limiting Issues

**Emails stuck in queue?**

```bash
# Check rate limit config in .env
grep MAX_EMAILS backend/.env

# Default: 500 global, 200 per-sender per hour

# Increase for testing
MAX_EMAILS_PER_HOUR_GLOBAL=10000
MAX_EMAILS_PER_HOUR_PER_SENDER=5000

# Restart backend
npm run dev
```

### Missing Database Tables

```bash
cd backend

# Run migrations to create tables
npm run prisma:migrate -- --name init

# Verify tables exist
npm run prisma:studio
# Open http://localhost:5555 - should see tables
```

## Common Tasks

### Backend Tasks

```bash
cd backend

# Start development server (hot reload)
npm run dev

# Build for production
npm run build && npm start

# View and edit database
npm run prisma:studio

# Create new migration
npm run prisma:migrate -- --name add_new_field

# Reset database (development)
npm run prisma:migrate -- --reset
```

### Frontend Tasks

```bash
cd frontend

# Start development server (hot reload)
npm run dev

# Build for production
npm run build && npm start

# Lint and format code
npm run lint
```

### Infrastructure Tasks

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f email_scheduler_db
docker-compose logs -f email_scheduler_redis

# Connect to PostgreSQL
psql postgresql://scheduler_user:scheduler_password@localhost:5432/email_scheduler

# Connect to Redis
redis-cli -h localhost -p 6379
```

## Database Access

### Using Prisma Studio (Recommended)

```bash
cd backend
npm run prisma:studio
```

Opens web UI at **http://localhost:5555** to browse and edit data.

### Using PostgreSQL CLI

```bash
# Connect
psql postgresql://scheduler_user:scheduler_password@localhost:5432/email_scheduler

# List tables
\dt

# View table structure
\d email_jobs

# Query data
SELECT * FROM email_jobs LIMIT 5;
SELECT COUNT(*) FROM email_jobs;

# Exit
\q
```

### Using Redis CLI

```bash
# Connect
redis-cli -h localhost -p 6379

# View queue jobs
KEYS *

# Get job details
HGETALL bull:email-queue:job:1

# Monitor queue
MONITOR

# Exit
quit
```

## File Organization Reference

When modifying files, remember:

```
backend/          ← Express/Node code
  src/
    index.ts      ← Main server entry
    routes/       ← API endpoints
    workers/      ← BullMQ jobs
    lib/          ← Utilities
  prisma/         ← Database schema
  .env            ← Backend config

frontend/         ← React/Next.js code
  app/            ← Next.js app routes
  components/     ← React components
  lib/            ← API client, utils
  .env.local      ← Frontend config
```

**Key principle**: Backend files only in `/backend`, frontend files only in `/frontend`.

## Next Steps

Once everything is running:

1. **Create Senders** - Add email addresses to send from
2. **Schedule Campaigns** - Use the frontend to compose and schedule
3. **Monitor Progress** - Watch real-time updates in dashboard
4. **Check Logs** - See backend processing in terminal
5. **View Database** - Use Prisma Studio to inspect data

## Service Ports

| Service | Port | URL | Notes |
|---------|------|-----|-------|
| **Frontend** | 3000 | http://localhost:3000 | React dashboard |
| **Backend** | 3001 | http://localhost:3001 | Express API |
| **Prisma Studio** | 5555 | http://localhost:5555 | Database GUI |
| **PostgreSQL** | 5432 | localhost:5432 | Database |
| **Redis** | 6379 | localhost:6379 | Cache/Queue |

## Production Setup

When deploying to production:

1. **Use real SMTP** - Replace Ethereal with SendGrid/Mailgun/AWS SES
2. **Setup Google OAuth** - Add real credentials
3. **Use managed database** - AWS RDS, Azure Database, etc.
4. **Use managed Redis** - AWS ElastiCache, Redis Cloud, etc.
5. **Enable HTTPS** - Add SSL certificates
6. **Set strong passwords** - Update all default credentials
7. **Enable logging** - Datadog, CloudWatch, etc.
8. **Setup monitoring** - Alerts for queue depth, errors
9. **Configure backups** - Daily database snapshots
10. **Setup auto-scaling** - For worker instances

See main `README.md` for detailed deployment guide.

## Stopping Everything

To stop all services:

```bash
# Stop backend (Ctrl+C in backend terminal)
cd backend && npm run dev
# Then Ctrl+C

# Stop frontend (Ctrl+C in frontend terminal)
cd frontend && npm run dev
# Then Ctrl+C

# Stop infrastructure
docker-compose down
```

## Need Help?

### Documentation

- **Overview**: See `README.md`
- **Backend Details**: See `backend/README.md`
- **Frontend Details**: See `frontend/README.md`
- **Architecture**: See `IMPLEMENTATION_SUMMARY.md`
- **Commands**: See `QUICK_REFERENCE.md`

### Common Issues

- Backend won't start? → Check `.env` file
- Frontend won't start? → Check `.env.local` file
- Database errors? → Verify Docker is running
- Emails not sending? → Check SMTP credentials

### Debug Mode

Enable verbose logging:

```bash
cd backend
DEBUG=* npm run dev
```

Get more API details:

```bash
# Test API with verbose output
curl -v http://localhost:3001/health
```

---

**You're ready to go!** Both services should now be running and connected.
