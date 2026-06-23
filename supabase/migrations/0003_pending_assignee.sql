-- =====================================================================
-- Allow assigning an issue to a pending invite (an invited user who has
-- not activated their account yet). The assignment transfers to the real
-- profile when the invite is consumed.
-- =====================================================================

-- A human-friendly name for the invitee, shown as the pending assignee label.
alter table public.invites
  add column if not exists invitee_name text;

-- An issue may be assigned to a profile (assigned_to) OR, before activation,
-- to a pending invite. assigned_invite_name is denormalized so the label can
-- be shown without reading the (admin-only) invites table.
alter table public.issues
  add column if not exists assigned_invite_id uuid
    references public.invites(id) on delete set null,
  add column if not exists assigned_invite_name text;

create index if not exists issues_assigned_invite_idx
  on public.issues(assigned_invite_id);

grant all privileges on all tables in schema public
  to anon, authenticated, service_role;
