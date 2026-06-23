/**
 * Seed the first admin (or any user) directly, bypassing the invite flow.
 *
 *   npm run create-admin -- <username> <password> [role]
 *
 * role defaults to "admin". Requires NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { isValidUsername, normalizeUsername, synthEmail } from "../lib/username";

config({ path: ".env.local" });

async function main() {
  const [username, password, roleArg] = process.argv.slice(2);
  const role = roleArg ?? "admin";

  if (!username || !password) {
    console.error("Usage: npm run create-admin -- <username> <password> [role]");
    process.exit(1);
  }
  if (!isValidUsername(username)) {
    console.error("Invalid username. Use 3–30 chars: letters, numbers, . _ -");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  if (role !== "admin" && role !== "user") {
    console.error('Role must be "admin" or "user".');
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const uname = normalizeUsername(username);

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: synthEmail(uname),
    password,
    email_confirm: true,
    user_metadata: { username: uname },
  });
  if (createErr || !created.user) {
    console.error("Failed to create auth user:", createErr?.message);
    process.exit(1);
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    username: uname,
    role,
  });
  if (profileErr) {
    // Roll back the auth user so the username can be retried cleanly.
    await admin.auth.admin.deleteUser(created.user.id);
    console.error("Failed to create profile:", profileErr.message);
    process.exit(1);
  }

  console.log(`✓ Created ${role} "${uname}". You can now log in.`);
}

main();
