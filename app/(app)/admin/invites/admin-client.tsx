"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Trash2, KeyRound } from "lucide-react";
import { createInvite, resetPassword, revokeInvite } from "./actions";
import { formatKulDateTime } from "@/lib/time";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Invite = {
  id: string;
  token: string;
  role: Role;
  invitee_name: string | null;
  note: string | null;
  used_at: string | null;
  created_at: string;
};
type User = {
  id: string;
  username: string;
  role: Role;
  created_at: string;
};

function inviteUrl(token: string) {
  if (typeof window === "undefined") return `/invite/${token}`;
  return `${window.location.origin}/invite/${token}`;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard.");
  } catch {
    toast.error("Couldn't copy. Link: " + text);
  }
}

export function AdminClient({
  invites,
  users,
}: {
  invites: Invite[];
  users: User[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<Role>("user");
  const [inviteeName, setInviteeName] = useState("");
  const [note, setNote] = useState("");

  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  function generate() {
    startTransition(async () => {
      const res = await createInvite(role, inviteeName, note);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setInviteeName("");
      setNote("");
      if (res.token) await copy(inviteUrl(res.token));
      router.refresh();
    });
  }

  function revoke(id: string) {
    startTransition(async () => {
      const res = await revokeInvite(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Invite revoked.");
      router.refresh();
    });
  }

  function submitReset() {
    if (!resetUser) return;
    startTransition(async () => {
      const res = await resetPassword(resetUser.id, newPassword);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Password reset for ${resetUser.username}.`);
      setResetUser(null);
      setNewPassword("");
    });
  }

  const pendingInvites = invites.filter((i) => !i.used_at);

  return (
    <div className="space-y-8">
      {/* Generate invite */}
      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Generate invite link</h2>
        <div className="grid gap-3 sm:grid-cols-[110px_1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v) => v && setRole(v as Role)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inviteeName">Name</Label>
            <Input
              id="inviteeName"
              value={inviteeName}
              onChange={(e) => setInviteeName(e.target.value)}
              placeholder="e.g. Sarah"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. QA team"
            />
          </div>
          <Button onClick={generate} disabled={pending}>
            Generate
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The name lets you assign issues to this person before they activate
          their account. The link is copied to your clipboard — share it; they
          set their own username and password.
        </p>
      </section>

      {/* Pending invites */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          Pending invites ({pendingInvites.length})
        </h2>
        {pendingInvites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending invites.</p>
        ) : (
          <div className="divide-y rounded-md border">
            {pendingInvites.map((i) => (
              <div
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-medium">
                    {i.invitee_name || "Unnamed"}
                  </span>
                  <span className="ml-2 text-xs capitalize text-muted-foreground">
                    {i.role}
                  </span>
                  {i.note && (
                    <span className="text-muted-foreground"> · {i.note}</span>
                  )}
                  <span className="block text-xs text-muted-foreground">
                    Created {formatKulDateTime(i.created_at)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copy(inviteUrl(i.token))}
                  >
                    <Copy className="size-3.5" /> Copy link
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => revoke(i.id)}
                    disabled={pending}
                    aria-label="Revoke invite"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Users */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Users ({users.length})</h2>
        <div className="divide-y rounded-md border">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">{u.username}</span>
                <span className="ml-2 text-xs capitalize text-muted-foreground">
                  {u.role}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setResetUser(u);
                  setNewPassword("");
                }}
              >
                <KeyRound className="size-3.5" /> Reset password
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Reset password dialog */}
      <Dialog
        open={resetUser !== null}
        onOpenChange={(open) => !open && setResetUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a new password for{" "}
              <span className="font-medium">{resetUser?.username}</span>. Share
              it with them securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>
              Cancel
            </Button>
            <Button onClick={submitReset} disabled={pending}>
              Reset password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
