## Visual Guide to Email Scheduler

Complete visual diagrams showing how the system works.

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│               USER (Browser)                            │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   FRONTEND (Port 3000)    │
        │   ▪ Login Page            │
        │   ▪ Dashboard             │
        │   ▪ Compose Modal         │
        └─────────────┬─────────────┘
                      │
                 HTTP API
                      │
        ┌─────────────▼─────────────┐
        │   BACKEND (Port 3001)     │
        │   ▪ Routes                │
        │   ▪ Middleware            │
        │   ▪ Business Logic        │
        │   ▪ Worker                │
        └──┬─────┬─────┬────────────┘
           │     │     │
    ┌──────▼─┐  ┌▼─────▼──┐   ┌──────────┐
    │PostgreSQL  │ Redis   │   │ Ethereal │
    │ Database   │ Queue   │   │ SMTP     │
    └───────────┘ └────────┘   └──────────┘
```

### Detailed Backend Flow

```
                  HTTP REQUEST
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Express Server (Port 3001) │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Auth Middleware            │
        │   Verify Google Token        │
        └──────────────┬───────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
   ┌─────────────┐           ┌──────────────┐
   │  POST Route │           │  GET Route   │
   │             │           │              │
   │ /schedule   │           │ /scheduled   │
   │ /senders    │           │ /sent        │
   └──┬──────────┘           └──────────────┘
      │
      ▼
   ┌─────────────────────────────────┐
   │  Business Logic                 │
   │  ▪ Validate input               │
   │  ▪ Check rate limits            │
   │  ▪ Create jobs                  │
   └──┬──────────┬─────────┬─────────┘
      │          │         │
      ▼          ▼         ▼
   Database  Queue    Rate Limit
   (Save)    (Queue)  (Check)
      │          │         │
   ┌──▼──────────▼─────────▼──┐
   │   Return Response         │
   │   ├─ Status 200           │
   │   ├─ JSON data            │
   │   └─ Success message      │
   └──────────────┬────────────┘
                  │
                  ▼
            HTTP RESPONSE
```

### Job Processing Flow

```
User Schedules Email
        │
        ▼
┌──────────────────┐
│ Create Campaign  │
│ Save to Database │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Create BullMQ    │
│ Jobs (1 per      │
│ recipient)       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Store in Redis   │
│ (Persistent)     │
└────────┬─────────┘
         │
         ▼
    ┌────────────┐
    │   WAITING  │ ← Job sits here until scheduled time
    │   Delayed  │
    └────┬───────┘
         │
    [TIME PASSES]
         │
         ▼
    ┌────────────┐
    │   ACTIVE   │ ← Ready to process
    │   Ready    │
    └────┬───────┘
         │
         ▼
┌──────────────────┐
│ Worker Picks Up  │
│ Job              │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Check Rate Limit │
│ (Redis Counter)  │
└────────┬─────────┘
         │
    ┌────┴────┐
    │ Limit?  │
    ├────┬────┤
    │Yes │ No │
    │    │    │
    │    ▼    │
    │  SEND   │
    │    │    │
    ▼    ▼    │
RESCHEDULE  UPDATE DB
NEXT HOUR   SENT STATUS
         │
         ▼
    ┌────────────┐
    │  COMPLETE  │
    │  Finished  │
    └────────────┘
```

---

## Frontend Components

### Page Structure

```
Frontend Application
    │
    ├── Login Page (/)
    │   ├── Header
    │   ├── Google OAuth Button
    │   └── Demo Login Button
    │
    └── Dashboard (/dashboard)
        ├── Header
        │   ├── User Avatar
        │   ├── User Name
        │   ├── User Email
        │   └── Logout Button
        │
        ├── Toolbar
        │   └── "Compose Email" Button
        │
        ├── Tabs
        │   ├── Scheduled Emails Tab
        │   │   └── ScheduledEmailsTab Component
        │   │       ├── Campaign List Table
        │   │       ├── Progress Bar
        │   │       └── Pagination
        │   │
        │   └── Sent Emails Tab
        │       └── SentEmailsTab Component
        │           ├── Email History Table
        │           ├── Status Column
        │           └── Pagination
        │
        └── Compose Modal (overlays dashboard)
            ├── Sender Selector
            ├── Subject Input
            ├── Body Text Editor
            ├── CSV Upload
            ├── Recipient Count Display
            ├── Schedule Settings
            │   ├── Start Time Picker
            │   ├── Delay Between Emails
            │   └── Hourly Limit
            └── Schedule Button / Cancel Button
