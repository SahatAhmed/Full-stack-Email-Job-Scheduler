## Email Scheduler Architecture

This document explains how the backend and frontend are organized and how they communicate.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Next.js)                    │
│                         Port 3000                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ User Interface                                           │  │
│  │ - Login Page                                             │  │
│  │ - Dashboard (Scheduled/Sent tabs)                        │  │
│  │ - Compose Modal                                          │  │
│  │ - Header with User Info                                 │  │
│  └───────────────────┬──────────────────────────────────────┘  │
│                      │ HTTP REST API (JSON)                     │
│  ┌───────────────────▼──────────────────────────────────────┐  │
│  │ API Client (lib/api.ts)                                  │  │
│  │ - Handles all backend communication                      │  │
│  │ - Error handling and retry logic                         │  │
│  │ - Auth token management                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────��──────────────────────────────┘
                              │
                 HTTP REST API (JSON over HTTP)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express.js)                        │
│                         Port 3001                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ REST API Layer (routes/)                                 │  │
│  │ - POST /api/emails/schedule - Create campaign            │  │
│  │ - GET /api/emails/scheduled - List pending               │  │
│  │ - GET /api/emails/sent - List completed                  │  │
│  │ - POST /api/senders - Create sender                      │  │
│  │ - GET /api/senders - List senders                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │ Auth Middleware (middleware/)                            │  │
│  │ - Verifies Google tokens                                 │  │
│  │ - Validates user identity                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │ Business Logic (lib/)                                    │  │
│  │ - Queue management (BullMQ)                              │  │
│  │ - Rate limiting checks                                   │  │
│  │ - Email scheduling logic                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │ Email Worker (workers/)                                  │  │
│  │ - Processes jobs from queue                              │  │
│  │ - Sends emails via SMTP                                  │  │
│  │ - Updates job status                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
    ┌───▼────┐          ┌──────▼───┐           ┌────▼────┐
    │PostgreSQL│         │  Redis   │           │ Ethereal │
    │Database  │         │  Queue   │           │ SMTP     │
    │          │         │          │           │ Server   │
    │ Tables:  │         │ Jobs:    │           │          │
    │-users    │         │-pending  │           │ Sends    │
    │-senders  │         │-active   │           │ emails   │
    │-campaigns│         │-completed│           │          │
    │-email_jobs│        │          │           │          │
    └──────────┘         └──────────┘           └──────────┘
