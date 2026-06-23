import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { InviteForm } from "./invite-form";

export const metadata = { title: "Create your account — Issue Tracker" };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invites")
    .select("id, used_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  const expired =
    invite?.expires_at && new Date(invite.expires_at) < new Date();
  const invalid = !invite || Boolean(invite.used_at) || Boolean(expired);

  if (invalid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Invite unavailable</CardTitle>
          <CardDescription>
            {invite?.used_at
              ? "This invite link has already been used."
              : expired
                ? "This invite link has expired."
                : "This invite link is not valid."}{" "}
            Please ask an admin for a new link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="text-sm underline underline-offset-4">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Set a username and password to access the Issue Tracker.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InviteForm token={token} />
      </CardContent>
    </Card>
  );
}
