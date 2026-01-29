# Email Scheduler Service

A production-grade email scheduling system with clear **backend** and **frontend** separation. Built for reliability at scale with persistent job queuing, rate limiting, and a modern React dashboard.

## 📂 Project Organization

This is a **monorepo** with strict separation between backend and frontend:

### Backend `/backend` - Express.js
- REST API server on port 3001
- BullMQ job queue (Redis-backed)
- PostgreSQL database with Prisma ORM
- Email worker processes
- Authentication middleware
- Rate limiting logic

### Frontend `/frontend` - Next.js
- React dashboard on port 3000
- Google OAuth login
- Real-time email monitoring
- Compose & schedule UI
- Dark theme design
- API client for backend

## Architecture Flow

```
┌──────────────────────────┐
│  Frontend (React/Next.js) │
│  Port 3000               │
│  - Login Page            │
│  - Dashboard             │
│  - Compose Modal         │
└──────────────┬───────────┘
               │ REST API
               ▼
┌──────────────────────────┐
│  Backend (Express)       │
│  Port 3001               │
│  - Email APIs            │
│  - Rate Limiter          │
│  - Auth Middleware       │
└──────┬────────────┬──────┘
       │            │
    ┌──▼──┐    ┌───▼───┐
    │Redis│    │Postgres│
    │Queue│    │Database │
    └──────┘    └────────┘
       │
    ┌──▼────────────────┐
    │ BullMQ Worker     │
    │ Email Processor   │
    └─────────┬─────────┘
              │
           ┌──▼──────────┐
           │ Ethereal    │
           │ SMTP Server │
           └─────────────┘
```

## Key Features

### Backend
- **BullMQ + Redis**: Persistent, distributed job scheduling
- **PostgreSQL**: Reliable data persistence with Prisma ORM
- **Rate Limiting**: Redis-backed per-sender and global limits
- **Worker Concurrency**: Configurable parallel email processing
- **Server Restart Resilience**: All jobs survive server restarts
- **Ethereal Email**: Fake SMTP for testing
- **REST APIs**: Clean endpoints for scheduling and monitoring

### Frontend
- **Modern Dashboard**: Dark theme, responsive design
- **Google OAuth**: Real authentication integration
- **Email Composition**: Rich form with CSV upload
- **Real-time Tracking**: Monitor scheduled and sent campaigns
- **SWR Data Fetching**: Automatic synchronization and caching

## ⚡ Quick Start (5 minutes)

### Prerequisites

