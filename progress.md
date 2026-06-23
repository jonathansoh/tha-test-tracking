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
Shipped. App is live in production at https://tha-test-tracking.vercel.app.

## Blocked/Issues
- None. (Preview-env vars not set in Vercel — only needed if Git preview deploys are wired up.)

## Next Steps
- Optional: connect the GitHub repo to Vercel for auto-deploys (then add Preview env vars).
- Optional: make the GitHub repo private; rotate the DB password shared during setup.

## Updates Log
### 2026-06-23
- Built the full application end-to-end; `npm run build` passes.
- Wired live Supabase (project ztjoxdzrtiysinltkcvg): applied schema + grants, created bucket.
- Seeded admin `jonathansoh`; ran auth + RLS smoke test (login → insert → select → cleanup).
- Deployed to Vercel production (vilor-marketing/tha-test-tracking); verified /login + redirects.
