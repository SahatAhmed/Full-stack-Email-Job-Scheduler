# Quick Reference Card

## URLs

| What | URL |
|------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Database GUI | http://localhost:5555 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

## Credentials

| Service | User | Password |
|---------|------|----------|
| PostgreSQL | scheduler_user | scheduler_password |
| Redis | (none) | (none) |
| Frontend | Demo Login | (try demo button) |

## Essential Commands

### Services
```bash
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose logs -f        # View logs
```

### Backend
```bash
cd backend
npm install                   # Install dependencies
npm run dev                   # Start dev server
npm run build                 # Build for production
npm run prisma:migrate        # Run database migrations
npm run prisma:generate       # Generate Prisma client
npm run prisma:studio         # Open database GUI
```

### Frontend
```bash
cd frontend
npm install                   # Install dependencies
npm run dev                   # Start dev server
npm run build                 # Build for production
npm start                     # Start production server
```

## API Examples

### Test Emails
```bash
# Create a sender
curl -X POST http://localhost:3001/api/senders \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-123" \
  -H "X-User-Email: test@example.com" \
  -d '{
    "email": "noreply@example.com",
    "name": "No Reply"
  }'

# Get all senders
curl -X GET http://localhost:3001/api/senders \
  -H "X-User-ID: test-123" \
  -H "X-User-Email: test@example.com"

# Check rate limits
curl -X GET "http://localhost:3001/api/emails/rate-limit-status?senderId=SENDER_ID" \
  -H "X-User-ID: test-123" \
  -H "X-User-Email: test@example.com"

# Get scheduled emails
curl -X GET http://localhost:3001/api/emails/scheduled \
  -H "X-User-ID: test-123" \
  -H "X-User-Email: test@example.com"

# Get sent emails
curl -X GET "http://localhost:3001/api/emails/sent?limit=10&offset=0" \
  -H "X-User-ID: test-123" \
  -H "X-User-Email: test@example.com"
```

## File Locations

### Configuration
- Backend config: `backend/.env`
- Frontend config: `frontend/.env.local`
- Database schema: `backend/prisma/schema.prisma`
- Tailwind theme: `frontend/app/globals.css`

### Core Logic
- Job queue: `backend/src/lib/queue.ts`
- Rate limiting: `backend/src/lib/rateLimit.ts`
- Email sending: `backend/src/workers/sendEmailWorker.ts`
- API routes: `backend/src/routes/`
- Dashboard: `frontend/app/dashboard/`

## Environment Variables

### Backend (.env)

**Required:**
```
DATABASE_URL=postgresql://scheduler_user:scheduler_password@localhost:5432/email_scheduler
REDIS_URL=redis://localhost:6379
SMTP_USER=ethereal_email@ethereal.email
SMTP_PASSWORD=ethereal_password
```

**Optional:**
```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MAX_EMAILS_PER_HOUR_GLOBAL=500
MAX_EMAILS_PER_HOUR_PER_SENDER=200
QUEUE_WORKER_CONCURRENCY=5
DELAY_BETWEEN_EMAILS_MS=2000
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Database Queries

### Connect to PostgreSQL
```bash
psql postgresql://scheduler_user:scheduler_password@localhost:5432/email_scheduler
```

### Quick Queries
```sql
-- View all users
SELECT id, email, name FROM users;

-- View all email batches
SELECT id, subject, totalEmails, sentCount, failedCount FROM email_batches;

-- View pending emails
SELECT id, recipientEmail, status, scheduledTime FROM email_jobs WHERE status = 'PENDING';

-- Count emails by status
SELECT status, COUNT(*) FROM email_jobs GROUP BY status;

-- View latest sent emails
SELECT recipientEmail, sentTime FROM email_jobs WHERE status = 'SENT' ORDER BY sentTime DESC LIMIT 10;
```

## Troubleshooting Checklist

- [ ] Docker services running? `docker ps`
- [ ] Backend running? `http://localhost:3001/health`
- [ ] Frontend running? `http://localhost:3000`
- [ ] .env files configured? `cat backend/.env`
- [ ] Database migrations run? `npm run prisma:migrate`
- [ ] Ethereal credentials valid? Check `.env`
- [ ] Can connect to PostgreSQL? `psql $DATABASE_URL`
- [ ] Can connect to Redis? `redis-cli ping`

## Rate Limit Info

**Default Limits:**
- Global: 500 emails/hour
- Per-sender: 200 emails/hour

**How to change:**
1. Edit `backend/.env`
2. Change `MAX_EMAILS_PER_HOUR_GLOBAL` and `MAX_EMAILS_PER_HOUR_PER_SENDER`
3. Restart backend: `npm run dev`

## Common Issues & Fixes

### Services won't start
```bash
docker-compose down
docker-compose up -d
```

### Backend won't connect to DB
```bash
# Check DB is running
docker ps | grep postgres

# Reset migrations
rm -rf backend/prisma/migrations
npm run prisma:migrate
```

### Frontend API errors
```bash
# Check API URL in .env.local
cat frontend/.env.local

# Backend must be running
curl http://localhost:3001/health
```

### Emails not sending
```bash
# Check SMTP credentials in .env
# Check backend logs: npm run dev
# Verify Ethereal account is valid

# Test SMTP manually
node -e "const nodemailer = require('nodemailer'); nodemailer.createTransport({host: 'smtp.ethereal.email', port: 587, auth: {user: 'YOUR_EMAIL', pass: 'YOUR_PASS'}}).verify(console.log)"
```

## Performance Tips

1. **Increase throughput**: Raise `QUEUE_WORKER_CONCURRENCY`
2. **Faster sending**: Lower `DELAY_BETWEEN_EMAILS_MS`
3. **More emails/hour**: Increase rate limits
4. **Database speed**: Use `npm run prisma:studio` to monitor

## Useful Tools

| Tool | Command | Purpose |
|------|---------|---------|
| Prisma Studio | `npm run prisma:studio` | Visual database browser |
| PostgreSQL CLI | `psql $DATABASE_URL` | SQL queries |
| Redis CLI | `redis-cli` | Check Redis data |
| cURL | `curl -X GET http://...` | Test APIs |
| Postman | Download app | GUI API testing |

## Next Actions

1. ✅ Read SETUP.md for installation
2. ✅ Start services: `docker-compose up -d`
3. ✅ Setup backend: Follow SETUP.md
4. ✅ Setup frontend: Follow SETUP.md
5. ✅ Test basic flow: Login → Compose → Schedule
6. ✅ Read IMPLEMENTATION_SUMMARY.md for deep dive
7. ✅ Deploy to production (see README.md)

## Key Concepts

| Concept | Meaning |
|---------|---------|
| BullMQ | Job queue library using Redis |
| Email Batch | Group of emails scheduled together |
| Email Job | Individual email record |
| Rate Limit | Max emails per hour (global or per-sender) |
| Worker | Process that sends emails from queue |
| Idempotency | No duplicates even on retry |
| Persistence | Data survives server restarts |

## Login Headers

When testing API without frontend:
```
X-User-ID: test-123
X-User-Email: test@example.com
X-User-Name: Test User
X-User-Avatar: https://example.com/avatar.jpg
```

---

**Print this or bookmark it!** Contains everything needed for quick reference.
