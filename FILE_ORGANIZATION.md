## File Organization Guide

This document explains exactly where each type of file belongs in this monorepo.

## Golden Rule

**Backend code in `/backend`, Frontend code in `/frontend`, never mix.**

```
✅ CORRECT                          ❌ WRONG
backend/src/routes/api.ts          backend/components/Button.tsx
frontend/components/Form.tsx       frontend/prisma/schema.prisma
```

## Backend Organization (`/backend`)

### TypeScript Source Code

```
backend/src/
├── index.ts                  ← Main server entry point
├── config.ts                 ← Load & validate .env variables
│
├── routes/                   ← REST API endpoints
│   ├── emailRoutes.ts       ← POST/GET /api/emails/*
│   └── senderRoutes.ts      ← POST/GET /api/senders/*
│
├── middleware/               ← Express middleware functions
│   └── authMiddleware.ts    ← Verify Google tokens
│
├── lib/                      ← Core business logic
│   ├── queue.ts             ← BullMQ job queue setup
│   ├── rateLimit.ts         ← Rate limiting logic
│   ├── email.ts             ← SMTP email configuration
│   └── redis.ts             ← Redis client singleton
│
├── workers/                  ← Background job processors
│   └── sendEmailWorker.ts   ← BullMQ job processor
│
└── types/                    ← TypeScript type definitions
    └── apiTypes.ts          ← Request/Response types
```

**What goes here:**
- Express route handlers
- Database queries
- Business logic
- Job processing
- Rate limiting
- Email sending

**What NEVER goes here:**
- React components
- Next.js pages
- CSS styling
- Frontend utilities
- Client-side state

### Database Configuration

```
backend/prisma/
├── schema.prisma            ← PostgreSQL schema definition
└── migrations/              ← Database migration history
    ├── 20250128_init/
    └── ...
```

**What goes here:**
- Table definitions
- Relationships (foreign keys)
- Constraints
- Index definitions

**What NEVER goes here:**
- Any application code
- Tests
- Configuration

### Configuration Files

```
backend/
├── .env.example             ← Template with commented values
├── .env                     ← Actual values (NEVER commit)
├── package.json             ← Dependencies
├── tsconfig.json            ← TypeScript settings
└── README.md                ← Backend-specific documentation
```

**Environment Variables:**

```env
# backend/.env
DATABASE_URL=postgresql://user:pass@localhost/db
REDIS_URL=redis://localhost:6379
PORT=3001
SMTP_USER=ethereal@email.com
```

**Never in frontend:**
- Database credentials
- SMTP passwords
- Private API keys

## Frontend Organization (`/frontend`)

### React Components

```
frontend/components/
├── Header.tsx               ← Top navigation & user info
├── Tabs.tsx                 ← Tab navigation component
├── ComposeModal.tsx         ← Email compose form
├── ScheduledEmailsTab.tsx   ← Pending campaigns table
├── SentEmailsTab.tsx        ← Email history table
└── ui/                      ← shadcn/ui components
    ├── button.tsx
    ├── input.tsx
    ├── dialog.tsx
    └── ...
```

**What goes here:**
- React functional components
- Event handlers
- Component state (hooks)
- UI logic

**What NEVER goes here:**
- Database queries
- API route definitions
- Business logic
- Backend code

### Next.js App Structure

```
frontend/app/
├── layout.tsx              ← Root layout (wraps all pages)
├── globals.css             ← Global styles & theme tokens
├── page.tsx                ← Login page (/)
└── dashboard/
    └── page.tsx            ← Dashboard page (/dashboard)
```

**What goes here:**
- Next.js page components
- Global styles
- Layout wrappers

**What NEVER goes here:**
- Backend API routes (use `/backend/src/routes/`)
- Database schema
- Backend logic

### Utilities & Helpers

```
frontend/lib/
├── api.ts                  ← Backend API client functions
├── authStore.ts            ← Zustand auth state store
└── utils.ts                ← Helper functions (formatDate, etc)
```

**What goes here:**
- API client (fetch wrappers)
- State management
- Formatters & helpers

**What NEVER goes here:**
- Database access
- Business logic
- Backend configuration

### Styling

```
frontend/
├── app/globals.css         ← Global styles & CSS variables
├── tailwind.config.ts      ← Tailwind configuration
└── postcss.config.js       ← PostCSS configuration
```

**What goes here:**
- CSS custom properties (theme)
- Tailwind config
- PostCSS setup

### Static Assets

```
frontend/public/
├── placeholder-logo.png
├── placeholder-user.jpg
└── ...
```

**What goes here:**
- Images
- Fonts
- Icons
- Other static files

### Configuration Files

```
frontend/
├── .env.example            ← Template with public values only
├── .env.local              ← Actual values (NEVER commit)
├── package.json            ← Dependencies
├── tsconfig.json           ← TypeScript settings
├── next.config.js          ← Next.js settings
├── tailwind.config.ts      ← Tailwind settings
└── postcss.config.js       ← PostCSS settings
```

**Environment Variables:**