- **Node.js** 18+ with npm
- **Docker & Docker Compose** (recommended for PostgreSQL + Redis)
- **Ethereal Email** account (free at https://ethereal.email/)

### Step 1: Start Infrastructure

```bash
# From root directory - starts PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker ps
```

### Step 2: Setup Backend (Terminal 1)

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env - add your Ethereal credentials
# SMTP_USER=your-email@ethereal.email
# SMTP_PASSWORD=your-password
nano .env

# Run database migrations
npm run prisma:migrate

# Start server (runs on http://localhost:3001)
npm run dev
```

### Step 3: Setup Frontend (Terminal 2)

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start dev server (runs on http://localhost:3000)
npm run dev
```

### Step 4: Test Application

1. Open **http://localhost:3000** in browser
2. Login (or use demo mode)
3. Go to **Compose Email**
4. Fill out the form:
   - Select sender
   - Enter subject and body
   - Upload CSV with email addresses
   - Set scheduling time
5. Click **Schedule** and watch real-time progress in dashboard

---

**That's it!** Both frontend and backend are running and connected.

## 📁 Directory Structure

```
email-scheduler/
│
├── backend/                          # ⚙️  NODE.JS EXPRESS SERVER
│   ├── src/
│   │   ├── index.ts                  # Main server entry point
│   │   ├── config.ts                 # Config loader from .env
│   │   ├── lib/
│   │   │   ├── redis.ts              # Redis client singleton
│   │   │   ├── queue.ts              # BullMQ job queue setup
│   │   │   ├── rateLimit.ts          # Rate limiting logic
│   │   │   └── email.ts              # SMTP transporter
│   │   ├── workers/
│   │   │   └── sendEmailWorker.ts    # BullMQ job processor
│   │   ├── routes/
│   │   │   ├── emailRoutes.ts        # Schedule/list emails APIs
│   │   │   └── senderRoutes.ts       # Sender management APIs
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts     # Google token verification
│   │   └── types/
│   │       └── apiTypes.ts           # TypeScript interfaces
│   ├── prisma/
│   │   └── schema.prisma             # PostgreSQL schema
│   ├── .env.example                  # Environment template
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md                     # Backend docs + API reference
│   └── dist/                         # Compiled output (build)
│
├── frontend/                         # 🎨  NEXT.JS REACT APP
│   ├── app/
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Login page
│   │   ├── globals.css               # Global styles & theme
│   │   └── dashboard/
│   │       └── page.tsx              # Main dashboard page
│   ├── components/
│   │   ├── Header.tsx                # User profile header
│   │   ├── Tabs.tsx                  # Tab navigation
│   │   ├── ComposeModal.tsx          # Email compose form
│   │   ├── ScheduledEmailsTab.tsx    # Scheduled campaigns view
│   │   ├── SentEmailsTab.tsx         # Email history view
│   │   └── ui/                       # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts                    # Backend API client
│   │   ├── authStore.ts              # Zustand state store
│   │   └── utils.ts                  # Helper functions
│   ├── public/                       # Static assets
│   ├── .env.example                  # Environment template
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── next.config.js
│   ├── README.md                     # Frontend docs + component guide
│   └── .next/                        # Build output (ignored)
│
├── docker-compose.yml                # PostgreSQL + Redis services
├── .gitignore                        # Git ignore rules
├── README.md                         # This file - overview & quick start
├── SETUP.md                          # Detailed setup instructions
├── QUICK_REFERENCE.md                # Command reference
└── IMPLEMENTATION_SUMMARY.md         # Architecture deep dive
```

### What Goes Where?

| Item | Location | Why |
|------|----------|-----|
| Express server code | `backend/src/` | Backend-specific logic |
| Database schema | `backend/prisma/` | Database belongs to backend |
| React components | `frontend/components/` | UI belongs to frontend |
| API calls | `frontend/lib/api.ts` | Frontend consumes backend |
| Environment vars | `.env` in each folder | Keep concerns separate |
| Node packages | `package.json` in each folder | Independent dependencies |

## Core Systems

### 1. Job Scheduling (BullMQ)

Jobs are scheduled with delays using BullMQ:

```typescript
await scheduleEmail({
  jobId: 'email-123',
  scheduledTime: Date.now() + 3600000, // 1 hour from now
  // ... email data
});
```

- **Persistent**: All jobs stored in Redis
- **Delayed Execution**: Uses Redis sorted sets
- **Automatic Retry**: 3 attempts with exponential backoff
- **Job Recovery**: Survives worker crashes

### 2. Rate Limiting

Redis-backed counters track emails per hour:

```
emails:hour:{timestamp}                    // Global count
emails:sender:{senderId}:hour:{timestamp}  // Per-sender count
```

When limits are reached, jobs are rescheduled to the next hour.

**Defaults:**
- Global: 500 emails/hour
- Per-sender: 200 emails/hour
- Configurable via environment variables

### 3. Email Delivery

Uses Ethereal Email (fake SMTP) for testing:

```typescript
await sendEmail({
  to: 'recipient@example.com',
  subject: 'Hello',
  html: '<p>Hello World</p>',
  from: 'noreply@example.com'
});
```

In production, replace with:
- SendGrid, Mailgun, AWS SES, etc.
- Just change the transporter configuration

### 4. Database Schema

**Key Tables:**
- `users`: User accounts
- `senders`: Email addresses to send from
- `email_batches`: Groups of emails
- `email_jobs`: Individual email records

**Job States:**
- PENDING: Waiting to be sent
- PROCESSING: Currently being processed
- SENT: Successfully delivered
- FAILED: Failed after 3 retries

## API Documentation

### Endpoints

#### Schedule Emails
```http
POST /api/emails/schedule
X-User-ID: user-123
X-User-Email: user@example.com

{
  "senderId": "sender-456",
  "subject": "Hello",
  "body": "<p>Welcome</p>",
  "recipients": ["user1@example.com", "user2@example.com"],
  "startTime": 1704067200000,
  "delayBetweenMs": 2000,
  "hourlyLimit": 200
}
```

#### Get Scheduled Emails
```http
GET /api/emails/scheduled
X-User-ID: user-123
X-User-Email: user@example.com
```

#### Get Sent Emails
```http
GET /api/emails/sent?limit=100&offset=0
X-User-ID: user-123
X-User-Email: user@example.com
```

See `backend/README.md` for complete API documentation.

## Rate Limiting Strategy

### How It Works

1. **Before sending**: Check Redis counters for current hour
2. **Within limits**: Send email and increment counters
3. **Exceeds limits**: Reschedule job for next hour with backoff
4. **Hour boundary**: Counters automatically expire via Redis TTL

### Benefits

- **Safe for distributed workers**: Uses atomic Redis operations
- **No data loss**: Failed jobs are rescheduled
- **Order preservation**: Jobs processed sequentially within limits
- **Scalable**: Works with any number of worker instances

### Examples

With 500 emails/hour global limit:
- **Scenario 1**: 100 emails scheduled → All sent in first hour
- **Scenario 2**: 600 emails scheduled → First 500 sent, remaining 100 sent next hour
- **Scenario 3**: 1000 emails scheduled same time → Queued and flow through over time

## Deployment

### Docker Production Setup

```bash
# Build backend
docker build -t email-scheduler-backend ./backend

# Build frontend
docker build -t email-scheduler-frontend ./frontend

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

**Backend (.env):**
- DATABASE_URL: PostgreSQL connection
- REDIS_URL: Redis connection
- SMTP_USER, SMTP_PASSWORD: Ethereal credentials
- MAX_EMAILS_PER_HOUR_GLOBAL: Rate limit
- QUEUE_WORKER_CONCURRENCY: Worker parallelism

**Frontend (.env.local):**
- NEXT_PUBLIC_API_URL: Backend API URL

### Scaling Considerations

1. **Multiple Worker Instances**: Run multiple workers connected to same Redis/DB
2. **Database Replication**: Use PostgreSQL replication
3. **Redis Persistence**: Enable AOF for durability
4. **Monitoring**: Track queue depth and job success rates
5. **Alerting**: Set up alerts for failed jobs

## Development

### Running Locally

**Terminal 1: Infrastructure**
```bash
docker-compose up
```

**Terminal 2: Backend**
```bash
cd backend
npm run dev
```

**Terminal 3: Frontend**
```bash
cd frontend
npm run dev
```

**Terminal 4: Database UI (Optional)**
```bash
cd backend
npm run prisma:studio
```

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Monitoring

### Key Metrics

- Queue depth: Number of pending jobs
- Job throughput: Emails sent per minute
- Success rate: Percentage of successful sends
- Error rate: Failed jobs
- Rate limit hits: Times limits were exceeded

### Logging

All components log to stdout with prefixes:
- `[SERVER]`: Express server
- `[INIT]`: Initialization
- `[QUEUE]`: Queue operations
- `[WORKER]`: Email sending
- `[RATE_LIMIT]`: Rate limiting decisions
- `[ERROR]`: Errors

## Troubleshooting

### Emails not sending

1. Check SMTP credentials in `.env`
2. Verify backend logs: `docker logs email_scheduler_backend`
3. Check BullMQ worker: `npm run prisma:studio` → email_jobs table
4. Test transporter: Create test endpoint in backend

### Database connection errors

```bash
# Check PostgreSQL
docker logs email_scheduler_db

# Verify connection
psql $DATABASE_URL
```

### Redis connection issues

```bash
# Check Redis
docker logs email_scheduler_redis

# Test Redis
redis-cli ping
```

### Rate limiting too strict

Adjust in `.env`:
```
MAX_EMAILS_PER_HOUR_GLOBAL=1000
MAX_EMAILS_PER_HOUR_PER_SENDER=500
```

## Best Practices

1. **Use environment variables**: Never hardcode credentials
2. **Monitor queue depth**: Alert if jobs accumulate
3. **Test with small batches**: Before sending to large lists
4. **Validate email lists**: Remove duplicates and invalid addresses
5. **Use sender verification**: Verify sender emails before use
6. **Set appropriate delays**: Balance throughput vs provider limits
7. **Backup databases**: Regular PostgreSQL backups
8. **Monitor error logs**: Watch for persistent failures

## Security Notes

- **Authentication**: Mock in demo, use real OAuth in production
- **Rate Limiting**: Prevents abuse, enforced server-side
- **Data Protection**: Sensitive data in environment variables
- **Input Validation**: All user inputs validated
- **CORS**: Configured for frontend origin

For production, add:
- HTTPS/TLS
- JWT authentication
- Database encryption
- API key rotation
- Request signing

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -am 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## License

MIT

## Support

For issues or questions:
1. Check the README files in `/backend` and `/frontend`
2. Review the troubleshooting section
3. Check logs for error messages
4. Open an issue with details and logs

## Acknowledgments

- Inspired by ReachInbox email scheduler architecture
- Built with Express.js, BullMQ, PostgreSQL, Next.js
- Uses modern TypeScript for type safety
- Designed for production use

---

**Ready to schedule emails at scale!** Start with the Quick Start section above.
