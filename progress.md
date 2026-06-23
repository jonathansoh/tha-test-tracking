# Project Progress

## Overview
Internal Issue Tracker (bugs + feature requests) for TalkHealthAsia. Next.js on Vercel,
Supabase backend (Postgres + Auth + Storage). Username-only auth via admin invite links.

## Completed Tasks
- [x] Scaffold Next.js (App Router, TS, Tailwind) + shadcn/ui + Supabase deps
- [x] Schema migration: profiles, invites, issues, attachments, comments + RLS + storage bucket
- [x] Supabase clients, proxy (session/route protection), auth + time helpers
- [x] Auth: login (username→synthetic email), invite signup, create-admin seed script
- [x] App shell: sidebar layout + auth guard
- [x] Raise-issue page: bug/feature, required comment, optional title/assignee/date, media uploads
- [x] Dashboard: status tabs/filters (In Progress default), KUL dates
- [x] Issue detail: attachments, comment thread, feature accept/reject, assign, dates, complete/reopen
- [x] Admin page: generate invite links, list users, reset passwords
- [x] Project docs + production build passing

## Current Work
Waiting on Supabase credentials from the user (different account) to:
1. Fill real values in `.env.local`
2. Run `supabase/migrations/0001_init.sql` in the SQL Editor
3. Seed the first admin and smoke-test the flow end-to-end

## Blocked/Issues
- Needs the new Supabase project's URL, anon/publishable key, and service_role key.

## Next Steps
1. Add real env vars → run migration → `npm run create-admin -- <user> <pass>`.
2. `npm run dev`, log in, generate an invite, raise a bug + a feature, test accept/reject.
3. Deploy to Vercel; set the 5 env vars; set `NEXT_PUBLIC_APP_URL` to the prod URL.

## Updates Log
### 2026-06-23
- Built the full application end-to-end; `npm run build` passes.
- Pending: live Supabase wiring + manual verification.
