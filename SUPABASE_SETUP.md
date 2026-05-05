# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create account
3. Click "New Project"
4. Fill in:
   - **Project name:** `salesly-2.0`
   - **Database password:** Create a secure password
   - **Region:** Choose closest to your users
5. Click "Create new project" (wait 2-3 minutes)

## 2. Get Your Credentials

Once project is created:

1. Go to **Settings → API**
2. Copy these values to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` ← Copy "Project URL"
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ← Copy "anon (public)" key
   - `SUPABASE_SERVICE_ROLE_KEY` ← Copy "service_role" key

Your `.env.local` should look like:
```
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## 3. Enable Google OAuth

### Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project (or select existing)
3. Search for "OAuth consent screen"
4. Configure consent screen:
   - Click "Create" for External
   - Fill in App name, user support email, developer email
   - Click "Save and Continue"
   - Skip scopes, save again
   - Skip test users, save
5. Go to "Credentials"
6. Click "Create Credentials" → "OAuth client ID"
7. Application type: **Web application**
8. Authorized redirect URIs:
   ```
   http://localhost:3000
   http://localhost:3000/auth/v1/callback
   https://your-project.supabase.co/auth/v1/callback
   https://your-vercel-app-name.vercel.app/auth/v1/callback
   ```
9. Create → Copy **Client ID** and **Client Secret**

### Add to Supabase

1. Go to Supabase → **Authentication → Providers**
2. Search for "Google"
3. Enable "Google"
4. Paste **Client ID** and **Client Secret** from Google Console
5. Click "Save"

## 4. Create Storage Bucket

1. Go to **Storage** (in Supabase dashboard)
2. Click "Create a new bucket"
3. Name: `audio-attempts`
4. Make it **Private** (not public)
5. Click "Create bucket"
6. Go to bucket → **Policies** tab
7. Click "New policy"
8. For **SELECT** (read):
   ```sql
   authenticated and owner_id = auth.uid()
   ```
9. For **INSERT** (write):
   ```sql
   authenticated and owner_id = auth.uid()
   ```
10. For **UPDATE**:
    ```sql
    authenticated and owner_id = auth.uid()
    ```

## 5. Add CORS Policy

1. In Supabase Storage → **Bucket settings**
2. Find **CORS Configuration**
3. Add this JSON:
```json
[
  {
    "allowedHeaders": ["*"],
    "allowedMethods": ["GET", "POST", "PUT"],
    "allowedOrigins": [
      "http://localhost:3000",
      "https://your-project.vercel.app"
    ],
    "exposedHeaders": [],
    "maxAgeSeconds": 3600
  }
]
```

## 6. Create Database Tables

1. Go to Supabase → **SQL Editor**
2. Click "New Query"
3. Copy-paste the SQL below
4. Click "Run"

```sql
-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  total_attempts integer default 0,
  average_score numeric(5,2) default 0,
  best_score integer default 0,
  current_streak integer default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create index idx_profiles_email on public.profiles(email);

-- Problems (immutable, public)
create table public.problems (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  context text not null,
  difficulty text not null,
  category text not null,
  created_at timestamp default now(),
  archived boolean default false
);

alter table public.problems enable row level security;

create policy "Problems are public"
  on public.problems for select
  using (not archived);

create index idx_problems_category on public.problems(category);
create index idx_problems_difficulty on public.problems(difficulty);

-- Seed 5 sample problems
insert into public.problems (title, context, difficulty, category) values
  ('Gatekeeper Rejection', 
   'You call a Fortune 500 CFO at 9am. Their VA says "He does not take cold calls." What do you say?',
   'intermediate', 'objection_handling'),
   
  ('Budget Objection',
   'Prospect: "We are not budgeted for this year." You have 30 seconds. What do you say?',
   'beginner', 'objection_handling'),
   
  ('Qualify or Disqualify',
   'In 60 seconds, qualify a prospect: Is this a fit for our product? Ask 3 questions.',
   'beginner', 'discovery'),
   
  ('Handling "Send Me Info"',
   'Prospect: "Send me information and I will review it." How do you respond?',
   'intermediate', 'objection_handling'),
   
  ('Cold Call Intro',
   'You have 15 seconds to introduce yourself and get past the gatekeeper. Go.',
   'beginner', 'cold_call');
```

## 7. Set Up Profiles Trigger

This auto-creates a profile when users sign up with Google:

1. Go to **SQL Editor** → **New Query**
2. Paste:

```sql
-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 8. Test Connection

1. Save `.env.local` with your credentials
2. Run:
```bash
npm run dev
```

3. Visit `http://localhost:3000`
4. Click "Get Started"
5. Click "Sign in with Google"
6. You should see the Google login flow
7. After login, redirect to `/dashboard`

If you see errors:
- Check `.env.local` values are correct (copy-paste exactly)
- Check redirect URLs match in Google Console and Supabase
- Check that Google OAuth is enabled in Supabase

## ✅ You're Done with Supabase Setup!

You can now:
- ✅ Log in with Google
- ✅ See profiles table created
- ✅ See 5 sample problems seeded
- ✅ Proceed to Phase 1 Step 6 (Problem Browser)
