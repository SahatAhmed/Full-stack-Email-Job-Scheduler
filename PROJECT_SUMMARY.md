## Project Summary

Email Scheduler Service - Production-grade email scheduling with clear backend/frontend separation.

---

## Quick Facts

| Aspect | Details |
|--------|---------|
| **Type** | Monorepo (Backend + Frontend) |
| **Backend Framework** | Express.js (Node.js) |
| **Frontend Framework** | Next.js (React) |
| **Database** | PostgreSQL + Prisma ORM |
| **Job Queue** | BullMQ (Redis-backed) |
| **Email SMTP** | Ethereal (development) |
| **Authentication** | Google OAuth |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Language** | TypeScript throughout |
| **Backend Port** | 3001 |
| **Frontend Port** | 3000 |

---

## What This Project Does

1. **Schedule Emails** - Users compose emails and schedule them to send later
2. **Persistent Queuing** - Jobs stored in Redis, survive server restarts
3. **Rate Limiting** - Enforces global and per-sender email limits
4. **Worker Processing** - Sends emails at scheduled times via SMTP
5. **Dashboard Monitoring** - Real-time view of scheduled and sent emails
6. **User Management** - Google OAuth login for each user

### Real-World Example

```
Alice logs in
    ↓
Composes email: "Welcome to our platform"
    ↓
Uploads CSV: 1000 email addresses
    ↓
Sets schedule: Start tomorrow at 9 AM
    ↓
Backend creates 1000 jobs in queue
    ↓
Tomorrow, jobs execute automatically
    ↓
Dashboard shows progress: 250/1000 sent
    ↓
All emails delivered respecting rate limits
```

---

## Project Structure at a Glance

```
email-scheduler/
│
├── 📁 backend/              ← Express.js API server
│   ├── src/
│   │   ├── index.ts         ← Server entry
│   │   ├── routes/          ← API endpoints
│   │   ├── workers/         ← Job processor
│   │   ├── lib/             ← Core logic
│   │   └── middleware/      ← Auth checks
│   ├── prisma/              ← Database schema
│   └── .env                 ← Secrets (database, SMTP, etc)
│
├── 📁 frontend/             ← Next.js React dashboard
│   ├── app/                 ← Pages
│   ├── components/          ← React components
│   ├── lib/                 ← API client, state
│   ├── public/              ← Static files
│   └── .env.local           ← Public config (API URL)
│
├── 🐳 docker-compose.yml    ← PostgreSQL + Redis
│
└── 📚 Documentation
    ├── README.md            ← Overview
    ├── SETUP.md             ← How to get started
    ├── ARCHITECTURE.md      ← How it works
    ├── FILE_ORGANIZATION.md ← File organization
    └── QUICK_REFERENCE.md   ← Commands reference
```

**Key Principle:** Everything frontend goes in `/frontend`, everything backend in `/backend`.

---

## How to Get Started

### 1. Start Infrastructure (Docker)

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis.

