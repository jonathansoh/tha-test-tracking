-- =====================================================================
-- Grant the Supabase API roles access to the public schema.
-- Needed when tables are created over a direct Postgres connection
-- (the SQL Editor applies these automatically). RLS still governs which
-- rows each role can see; service_role bypasses RLS.
-- =====================================================================
grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables in schema public
  to anon, authenticated, service_role;
grant all privileges on all sequences in schema public
  to anon, authenticated, service_role;
grant all privileges on all functions in schema public
  to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;

notify pgrst, 'reload schema';
