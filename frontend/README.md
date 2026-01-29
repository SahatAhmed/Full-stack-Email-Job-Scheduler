# Email Scheduler Frontend

A modern React/Next.js dashboard for managing email campaigns with real-time tracking and scheduling.

## Features

- **Authentication**: Mock Google OAuth login for demo purposes
- **Responsive Dashboard**: Modern UI with dark theme
- **Email Composition**: Rich form for creating email campaigns
- **CSV Upload**: Batch import email recipients
- **Real-time Tracking**: Monitor scheduled and sent emails
- **Rate Limit Awareness**: Display scheduling options with proper limits
- **Dark Theme**: Professional modern design

## Setup

### Prerequisites

- Node.js 18+
- Backend server running on `http://localhost:3001`

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure:
   - `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:3001/api`)

3. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Global styles and theme
│   ├── page.tsx            # Login page
│   └── dashboard/
│       └── page.tsx        # Dashboard page
├── components/
│   ├── Header.tsx          # Top navigation header
│   ├── Tabs.tsx            # Tab navigation component
│   ├── ScheduledEmailsTab.tsx   # Scheduled emails view
│   ├── SentEmailsTab.tsx        # Sent emails view
│   └── ComposeModal.tsx    # Email composition modal
├── lib/
│   ├── api.ts              # API client
│   ├── authStore.ts        # Auth state management (Zustand)
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
```

## Styling & Theme

The frontend uses:
- **Tailwind CSS v4**: Utility-first CSS framework
- **Custom CSS Variables**: Dark theme with semantic color tokens
- **Responsive Design**: Mobile-first approach

### Color Scheme

- **Background**: Dark (10, 10, 10)
- **Primary**: Blue (59, 130, 246)
- **Accent**: Green (16, 185, 129)
- **Secondary**: Gray (107, 114, 128)

Theme tokens are defined in `app/globals.css` and can be easily customized.

## Key Components

### Header

Top navigation bar displaying:
- Logo and app name
- User information (avatar, name, email)
- Logout button

### Dashboard Tabs

Two main sections:

1. **Scheduled Emails Tab**
   - View all pending email campaigns
   - Real-time progress tracking
   - Shows total, sent, and failed counts

2. **Sent Emails Tab**
   - View all successfully sent emails
   - Pagination support
   - Sender and recipient information
   - Timestamps

### Compose Modal

Complete email campaign creation form:
- Sender selection
- Subject and body editing
- CSV/TXT file upload for recipients
- Scheduling options (start time, delay, hourly limit)
- Validation and error handling
- Loading states and feedback

## API Integration

The frontend communicates with the backend via RESTful APIs:

### Email APIs
- `POST /api/emails/schedule` - Schedule new email campaign
- `GET /api/emails/scheduled` - Get pending campaigns
- `GET /api/emails/sent` - Get sent emails
- `GET /api/emails/batch/{batchId}` - Get campaign details
- `GET /api/emails/rate-limit-status` - Check rate limits

### Sender APIs
- `GET /api/senders` - List all senders
- `POST /api/senders` - Create new sender
- `GET /api/senders/{senderId}` - Get sender details

All requests include authentication headers:
- `X-User-ID`: User identifier
- `X-User-Email`: User email
- `X-User-Name`: User name
- `X-User-Avatar`: User avatar URL

## Authentication

The frontend uses a mock authentication system stored in localStorage:

```typescript
interface AuthUser {
  userId: string;
  email: string;
  name?: string;
  avatar?: string;
}
```

**In production**, replace with:
- NextAuth.js with Google OAuth provider
- Auth0 integration
- Custom JWT-based auth

## Data Fetching

Uses SWR (stale-while-revalidate) for efficient data fetching:

```typescript
import useSWR from 'swr';

const { data, isLoading, error } = useSWR('/endpoint', fetcher, {
  refreshInterval: 5000, // Auto-refresh every 5 seconds
});
```

## State Management

Uses Zustand for auth state:

```typescript
const { user, login, logout, isAuthenticated } = useAuthStore();
```

## File Upload Handling

CSV/TXT file parsing:

```typescript
function parseCSV(content: string): string[] {
  // Parses file content and extracts email addresses
  // Validates each email before returning
}
```

## Error Handling

Uses React Hot Toast for user feedback:

```typescript
toast.success('Email scheduled successfully');
toast.error('Failed to schedule email');
toast.warning('Some emails were invalid');
```

## Development

### Building

```bash
npm run build
```

### Production Start

```bash
npm start
```

### Linting

```bash
npm run lint
```

## Component Styling

All components use:
- Semantic Tailwind classes
- CSS variables for theming
- Responsive prefixes (sm:, md:, lg:)
- Accessible color contrast
- Consistent spacing using the Tailwind scale

Example:
```tsx
<button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
  Click me
</button>
```

## Performance Optimizations

- Code splitting via Next.js dynamic imports
- Image optimization
- SWR caching and deduplication
- Debounced form inputs
- Lazy loading of components

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Accessibility

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Color contrast compliance
- Focus management

## Future Enhancements

- [ ] Real Google OAuth integration
- [ ] Email template builder
- [ ] Advanced scheduling (recurring emails)
- [ ] Analytics dashboard
- [ ] Email personalization variables
- [ ] Sender verification flow
- [ ] Webhook notifications
- [ ] A/B testing interface

## License

MIT