```

### Component Hierarchy

```
App
├── Header
│   ├── UserAvatar
│   ├── UserName
│   ├── UserEmail
│   └── LogoutButton
│
├── Tabs
│   ├── TabNav
│   │   ├── ScheduledTab
│   │   └── SentTab
│   │
│   └── TabContent
│       ├── ScheduledEmailsTab (when selected)
│       │   ├── Table
│       │   │   ├── HeaderRow
│       │   │   └── DataRows
│       │   └── Pagination
│       │
│       └── SentEmailsTab (when selected)
│           ├── Table
│           │   ├── HeaderRow
│           │   └── DataRows
│           └── Pagination
│
└── ComposeModal (portal)
    ├── ModalHeader
    ├── Form
    │   ├── SenderSelect
    │   ├── SubjectInput
    │   ├── BodyTextArea
    │   ├── FileUpload
    │   │   └── CSVUpload
    │   ├── RecipientCount
    │   ├── StartTimePicker
    │   ├── DelaySlider
    │   └── LimitInput
    └── ModalFooter
        ├── CancelButton
        └── ScheduleButton
```

---

## Data Flow Diagrams

### Schedule Email Flow

```
┌─────────────────────────────┐
│ User fills compose form     │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Frontend validates form     │
│ ├─ Required fields         │
│ ├─ CSV file valid          │
│ └─ Schedule time valid     │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Calls backend API           │
│ POST /api/emails/schedule   │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Backend receives request    │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Validate auth token         │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Validate input data         │
│ ├─ Sender exists            │
│ ├─ Emails valid             │
│ └─ Schedule time valid      │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Save to PostgreSQL          │
│ ├─ EmailBatch record        │
│ └─ EmailJob records         │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Create BullMQ jobs          │
│ ├─ One job per recipient    │
│ ├─ Scheduled time set       │
│ └─ All in Redis             │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Return success response     │
│ ├─ campaignId              │
│ ├─ totalEmails             │
│ └─ scheduledAt             │
└────────────┬────────────────┘
             ���
             ▼
┌─────────────────────────────┐
│ Frontend updates UI         │
│ ├─ Close compose modal      │
│ ├─ Show success toast       │
│ └─ Refresh campaign list    │
└─────────────────────────────┘
```

### Real-Time Update Flow

```
Frontend Dashboard Loaded
        │
        ▼
Starts Polling (5 sec interval)
        │
        ├──────────────────┐
        │                  │
        ▼                  │
    GET /api/emails/scheduled
        │                  │
        ▼                  │
Backend Returns Updated Data
    {                      │
      campaigns: [         │
        {                  │
          id: "...",       │
          sentCount: 45,   │
          totalCount: 100  │
        }                  │
      ]                    │
    }                      │
        │                  │
        ▼                  │
Frontend Updates Table
    ├─ Update progress bar │
    ├─ Update sent count  │
    └─ Refresh UI         │
        │                  │
        └──────────────────┘
            (repeat)
```

---

## Database Schema Diagram

```
┌──────────────────────┐
│      USERS           │
├──────────────────────┤
│ id (UUID)       [PK] │
│ email           [U]  │
│ name                 │
│ createdAt            │
└──────────────────────┘
         │
         │ 1:M
         │
┌────────▼──────────────┐
│      SENDERS          │
├───────────────────────┤
│ id (UUID)        [PK] │
│ userId           [FK] │
│ email                 │
│ name                  │
│ createdAt             │
└────────┬──────────────┘
         │
         │ 1:M
         │
┌────────▼──────────────────┐
│    EMAIL_BATCHES          │
├───────────────────────────┤
│ id (UUID)            [PK] │
│ userId               [FK] │
│ senderId             [FK] │
│ subject                   │
│ body                      │
│ recipientCount            │
│ sentCount                 │
│ createdAt                 │
│ completedAt (nullable)    │
└────────┬──────────────────┘
         │
         │ 1:M
         │
┌────────▼──────────────────┐
│     EMAIL_JOBS            │
├───────────────────────────┤
│ id (UUID)            [PK] │
│ batchId              [FK] │
│ recipient                 │
│ subject                   │
│ body                      │
│ status (enum)             │
│ sentAt (nullable)         │
│ error (nullable)          │
│ createdAt                 │
└───────────────────────────┘
```

### Job Status Lifecycle

```
Job Created
    │
    ▼
