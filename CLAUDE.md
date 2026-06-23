@AGENTS.md

# Issue Tracker — Project Context

Internal web app for **TalkHealthAsia** to track **bugs and feature requests**.

## Stack
- **Next.js 16 (App Router) + TypeScript**, deployed on **Vercel**
- **Supabase** — Postgres, Auth (cookie sessions via `@supabase/ssr`), Storage (`issue-media` bucket)
- **Tailwind CSS v4 + shadcn/ui** (base-ui under the hood)

## Auth model (username-only, no email)
Each username maps to a synthetic internal email `<username>@<INTERNAL_EMAIL_DOMAIN>` so
Supabase Auth handles passwords/sessions without collecting real email.
- Admins generate one-time **invite links** (`/invite/[token]`); the user sets their own
  username + password.
- No self-service password reset — admins reset passwords on the Admin page.
- Seed the first admin: `npm run create-admin -- <username> <password>`.

## Permissions
- **admin**: full control (review features, assign, dates, complete, invites, password resets).
- **assignee**: may update / complete the issue assigned to them (but not reassign).
- everyone signed-in: raise issues, comment, view the shared dashboard.
Enforced both in server actions and Postgres RLS (`is_admin()` helper).

## Status flow
- Bug → `in_progress` → `completed`
- Feature → `pending_review` → (accept) `in_progress` → `completed`, or (reject) `rejected`
- Reject **requires** a comment; accept comment optional.
- Dates: `created_at` is stored UTC, displayed in **Asia/Kuala_Lumpur** (see `lib/time.ts`).

## Key paths
- `supabase/migrations/0001_init.sql` — schema, RLS, storage bucket
- `lib/supabase/{server,client,admin}.ts` — Supabase clients
- `lib/auth.ts` — `requireProfile` / `requireAdmin` / `canManageIssue`
- `proxy.ts` — session refresh + route protection (Next 16 proxy convention)
- `app/(auth)/*` — login + invite signup
- `app/(app)/*` — dashboard, issues/new, issues/[id], admin/invites
- `scripts/create-admin.ts` — seed an admin/user directly

## Environment variables
See `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` is server-only (never expose to the client).

## Change Log

### 2026-06-23
- Initial build: Next.js + Supabase issue tracker.
- Schema (profiles, invites, issues, attachments, comments) with RLS + private storage bucket.
- Username-only auth via invite links; create-admin seed script.
- Dashboard with status tabs, raise-issue page with media uploads, issue detail with
  feature accept/reject, assignment, tentative dates, completion, and comment thread.
- Admin page for generating invites and resetting passwords.
