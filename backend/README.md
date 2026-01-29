# Email Scheduler Backend

A production-grade email scheduling service built with Express.js, BullMQ, Redis, and PostgreSQL.

## Features

- **Persistent Job Scheduling**: Uses BullMQ + Redis for reliable email scheduling that survives server restarts
- **Rate Limiting**: Global and per-sender email rate limiting with Redis-backed counters
- **Concurrent Email Processing**: Configurable worker concurrency for parallel email sending
- **Ethereal Email Integration**: Fake SMTP for testing email sending
- **REST API**: Clean API for scheduling, monitoring, and managing emails
- **Database Persistence**: PostgreSQL + Prisma for robust data management

## Architecture

### Core Components

1. **Express Server**: HTTP API for email scheduling and status monitoring
2. **BullMQ**: Job queue backed by Redis for persistent, delayed job scheduling
3. **Redis**: In-memory data store for job queue and rate limiting
4. **PostgreSQL**: Database for email batch and job storage
5. **Email Worker**: BullMQ worker that processes email jobs and sends via SMTP

### Scheduling Flow

```
1. Frontend submits schedule request
2. API creates EmailBatch and EmailJob records
3. Each EmailJob is added to BullMQ queue with a delay
4. Worker processes jobs at their scheduled time
5. Email is sent via Ethereal SMTP
6. Job status is updated in database
7. Rate limits are enforced and tracked in Redis
```

## Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (optional, for Redis and PostgreSQL)
- Ethereal Email account (free at https://ethereal.email/)

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:
   - `DATABASE_URL`: PostgreSQL connection string
   - `REDIS_URL`: Redis connection string
   - `SMTP_USER` and `SMTP_PASSWORD`: From Ethereal Email
   - Other configuration as needed

3. **Start Redis and PostgreSQL with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   Or install manually on your system.

4. **Setup database**
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3001`

## Configuration

All configuration is via environment variables in `.env`:

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/email_scheduler

# Redis
REDIS_URL=redis://localhost:6379

# SMTP (Ethereal Email)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_email@ethereal.email
SMTP_PASSWORD=your_ethereal_password
SMTP_FROM=noreply@emailscheduler.local

# Rate Limiting
MAX_EMAILS_PER_HOUR_GLOBAL=500
MAX_EMAILS_PER_HOUR_PER_SENDER=200

# Queue Configuration
QUEUE_WORKER_CONCURRENCY=5
DELAY_BETWEEN_EMAILS_MS=2000
```

## Rate Limiting Strategy

### Implementation

Rate limiting is enforced using **Redis-backed counters** to ensure safety across multiple worker instances:

- **Global Limit**: Tracks total emails sent in current hour via `emails:hour:{timestamp}` key
- **Per-Sender Limit**: Tracks emails per sender via `emails:sender:{senderId}:hour:{timestamp}` key
- **Atomic Operations**: Redis `INCR` and `EXPIRE` operations are atomic

### Behavior

1. **Check Phase**: Before sending, worker checks if limits are exceeded
2. **Send Phase**: If within limits, email is sent and counters are incremented
3. **Reschedule Phase**: If limit exceeded, job is rescheduled with exponential backoff

### When Limits are Exceeded

When hourly limits are reached:
- Jobs are **not dropped** or permanently failed
- Jobs are **rescheduled** with exponential backoff (2s, 4s, 8s...)
- Worker will retry next hour when counters reset
- Order is **preserved as much as possible** within rate limits

### Default Limits

- Global: 500 emails/hour
- Per-Sender: 200 emails/hour
- Both are configurable via environment variables

## Concurrency & Performance

### Worker Configuration

- **QUEUE_WORKER_CONCURRENCY**: Number of emails processed in parallel (default: 5)
- **DELAY_BETWEEN_EMAILS_MS**: Minimum delay between each email send (default: 2000ms)

### Throughput Examples

With default configuration (5 concurrency, 2s delay):
- **Sequential mode**: ~1,800 emails/hour (5 × 3600 / 2000)
- **With parallelism**: Up to 9,000 emails/hour (5 workers × 1,800)
- **Respecting rate limits**: Capped at 500 emails/hour global

### Handling High Volume

When 1000+ emails are scheduled for roughly the same time:

1. First 5 jobs start immediately (concurrency limit)
2. Remaining jobs wait in queue
3. As jobs complete, new ones start
4. Rate limiting window resets every hour
5. Jobs flow through the system at configured throughput

## API Endpoints

### Schedule Emails
```http
POST /api/emails/schedule
Content-Type: application/json
X-User-ID: user-id
X-User-Email: user@example.com

{
  "senderId": "sender-id",
  "subject": "Hello",
  "body": "<p>Hello {{name}}</p>",
  "recipients": ["user1@example.com", "user2@example.com"],
  "startTime": 1234567890000,
  "delayBetweenMs": 2000,
  "hourlyLimit": 200
}
```

### Get Scheduled Emails
```http
GET /api/emails/scheduled
X-User-ID: user-id
X-User-Email: user@example.com
```

### Get Sent Emails
```http
GET /api/emails/sent?limit=100&offset=0
X-User-ID: user-id
X-User-Email: user@example.com
```

### Get Batch Details
```http
GET /api/emails/batch/:batchId
X-User-ID: user-id
X-User-Email: user@example.com
```

### Rate Limit Status
```http
GET /api/emails/rate-limit-status?senderId=sender-id
X-User-ID: user-id
X-User-Email: user@example.com
```

### Create Sender
```http
POST /api/senders
Content-Type: application/json
X-User-ID: user-id
X-User-Email: user@example.com

{
  "email": "noreply@example.com",
  "name": "No Reply"
}
```

### Get Senders
```http
GET /api/senders
X-User-ID: user-id
X-User-Email: user@example.com
```

## Database Schema

### Key Tables

**users**: Stores user information
- id, email, name, googleId, avatar

**senders**: Email addresses users can send from
- id, email, name, userId

**email_batches**: Groups of emails scheduled together
- id, userId, subject, body, startTime, totalEmails, sentCount, failedCount

**email_jobs**: Individual email records
- id, batchId, senderId, recipientEmail, subject, scheduledTime, sentTime, status

**Email Statuses**: PENDING → PROCESSING → SENT/FAILED

## Server Restart Behavior

### Job Persistence

When the server restarts:

1. **Unprocessed Jobs**: All jobs still in Redis queue are preserved
2. **Delayed Jobs**: Jobs scheduled for future times remain intact
3. **In-Progress Jobs**: Workers are gracefully shut down, in-progress jobs are returned to queue
4. **Sent Jobs**: Database records are persisted, no re-sending occurs

### Why This Works

- **BullMQ persistence**: All job data is stored in Redis, not in-memory
- **Database atomicity**: Job status updates are committed before marking complete
- **Unique Job IDs**: Prevents duplicate sends via idempotency keys

## Development

### Running locally

```bash
# Terminal 1: Start services
docker-compose up

# Terminal 2: Start dev server
cd backend
npm run dev

# Terminal 3: Optional - Prisma Studio (visual DB browser)
npm run prisma:studio
```

### Testing with cURL

```bash
# Create a sender
curl -X POST http://localhost:3001/api/senders \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-1" \
  -H "X-User-Email: test@example.com" \
  -d '{
    "email": "noreply@example.com",
    "name": "No Reply"
  }'

# Schedule an email
curl -X POST http://localhost:3001/api/emails/schedule \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-1" \
  -H "X-User-Email: test@example.com" \
  -d '{
    "senderId": "sender-id",
    "subject": "Hello",
    "body": "<p>Hello World</p>",
    "recipients": ["recipient@example.com"],
    "startTime": '$(date +%s000)',
    "delayBetweenMs": 2000,
    "hourlyLimit": 200
  }'
```

## Production Deployment

### Key Considerations

1. **Redis Persistence**: Enable Redis AOF or RDB snapshots
2. **Database Backups**: Regular PostgreSQL backups
3. **SMTP Credentials**: Use secrets management (not .env files)
4. **Worker Scaling**: Run multiple worker instances pointing to same Redis/DB
5. **Monitoring**: Track queue depth, job success/failure rates
6. **Rate Limits**: Adjust based on your email provider's limits

### Multi-Instance Setup

When running multiple server instances:

1. Only ONE instance should run the BullMQ worker (prevent duplicate processing)
2. All instances can receive API requests
3. Redis acts as the single source of truth
4. Database ensures consistency

Alternatively, use BullMQ's distributed locking or separate worker instances.

## Troubleshooting

### Jobs not sending

1. Check email transporter with Ethereal credentials
2. Verify SMTP_USER and SMTP_PASSWORD are correct
3. Check worker logs: `[WORKER]` prefix messages
4. Review job status: `GET /api/emails/batch/{batchId}`

### Rate limiting issues

1. Check current limits: `GET /api/emails/rate-limit-status`
2. Verify MAX_EMAILS_PER_HOUR_* settings
3. Check Redis counters: Use Redis CLI `KEYS emails:*`

### Database connection errors

1. Verify DATABASE_URL is correct
2. Check PostgreSQL container is running: `docker ps`
3. Test connection: `psql $DATABASE_URL`

### Queue not processing

1. Verify Redis is running: `redis-cli ping`
2. Check worker logs for errors
3. View queue status: Use Prisma Studio to check email_jobs table

## License

MIT
