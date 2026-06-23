# Issue Tracker

Internal web app to track **bugs and feature requests** — raise issues with a required comment
and optional image/video attachments, assign owners, set tentative completion dates, review
feature requests (accept/reject), and follow items to completion on a shared dashboard.

Built with **Next.js 16 (App Router)** + **Supabase** (Postgres, Auth, Storage), deployed on
**Vercel**.

## Features
- Username + password accounts via **admin-generated invite links** (no email collected)
- Shared dashboard with status tabs: In Progress, Pending Review, Completed, Rejected, All
- Raise **Bug** or **Feature Request**; required comment, optional title/assignee/target date
- Upload images and videos (private Supabase Storage, served via signed URLs)
- Feature requests can be **accepted/rejected** (reject requires a reason)
- Permissions: **admins** manage everything; an issue's **assignee** can update/complete it
- "Date raised" is system-generated and shown in **Kuala Lumpur time** (UTC+8)

## Setup

### 1. Install
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env.local` and fill in your Supabase project values
(Dashboard → Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # secret, server only
INTERNAL_EMAIL_DOMAIN=users.tracker.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Create the database schema
In the Supabase dashboard → **SQL Editor**, run the contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
This creates all tables, RLS policies, and the private `issue-media` storage bucket.

### 4. Seed the first admin
```bash
npm run create-admin -- <username> <password>
```

### 5. Run
```bash
npm run dev
```
Open http://localhost:3000, sign in as the admin, then go to **Admin → Generate invite link**
to onboard other users.

## Deploy to Vercel
1. Push to a Git repo and import it in Vercel (framework auto-detected as Next.js).
2. Add the 5 environment variables above in **Project Settings → Environment Variables**.
   Set `NEXT_PUBLIC_APP_URL` to your production URL.
3. Deploy. Run the migration (step 3) against the same Supabase project if you haven't already.

## Scripts
- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run create-admin -- <username> <password> [admin|user]` — seed an account