PENDING ◄─────────────────────┐
    │                         │
    │ [Scheduled Time        │
    │  reached]              │
    │                         │
    ▼                         │
ACTIVE                        │
    │                         │
    ├─────────────┐           │
    │             │           │
    │             ▼           │
    │        Check Rate Limit │
    │             │           │
    │        ┌────┴─────┐     │
    │        │ Exceeded? │    │
    │        ├─Yes─┬─No──┤    │
    │        │     │     │    │
    │        │     │     ▼    │
    │        │     │    SENT  │
    │        │     │     │    │
    │        │     │     ▼    │
    │        │     │   Complete ✓
    │        │     │
    ▼        │     │
RESCHEDULED ◄─┘    │
    │              │
    │ [Next Hour]  │
    │              │
    └──────────────┘

Error Path:
ACTIVE
    │
    ├─ Error on attempt 1
    │
    ▼
RETRY (attempt 2)
    │
    ├─ Error on attempt 2
    │
    ▼
RETRY (attempt 3)
    │
    ├─ Error on attempt 3
    │
    ▼
FAILED (no more retries)
    │
    ▼
Manual Investigation
```

---

## API Communication

### Request/Response Flow

```
FRONTEND                          BACKEND

Prepare Data
  │
  │ Content-Type: application/json
  │ Authorization: Bearer <token>
  │
  ▼
POST /api/emails/schedule
────────────────────────────────────────────►

  {
    "senderId": "...",
    "subject": "...",
    "body": "...",
    "recipients": ["..."],
    "startTime": 1704067200000,
    "delayBetweenEmails": 2000,
    "maxEmailsPerHour": 100
  }

                                  Receive Request
                                    │
                                    ▼
                            Validate Auth Token
                                    │
                                    ├─ Valid?
                                    │
                                    ▼
                            Process Request
                            ├─ Validate input
                            ├─ Save to DB
                            ├─ Create jobs
                            │
                                    ▼
                            Prepare Response

                            {
                              "campaignId": "...",
                              "totalEmails": 100,
                              "scheduledAt": "2025-01-28T..."
                            }

◄────────────────────────────────────────────
    HTTP 200 OK
    Content-Type: application/json

Parse Response
  │
  ▼
Update UI
  │
  ├─ Close modal
  ├─ Show success
  ▼
Refresh Campaign List
```

---

## Rate Limiting Visualization

### Per-Hour Window

```
Hour 1 (14:00-15:00)
├─ Global limit: 500 emails
├─ Sender A limit: 200 emails
└─ Sender B limit: 200 emails

Scenario: 1000 emails scheduled

    Sender A    Sender B    Total
    ────────    ────────    ─────
Hour 1:  200      300       500 ✓ (hit global limit)
Hour 2:  0        0         0
Hour 3:  0        0         0
Hour 4:  0        0         0
Hour 5:  0        0         0

Jobs queued for hour 1: 200 (A) + 300 (B) = 500
Remaining jobs: 500
Rescheduled to hour 2, hour 3, etc.
```

### Rate Limit Check in Worker

```
Worker Receives Job
    │
    ▼
Check Hour Window
    │
    ▼
Get Redis Counter
    key: rate_limit:sender:<senderID>:hour:<hour>
    │
    ├─ Counter < limit?
    │   │
    │   ├─ YES: Continue to send email
    │   │        Increment counter
    │   │        Send email
    │   │        Mark job as SENT
    │   │
    │   └─ NO: Rate limit exceeded
    │           Reschedule job to next hour
    │           Mark job as RESCHEDULED
    ���           Add delay offset
    │
    ▼
Continue to next job
```

---

## Deployment Architecture

### Development (Local)

```
Your Machine
├── Docker
│   ├── PostgreSQL (localhost:5432)
│   └── Redis (localhost:6379)
├── Backend (npm run dev)
│   └── http://localhost:3001
└── Frontend (npm run dev)
    └── http://localhost:3000
```

### Production (Separate Services)

```
Internet
    │
    ├──► CDN / Load Balancer
    │        │
    │        ▼
    │    Frontend (Vercel)
    │    https://app.example.com
    │
    └──► Reverse Proxy
             │
             ▼
         Backend (Railway/Render)
         https://api.example.com
             │
             ├──► PostgreSQL (AWS RDS)
             ├──► Redis (Redis Cloud)
             └──► SMTP (SendGrid)