### 2. Start Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with Ethereal credentials
npm run prisma:migrate
npm run dev
```

Backend runs on **http://localhost:3001**

### 3. Start Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend runs on **http://localhost:3000**

### 4. Test

- Open http://localhost:3000
- Login with Google (or demo mode)
- Go to "Compose Email"
- Schedule some emails
- Watch them send!

See `SETUP.md` for detailed instructions.

---

## Key Components

### Backend

**Routes** (`backend/src/routes/`)
- `POST /api/emails/schedule` - Schedule campaign
- `GET /api/emails/scheduled` - List pending
- `GET /api/emails/sent` - List completed
- `POST /api/senders` - Create sender
- `GET /api/senders` - List senders

**Job Queue** (`backend/src/lib/queue.ts`)
- Uses BullMQ for reliable job scheduling
- Stores jobs in Redis
- Survives server restarts
- Supports delayed execution

**Rate Limiting** (`backend/src/lib/rateLimit.ts`)
- Global: 500 emails/hour (configurable)
- Per-sender: 200 emails/hour (configurable)
- Redis-backed for multi-instance safety
- Reschedules jobs when limits hit

**Email Worker** (`backend/src/workers/sendEmailWorker.ts`)
- Processes jobs from queue
- Sends via SMTP
- Updates database with status
- Handles errors and retries

### Frontend

**Pages** (`frontend/app/`)
- `/` - Login page
- `/dashboard` - Main dashboard

**Components** (`frontend/components/`)
- `Header` - User profile & logout
- `ComposeModal` - Email compose form
- `ScheduledEmailsTab` - Pending campaigns
- `SentEmailsTab` - Email history

**State** (`frontend/lib/`)
- `authStore.ts` - User authentication state
- `api.ts` - Backend API client
- `utils.ts` - Helper functions

---

## Technology Choices Explained

### Why Express.js (Backend)?
- Lightweight and fast
- Great for REST APIs
- Large ecosystem
- Easy to integrate with BullMQ

### Why Next.js (Frontend)?
- Full-stack React framework
- Built-in routing and API routes
- Server-side rendering
- Great developer experience
- Easy deployment (Vercel)

### Why BullMQ (Job Queue)?
- Persistent job storage
- Supports delayed jobs (perfect for scheduling)
- Survives worker crashes
- Built on Redis (fast)
- Simple API

### Why PostgreSQL (Database)?
- Reliable ACID compliance
- Excellent for structured data
- Great with Prisma ORM
- Powerful query capabilities
- Production-ready

### Why Ethereal Email (SMTP)?
- Free fake SMTP for development
- No real emails sent
- Perfect for testing
- Easy to swap for real SMTP in production

---

## Important Architecture Decisions

### 1. Monorepo Structure
- Backend and frontend together
- Easy to develop and deploy
- Can separate later if needed

### 2. REST API Communication
- Frontend calls backend via HTTP
- Simple, proven pattern
- Easy to debug and monitor

### 3. Redis for Queue
- Separate from database
- Fast operations
- Built for messaging

### 4. PostgreSQL for Persistence
- Reliable data storage
- Complex queries when needed
- ACID transactions

### 5. Rate Limiting in Backend
- Server-side enforcement
- Can't be bypassed by frontend
- Uses atomic Redis operations

### 6. No File Uploads
- Emails read from text/CSV
- No file storage complexity
- Easy to scale

---

## Deployment Paths

### Option 1: Separate Services
```
Frontend → Vercel
Backend → Render or Railway
Database → AWS RDS
Redis → Redis Cloud
```

### Option 2: Single Server
```
VPS (DigitalOcean/Linode)
├── Backend (port 3001)
├── Frontend (port 3000)
├── PostgreSQL (port 5432)
└── Redis (port 6379)
```

### Option 3: Containerized
```
Docker Compose / Kubernetes
├── Backend container
├── Frontend container
├── PostgreSQL container
└── Redis container
```

See `README.md` for production deployment guide.

---

## Performance Capabilities

- **1000 emails** can be scheduled and queued immediately
- **5 workers** process emails in parallel by default
- **2 second minimum** delay between sends (configurable)
- **500 emails/hour** global rate limit (configurable)
- **200 emails/hour** per-sender limit (configurable)
- Survives unlimited server restarts without data loss

Under load with 1000 emails:
- All queued in Redis immediately
- Distributed across hours per rate limits
- No data loss if server crashes
- Can add more workers to scale

---

## Security Features

✅ **Google OAuth** - Real authentication
✅ **Token validation** - All endpoints require auth
✅ **Rate limiting** - Prevents abuse
✅ **Environment variables** - No hardcoded secrets
✅ **SQL injection prevention** - Prisma ORM
✅ **CORS configured** - Frontend origin only

⚠️ **For Production:**
- Enable HTTPS/TLS
- Add request signing
- Enable database encryption
- Setup logging/monitoring
- Configure WAF rules

---

## What Works Right Now

✅ Backend API running and responding
✅ Database migrations working
✅ BullMQ queue fully functional
✅ Email worker processing jobs
✅ Rate limiting enforced
✅ Frontend dashboard loads
✅ Google OAuth integration ready
✅ Real-time job status updates
✅ CSV parsing for recipients
✅ Error handling throughout

---

## Next Steps After Setup

1. **Configure Ethereal** - Add real SMTP credentials in `.env`
2. **Create Senders** - Add email addresses to send from
3. **Schedule Campaigns** - Use dashboard to compose and schedule
4. **Monitor Progress** - Watch real-time email delivery
5. **Test Rate Limits** - Send 500+ emails to test rate limiting
6. **Check Database** - Use Prisma Studio to inspect data
7. **Review Logs** - Check backend terminal for processing details
8. **Deploy** - Follow production deployment guide when ready

---

## Common Questions

**Q: Can I use a different database?**
A: Yes, MySQL or other databases work with Prisma. Update `DATABASE_URL`.

**Q: Can I use a different SMTP?**
A: Yes, SendGrid, Mailgun, AWS SES, etc. Update email sending logic.

**Q: How do I scale to millions of emails?**
A: Add more workers, increase rate limits, use managed database/Redis.

**Q: Can I run just backend or just frontend?**
A: Yes, they're completely separate. Deploy independently to different servers.

**Q: How do I deploy to production?**
A: See `README.md` deployment section or `ARCHITECTURE.md` scaling section.

**Q: Can I modify the rate limiting?**
A: Yes, `backend/.env` has `MAX_EMAILS_PER_HOUR_GLOBAL` and `MAX_EMAILS_PER_HOUR_PER_SENDER`.

**Q: What if emails fail to send?**
A: Workers retry 3 times, then mark as failed. Check `email_jobs` table in database.

---

## Support & Docs

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview |
| `SETUP.md` | Installation instructions |
| `ARCHITECTURE.md` | System design & data flow |
| `FILE_ORGANIZATION.md` | Where each file belongs |
| `QUICK_REFERENCE.md` | Common commands |
| `backend/README.md` | Backend API details |
| `frontend/README.md` | Frontend component guide |

---

## Contact & Issues

- Check the documentation files first
- Review logs for error messages
- Test locally with small batches
- Verify all environment variables are set
- Ensure all services are running (docker, backend, frontend)

---

**Ready to get started?** Follow the "How to Get Started" section above or see `SETUP.md` for detailed instructions.

**Happy emailing!** 🚀
