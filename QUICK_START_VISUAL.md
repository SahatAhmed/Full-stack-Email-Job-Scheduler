## Quick Start Visual Guide

Fast visual reference to get the system running.

---

## 30-Second Overview

```
Backend (Express)
    + Frontend (React/Next)
    + Database (PostgreSQL)
    + Queue (Redis)
    = Email Scheduler
```

---

## 5-Minute Setup

### Step 1: Start Services
```bash
docker-compose up -d
```
✓ PostgreSQL + Redis running

### Step 2: Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env → add Ethereal credentials
npm run prisma:migrate
npm run dev
```
✓ Backend running on 3001

### Step 3: Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
✓ Frontend running on 3000

### Done!
Open: http://localhost:3000

---

## Project Layout

```
backend/             frontend/           Infrastructure
├── src/             ├── app/             └── docker-compose.yml
│   ├── routes/      ├── components/
│   ├── workers/     ├── lib/
│   ├── lib/         └── public/
│   └── middleware/
├── prisma/
├── .env
└── package.json
```

**Rule:** Backend code in `/backend`, frontend code in `/frontend`

---

## Services Overview

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Frontend | 3000 | http://localhost:3000 | React dashboard |
| Backend | 3001 | http://localhost:3001 | Express API |
| PostgreSQL | 5432 | localhost:5432 | Database |
| Redis | 6379 | localhost:6379 | Queue & cache |
| Prisma Studio | 5555 | http://localhost:5555 | Database GUI |

---

## Common Commands

### Backend
```bash
cd backend

npm run dev           # Start dev server
npm run build         # Build for production
npm start             # Run production build
npm run prisma:studio # Open database GUI
npm run prisma:migrate # Run migrations
```

### Frontend
```bash
cd frontend

npm run dev           # Start dev server
npm run build         # Build for production
npm start             # Run production build
```

### Infrastructure
```bash
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # View logs
```

---

## File Organization Cheat Sheet

### Backend (`/backend`) - Put Here
```
✅ Express routes
✅ Database queries
✅ Business logic
✅ Email sending
✅ Job processing
✅ Rate limiting
✅ TypeScript (.ts)
✅ Secrets (.env)
```

### Frontend (`/frontend`) - Put Here
```
✅ React components
✅ Next.js pages
✅ API client calls
✅ UI logic
✅ Styling
✅ User state
✅ TypeScript (.tsx)
✅ Public config (.env.local)
```

---

## Data Flow

```
1. User fills form
    ↓
2. Frontend validates
    ↓
3. Frontend calls API
    ↓
4. Backend validates & saves
    ↓
5. Backend creates jobs
    ↓
6. Frontend polls for updates
    ↓
7. Worker sends emails
    ↓
8. Status shows in dashboard
```

---

## Testing Quick Checks

### Is backend running?
```bash
curl http://localhost:3001
# Should get response (not connection refused)
```

### Is frontend running?
```
Open http://localhost:3000
# Should load page (not connection refused)
```

### Is database running?
```bash
psql postgresql://scheduler_user:scheduler_password@localhost:5432/email_scheduler
# Should connect (not connection refused)
```

### Is Redis running?
```bash
redis-cli ping
# Should return PONG
```

---

## Email Sending Simulation

```bash
# 1. Create sender (backend)
curl -X POST http://localhost:3001/api/senders \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user" \
  -H "X-User-Email: user@test.com" \
  -d '{"name":"Test","email":"test@example.com"}'

# Response: {senderid: "..."}

# 2. Schedule emails (backend)
curl -X POST http://localhost:3001/api/emails/schedule \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user" \
  -H "X-User-Email: user@test.com" \
  -d '{
    "senderId":"<from-step-1>",
    "subject":"Hello",
    "body":"<h1>Hi</h1>",
    "recipients":["user1@example.com","user2@example.com"],
    "startTime":'$(date -d '+5 minutes' +%s000)',
    "delayBetweenEmails":2000,
    "maxEmailsPerHour":100
  }'