```

## Directory Separation

### Backend (`/backend`)

Everything related to the Express server:

```
backend/
├── src/
│   ├── index.ts              # Server entry point
│   ├── config.ts             # Configuration from .env
│   │
│   ├── routes/               # API endpoints
│   │   ├── emailRoutes.ts    # Schedule/list emails
│   │   └── senderRoutes.ts   # Sender management
│   │
│   ├── middleware/           # Express middleware
│   │   └── authMiddleware.ts # Google token validation
│   │
│   ├── lib/                  # Core logic
│   │   ├── queue.ts          # BullMQ setup
│   │   ├── rateLimit.ts      # Rate limiting
│   │   ├── email.ts          # SMTP configuration
│   │   └── redis.ts          # Redis client
│   │
│   ├── workers/              # Background jobs
│   │   └── sendEmailWorker.ts # Email processor
│   │
│   └── types/                # TypeScript types
│       └── apiTypes.ts       # API request/response types
│
├── prisma/
│   └── schema.prisma         # Database schema
│
├── .env.example              # Environment template
├── package.json              # Node dependencies
├── tsconfig.json             # TypeScript config
└── README.md                 # Backend documentation
```

**Key Points:**
- Handles all database operations
- Manages job queue (BullMQ)
- Enforces rate limiting
- Sends emails via SMTP
- Exposes REST APIs
- Validates all user inputs

### Frontend (`/frontend`)

Everything related to React/Next.js:

```
frontend/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Login page
│   ├── layout.tsx           # Root layout
│   ├── globals.css          # Global styles + theme
│   └── dashboard/
│       └── page.tsx         # Main dashboard
│
├── components/              # React components
│   ├── Header.tsx           # User profile header
│   ├── Tabs.tsx             # Tab navigation
│   ├── ComposeModal.tsx     # Email compose form
│   ├── ScheduledEmailsTab.tsx # Pending campaigns
│   ├── SentEmailsTab.tsx    # Email history
│   └── ui/                  # shadcn/ui components
│
├── lib/                      # Frontend utilities
│   ├── api.ts               # Backend API client
│   ├── authStore.ts         # Zustand state store
│   └── utils.ts             # Helper functions
│
├── public/                  # Static assets
├── .env.example             # Environment template
├── package.json             # Node dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.ts       # Tailwind configuration
├── next.config.js           # Next.js configuration
└── README.md                # Frontend documentation
```

**Key Points:**
- Displays UI to users
- Calls backend APIs
- Manages user state (auth)
- Handles error display
- No database access
- No business logic

## Communication Protocol

### Frontend Calls Backend

All communication uses REST API with JSON:

```javascript
// frontend/lib/api.ts
const response = await fetch('http://localhost:3001/api/emails/schedule', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${googleToken}`,
  },
  body: JSON.stringify({
    senderId: 'uuid',
    subject: 'Hello',
    // ... more data
  })
});

const data = await response.json();
```

### Backend Responds

Backend validates, processes, and responds:

```typescript
// backend/src/routes/emailRoutes.ts
router.post('/schedule', async (req, res) => {
  // 1. Verify auth token
  // 2. Validate input
  // 3. Save to database
  // 4. Create BullMQ jobs
  // 5. Return response
  res.json({
    campaignId: 'uuid',
    totalEmails: 100,
    scheduledAt: '2025-01-28T...'
  });
});
```

## Data Flow Example: Scheduling Emails

### Step 1: User Fills Form (Frontend)

```
User clicks "Schedule Email"
    ↓
ComposeModal.tsx displays form
    ↓
User uploads CSV with recipients
    ↓
User clicks "Schedule"
```

### Step 2: Frontend Sends Request

```
frontend/lib/api.ts
    ↓
POST http://localhost:3001/api/emails/schedule
    ↓
Sends JSON payload with:
- senderId
- subject, body
- recipients array
- startTime
- delayBetweenEmails
```

### Step 3: Backend Receives

```
backend/src/routes/emailRoutes.ts
    ↓
Middleware validates auth token
    ↓
Controller validates input
    ↓
Saves EmailBatch to PostgreSQL
    ↓
Creates BullMQ jobs (one per recipient)
```

### Step 4: Queue Processing

```
BullMQ job created in Redis
    ↓
Job scheduled with delay (start time)
    ↓
When delay expires, job becomes "active"
    ↓
Worker picks up job
    ↓
sendEmailWorker.ts processes job
```

### Step 5: Email Sent

```
Backend checks rate limits (Redis)
    ↓
Increments rate limit counter
    ↓
Connects to Ethereal SMTP
    ↓
Sends email
    ↓
Updates job status in PostgreSQL
```

### Step 6: Frontend Displays Progress

```
Frontend polls /api/emails/scheduled every 5 seconds
    ↓
Gets updated job counts
    ↓
ScheduledEmailsTab.tsx updates progress bar
    ↓
When complete, shows "100 sent"
```

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql://scheduler_user:pass@localhost:5432/db

# Redis (for queue)
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
NODE_ENV=development

# SMTP
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=user@ethereal.email
SMTP_PASSWORD=password
SMTP_FROM=noreply@company.com

# Rate Limits
MAX_EMAILS_PER_HOUR_GLOBAL=500
MAX_EMAILS_PER_HOUR_PER_SENDER=200

# Queue Settings
QUEUE_WORKER_CONCURRENCY=5
DELAY_BETWEEN_EMAILS_MS=2000

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
# Backend connection
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Google OAuth (optional - leave blank for demo)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
```

**Key Difference:**
- Backend `.env` has secrets (SMTP password, database URL)
- Frontend `.env.local` has only public config (API URL, Google Client ID)
- Never expose backend `.env` to frontend

## API Endpoints

### Email Management

```
POST /api/emails/schedule
→ Schedule new email campaign
← Returns: { campaignId, totalEmails, scheduledAt }

GET /api/emails/scheduled
→ Get pending campaigns
← Returns: { campaigns: [...], total, page }

GET /api/emails/sent
→ Get sent email history
← Returns: { emails: [...], total, page }

GET /api/emails/:campaignId
→ Get campaign details
← Returns: { campaign, jobs: [...] }
```

### Sender Management

```
POST /api/senders
→ Create new sender
← Returns: { senderId, email, name }

GET /api/senders
→ List all senders
← Returns: { senders: [...] }

DELETE /api/senders/:senderId
→ Delete sender
← Returns: { success: true }
```

All endpoints require `Authorization: Bearer <token>` header.

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  createdAt TIMESTAMP
);
```

### Senders Table

```sql
CREATE TABLE senders (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  email VARCHAR(255),
  name VARCHAR(255),
  createdAt TIMESTAMP
);
```

### EmailCampaigns Table (EmailBatches)

```sql
CREATE TABLE email_batches (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  senderId UUID REFERENCES senders(id),
  subject VARCHAR(255),
  body TEXT,
  recipientCount INTEGER,
  sentCount INTEGER,
  createdAt TIMESTAMP,
  completedAt TIMESTAMP NULL
);
```

### EmailJobs Table

```sql
CREATE TABLE email_jobs (
  id UUID PRIMARY KEY,
  batchId UUID REFERENCES email_batches(id),
  recipient VARCHAR(255),
  subject VARCHAR(255),
  body TEXT,
  status ENUM('pending', 'processing', 'sent', 'failed'),
  sentAt TIMESTAMP NULL,
  error TEXT NULL,
  createdAt TIMESTAMP
);
```

## Scaling Considerations

### Multiple Backend Instances

If running multiple backend servers:

1. **All use same database** - PostgreSQL handles concurrent writes
2. **All use same Redis** - BullMQ queue is centralized
3. **Multiple workers** - Each instance can run workers
4. **Rate limiting safe** - Redis counters are atomic

```
Load Balancer (Port 3001)
    ↓
┌───────────────────────┐
│ Backend Instance 1    │──┐
└───────────────────────┘  │
│ Backend Instance 2    │──┼──→ PostgreSQL
└───────────────────────┘  │
│ Backend Instance 3    │──┤
└───────────────────────┘  │
                           ├──→ Redis
                           └──→ SMTP
```

### Multiple Frontend Instances

Frontend is stateless, so multiple instances are easy:

```
CDN / Load Balancer (Port 3000)
    ↓
┌──────────────────┐
│ Frontend Inst 1  │───┐
└──────────────────┘   │
│ Frontend Inst 2  │───┼──→ Backend (Port 3001)
└──────────────────┘   │
│ Frontend Inst 3  │───┘
└──────────────────┘
```

## Security Architecture

### Authentication Flow

```
1. Frontend:
   Google Login Button
   ↓
   User clicks, opens Google OAuth

2. Google:
   Authenticates user
   ↓
   Returns ID Token to frontend

3. Frontend:
   Stores token in memory/localStorage
   ↓
   Attaches to all API requests:
   Authorization: Bearer <token>

4. Backend:
   Receives request
   ↓
   Validates token signature
   ↓
   Extracts user email
   ↓
   Processes request
```

### Data Validation

```
Frontend:
  - Basic form validation
  - File size checks
  - Format checks

Backend (MUST verify):
  - Auth token valid
  - User owns this sender
  - Email addresses valid
  - Rate limit not exceeded
  - Database constraints
```

## Error Handling

### Frontend Error Flow

```
API Call
    ↓
Response Status?
    ├─ 200 OK → Success
    ├─ 400 Bad Request → Show validation error
    ├─ 401 Unauthorized → Redirect to login
    ├─ 429 Too Many Requests → Show rate limit message
    ├─ 500 Server Error → Show generic error
    └─ Network Error → Show offline message
```

### Backend Error Response

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "remaining_hours": 5,
    "reset_at": "2025-01-28T15:00:00Z"
  }
}
```

## Development Workflow

### Making Changes to Backend

1. Edit file in `backend/src/`
2. Server auto-reloads (hot reload)
3. Test with `curl` or frontend
4. Changes persist in PostgreSQL
5. Jobs continue in BullMQ

### Making Changes to Frontend

1. Edit file in `frontend/`
2. Browser auto-reloads (fast refresh)
3. Test functionality
4. Changes don't affect backend

### Adding New API Endpoint

1. Create route in `backend/src/routes/`
2. Add authentication check
3. Add validation
4. Implement logic
5. Return JSON response
6. Create `api.ts` function in frontend
7. Call from component

### Adding New Database Table

1. Update `backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. This creates migration file
4. Update backend code to use new table
5. No frontend changes needed

## Common Issues & Solutions

### Frontend can't connect to backend

**Problem**: CORS error or connection refused

**Solution**:
1. Check backend is running: `curl http://localhost:3001`
2. Check `.env.local` has correct URL
3. Check backend CORS config

### Backend rate limit not working

**Problem**: All emails send immediately

**Solution**:
1. Check `.env` has rate limit settings
2. Check Redis is running
3. Check rate limit logic in `backend/src/lib/rateLimit.ts`

### Jobs stuck in queue

**Problem**: Emails scheduled but not sending

**Solution**:
1. Check worker is running (see backend logs)
2. Check SMTP credentials
3. Check rate limit hasn't exceeded
4. Check job status in Prisma Studio

---

**Remember:** Backend and frontend are separate services. Each can be deployed independently to different servers.