```

---

## Component Interaction Diagram

```
User

┌──────────────────────────────────────────┐
│          Login Page                      │
│  ┌──────────────────────────────────┐    │
│  │ [Google OAuth] [Demo Login]      │    │
│  └──────────────────────────────────┘    │
└────────────────┬─────────────────────────┘
                 │ authenticate
                 ▼
    Backend validates token
    Stores in authStore
                 │
                 ▼
┌──────────────────────────────────────────┐
│        Dashboard Page                    │
├──────────────────────────────────────────┤
│  ┌────────────────────────────────────┐  │
│  │  Header                            │  │
│  │  [Avatar] [Name] [Email] [Logout]  │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  [Compose Email Button]            │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  ScheduledEmailsTab │ SentEmailsTab│  │
│  ├────────────────────────────────────┤  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │ Campaign 1    | Progress  45%│  │  │
│  │  │ Campaign 2    | Progress  78%│  │  │
│  │  │ ...                         │  │  │
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
         │
         ├─ Click "Compose Email"
         │
         ▼
    ┌─────────────────────────┐
    │  Compose Modal (overlay)│
    ├─────────────────────────┤
    │ Sender: [Dropdown]      │
    │ Subject: [Input]        │
    │ Body: [Text Area]       │
    │ Recipients: [Upload]    │
    │ Count: 1000 emails      │
    │ Start: [Date/Time]      │
    │ Delay: 2000ms           │
    │ Limit: 200/hour         │
    │                         │
    │ [Cancel] [Schedule]     │
    └─────────────────────────┘
         │
         ├─ Click "Schedule"
         │
         ▼
    Validate & Send to Backend
    Backend processes
    Creates jobs
    Returns success
         │
         ▼
    Modal closes
    Success toast shows
    Campaign list refreshes
```

---

## Error Handling Flow

```
User Action
    │
    ▼
┌──────────────────┐
│ Frontend Action  │
└────────┬─────────┘
         │
         ▼
Try to API Call
    │
    ├─────────────┬─────────────┬────────────────┐
    │             │             │                │
    ▼             ▼             ▼                ▼
Network       500 Error      401 Unauth      400 Bad Input
Error         (Server)       (Token)         (Validation)
    │             │             │                │
    ▼             ▼             ▼                ▼
Show Toast:   Show Toast:   Redirect to   Show Toast:
"Network      "Server       Login         "Fix your
Error"        Error"        Page          input"
    │             │             │                │
    ▼             ▼             ▼                ▼
Let user    Let user      Clear tokens    Highlight
retry       report        Start over      form field
                issue
```

---

## Summary Flowchart

```
START
  │
  ▼
User Opens http://localhost:3000
  │
  ├─ Logged in? ────────────┐
  │ (check auth store)       │
  │                          No
  │  Yes                    │
  │  │                      │
  │  └──────┐               │
  │         ▼               │
  │    Dashboard ◄──────────┘
  │         │               Login Page
  │         │               │
  │         ├─── [Compose Email Button]
  │         │
  │         ├─ [Scheduled Emails Tab]
  │         │   └─ Show campaigns
  │         │       with progress
  │         │
  │         └─ [Sent Emails Tab]
  │             └─ Show history
  │                 with status
  │
  ├─ User clicks "Compose"
  │         │
  │         ▼
  │    Fill Form
  │    Upload CSV
  │    Set Schedule
  │         │
  │         ▼
  │    Click "Schedule"
  │         │
  │         ▼
  │    Backend creates jobs
  │    Jobs stored in Redis
  │         │
  │         ▼
  │    Dashboard updates
  │    Shows in "Scheduled"
  │    Progress tracking
  │         │
  │         ▼
  │    Scheduled time arrives
  │    Worker processes job
  │    Email sent
  │         │
  │         ▼
  │    Shows in "Sent Emails"
  │    with timestamp
  │
  └─ User logs out
      │
      ▼
      Login Page

END
```

---

This visual guide complements the written documentation. Use these diagrams to understand:

- How data flows through the system
- Component relationships
- Architecture patterns
- Error handling
- Deployment options

Reference this guide when reading the detailed documentation.