# 3. Check status (frontend)
Open http://localhost:3000
→ Go to "Scheduled Emails"
→ See campaign with progress
```

---

## Folder Structure at a Glance

```
Root
├── backend/
│   ├── src/
│   │   ├── index.ts       ← Server entry
│   │   ├── routes/        ← API endpoints
│   │   ├── workers/       ← Job processor
│   │   ├── lib/           ← Utilities
│   │   └── middleware/    ← Auth checks
│   ├── prisma/            ← Database schema
│   ├── .env               ← Secrets
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx       ← Login
│   │   └── dashboard/     ← Dashboard
│   ├── components/        ← React components
│   ├── lib/
│   │   ├── api.ts         ← Backend calls
│   │   └── authStore.ts   ← State
│   ├── .env.local         ← Config
│   └── package.json
│
├── docker-compose.yml
└── Documentation/
    ├── README.md
    ├── SETUP.md
    └── ...
```

---

## Key Files

| File | What It Does |
|------|-------------|
| `backend/src/index.ts` | Starts Express server |
| `backend/src/routes/emailRoutes.ts` | Email APIs |
| `backend/src/workers/sendEmailWorker.ts` | Sends emails |
| `backend/src/lib/rateLimit.ts` | Rate limiting |
| `backend/prisma/schema.prisma` | Database schema |
| `frontend/app/page.tsx` | Login page |
| `frontend/app/dashboard/page.tsx` | Dashboard page |
| `frontend/components/ComposeModal.tsx` | Compose form |
| `frontend/lib/api.ts` | API client |
| `frontend/lib/authStore.ts` | Auth state |

---

## Common Issues Quick Fix

| Issue | Solution |
|-------|----------|
| Backend won't start | Check `.env` file exists |
| Frontend won't start | Check `.env.local` exists |
| Can't connect to DB | Check `docker-compose up -d` |
| API call fails | Check backend is running |
| Emails not sending | Check SMTP credentials in `.env` |
| Page not loading | Check frontend is running |

---

## Environment Variables Template

### Backend (`.env`)
```env
DATABASE_URL=postgresql://scheduler_user:scheduler_password@localhost:5432/email_scheduler
REDIS_URL=redis://localhost:6379
PORT=3001
NODE_ENV=development

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your@ethereal.email
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@example.com

MAX_EMAILS_PER_HOUR_GLOBAL=500
MAX_EMAILS_PER_HOUR_PER_SENDER=200
QUEUE_WORKER_CONCURRENCY=5
DELAY_BETWEEN_EMAILS_MS=2000
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=optional
```

---

## Architecture at a Glance

```
User Browser
    ↓
Frontend (React/Next.js) ← → Backend (Express.js)
    ↓                              ↓
   UI                          Database
                               Queue
                               SMTP
```

---

## Development Terminals

**Terminal 1:**
```bash
docker-compose up -d
```

**Terminal 2:**
```bash
cd backend && npm run dev
```

**Terminal 3:**
```bash
cd frontend && npm run dev
```

All must be running!

---

## First Test

1. Open http://localhost:3000
2. Login (use demo)
3. Click "Compose Email"
4. Fill form
5. Click "Schedule"
6. Watch it process
7. ✓ System working!

---

## Next Steps

1. ✅ Services running
2. ✅ Can schedule emails
3. ✅ Can see progress
4. 📖 Read full docs
5. 🛠️ Customize settings
6. 🚀 Deploy to production

---

## Documentation Quick Links

| Need | Read |
|------|------|
| Full setup | `SETUP.md` |
| Understand system | `ARCHITECTURE.md` |
| Add feature | `FILE_ORGANIZATION.md` |
| View diagrams | `VISUAL_GUIDE.md` |
| Common commands | `QUICK_REFERENCE.md` |
| Find docs | `INDEX.md` |

---

## One-Liner Summary

**Monorepo with backend (Express) + frontend (React) = Email scheduler with job queue (Redis) + database (PostgreSQL)**

---

## Checklist Before Coding

- [ ] Docker running: `docker-compose up -d`
- [ ] Backend running: `npm run dev` in `/backend`
- [ ] Frontend running: `npm run dev` in `/frontend`
- [ ] Can access http://localhost:3000
- [ ] Can access http://localhost:3001
- [ ] Know the file organization
- [ ] Read the architecture guide

---

**Ready? Open http://localhost:3000 now!**

For detailed instructions, see `SETUP.md`