```env
# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

**Key difference:**
- `NEXT_PUBLIC_*` variables are visible to browser
- Never put secrets here
- Backend has ALL the secrets

## Root Level Files

Files at the project root:

```
/
├── docker-compose.yml      ← PostgreSQL + Redis services
├── .gitignore              ← Git configuration
├── README.md               ← Main project documentation
├── SETUP.md                ← Quick setup guide
├── QUICK_REFERENCE.md      ← Command reference
├── ARCHITECTURE.md         ← This document
└── IMPLEMENTATION_SUMMARY.md ← Technical deep dive
```

**What goes here:**
- Docker configuration
- Top-level documentation
- Project-wide configuration

**What NEVER goes here:**
- Application code (use `/backend` or `/frontend`)
- Test files
- Node modules
- Build output

## How to Add New Features

### Adding New Backend API Endpoint

1. **Create route file** (if needed):
   ```
   backend/src/routes/newRoutes.ts
   ```

2. **Add database table** (if needed):
   ```
   backend/prisma/schema.prisma
   ```

3. **Update types**:
   ```
   backend/src/types/apiTypes.ts
   ```

4. **Create migration**:
   ```bash
   cd backend
   npm run prisma:migrate
   ```

5. **Test with frontend** `lib/api.ts`

### Adding New Frontend Page

1. **Create page component**:
   ```
   frontend/app/new-page/page.tsx
   ```

2. **Add component** (if needed):
   ```
   frontend/components/NewComponent.tsx
   ```

3. **Add API client** (if calling backend):
   ```
   frontend/lib/api.ts
   ```

4. **Add styling** (if needed):
   ```
   frontend/app/globals.css
   ```

### Adding New Service (Email, Payment, etc.)

1. **Backend service**:
   ```
   backend/src/lib/newService.ts
   ```

2. **Use in routes**:
   ```
   backend/src/routes/newRoutes.ts
   ```

3. **Export from config**:
   ```
   backend/src/config.ts
   ```

## Common Mistakes

### ❌ Don't Do This

```typescript
// ❌ Database query in frontend component
frontend/components/EmailList.tsx:
  const [emails, setEmails] = useState([]);
  useEffect(() => {
    const emails = await db.query('SELECT * FROM emails');
    setEmails(emails);
  }, []);

// ❌ React component in backend
backend/src/lib/ui.ts:
  export function Button() {
    return <button>Click me</button>;
  }

// ❌ Backend .env secrets in frontend
frontend/.env.local:
  NEXT_PUBLIC_DATABASE_URL=postgresql://...
  NEXT_PUBLIC_SMTP_PASSWORD=secret
```

### ✅ Do This Instead

```typescript
// ✅ API call from frontend
frontend/lib/api.ts:
  export async function getEmails() {
    return fetch(`${API_URL}/api/emails`).then(r => r.json());
  }

frontend/components/EmailList.tsx:
  const { data: emails } = useSWR('/api/emails', getEmails);

// ✅ Backend route handles database
backend/src/routes/emailRoutes.ts:
  router.get('/emails', async (req, res) => {
    const emails = await db.email.findMany();
    res.json(emails);
  });

// ✅ Backend keeps secrets in .env
backend/.env:
  DATABASE_URL=postgresql://user:pass@localhost/db
  SMTP_PASSWORD=secret
```

## File Checklist

### Adding Backend Code

- [ ] File is in `backend/src/`
- [ ] TypeScript (`.ts` not `.js`)
- [ ] Proper error handling
- [ ] Input validation
- [ ] Types defined
- [ ] Exported functions

### Adding Frontend Code

- [ ] File is in `frontend/` (app, components, lib, public)
- [ ] React components use `.tsx`
- [ ] Utilities use `.ts`
- [ ] Import from `lib/api.ts` for backend calls
- [ ] Use Zustand for state if needed
- [ ] Tailwind classes for styling

### Adding Database Changes

- [ ] Update `backend/prisma/schema.prisma`
- [ ] Create migration
- [ ] Update types if needed
- [ ] Test locally

## Environment Variable Checklist

### Backend `.env`

**Must Include:**
- [ ] DATABASE_URL
- [ ] REDIS_URL
- [ ] PORT
- [ ] SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
- [ ] Rate limit settings
- [ ] FRONTEND_URL (for CORS)

**Never Share:**
- [ ] SMTP_PASSWORD
- [ ] DATABASE_URL
- [ ] Any secrets

### Frontend `.env.local`

**May Include:**
- [ ] NEXT_PUBLIC_BACKEND_URL
- [ ] NEXT_PUBLIC_GOOGLE_CLIENT_ID

**Never Include:**
- [ ] Any private keys
- [ ] Any passwords
- [ ] Any backend secrets

## Deploying Independently

This structure allows independent deployment:

```
Backend only:
  → Deploy backend/ to one server (Railway, Render, etc)
  → Update FRONTEND_URL in .env

Frontend only:
  → Deploy frontend/ to another server (Vercel, etc)
  → Update NEXT_PUBLIC_BACKEND_URL in .env.local

Both independent - can be deployed separately!
```

## Maintenance Reminders

1. **Weekly**: Check for unused dependencies
2. **Monthly**: Update npm packages
3. **Per commit**: Follow folder organization
4. **Before deploy**: Test both backend and frontend locally
5. **After deploy**: Verify both services work together

---

**Key Takeaway:** Clear separation makes the project maintainable, scalable, and easy to understand.
