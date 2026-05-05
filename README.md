# Salesly 2.0

A web app for practicing sales interviews and objection-handling scenarios with instant AI feedback.

## Stack

- **Frontend:** Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Auth:** Google OAuth via Supabase
- **AI:** OpenAI (Whisper + GPT-4) — Phase 2

## Project Structure

```
src/
├── app/              # Next.js pages & API routes
├── components/       # React components (UI only)
├── lib/              # Utilities & clients
├── services/         # Business logic & integrations
├── hooks/            # Custom React hooks
├── types/            # TypeScript definitions
├── utils/            # Pure functions
└── styles/           # Global CSS & Tailwind
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repo
```bash
git clone <repo-url>
cd salesly-2.0
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Then edit `.env.local` and add:
- `NEXT_PUBLIC_SUPABASE_URL` — From Supabase dashboard
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — From Supabase dashboard
- `SUPABASE_SERVICE_ROLE_KEY` — From Supabase → Settings → API Keys

4. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details and create

### 2. Enable Google OAuth

1. Go to your project → Authentication → Providers
2. Enable "Google"
3. Set up Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 Client ID (Web application)
   - Add redirect URLs:
     ```
     https://your-project.supabase.co/auth/v1/callback
     http://localhost:3000/auth/v1/callback
     ```
   - Copy Client ID and Secret to Supabase

### 3. Create Storage Bucket

1. Go to Storage → New Bucket
2. Name: `audio-attempts`
3. Set to Private
4. Add CORS policy (see deployment notes)

## Development

### Run dev server
```bash
npm run dev
```

### Type checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Phases

### Phase 1: Foundation ✅
- [ ] Google OAuth login
- [ ] Problem browsing
- [ ] Audio recording & upload

### Phase 2: Core Flow
- [ ] Whisper transcription
- [ ] GPT-4 evaluation
- [ ] Feedback display

### Phase 3: Tracking
- [ ] Progress charts
- [ ] Attempt history
- [ ] Category breakdown

### Phase 4: Polish
- [ ] Leaderboards
- [ ] Achievements
- [ ] Advanced analytics

## Environment Variables

Create `.env.local`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (Phase 2)
OPENAI_API_KEY=sk-your-api-key

# Vercel (auto-filled)
NEXT_PUBLIC_VERCEL_URL=your-vercel-url.vercel.app
```

## Deployment

### Vercel

1. Push to GitHub
2. Connect GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Supabase CORS

Add this CORS config to Supabase Storage:

```json
[
  {
    "allowedHeaders": ["*"],
    "allowedMethods": ["GET", "POST", "PUT"],
    "allowedOrigins": ["http://localhost:3000", "https://your-vercel-url.vercel.app"],
    "exposedHeaders": [],
    "maxAgeSeconds": 3600
  }
]
```

## Documentation

- [API Documentation](./docs/API.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DB_SCHEMA.md)

## License

[Your License]
