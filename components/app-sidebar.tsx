"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Shield, LogOut, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(app)/actions";

type NavItem = { href: string; label: string; icon: React.ElementType };

const baseNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/issues/new", label: "Raise Issue", icon: PlusCircle },
];

const adminNav: NavItem[] = [
  { href: "/admin/invites", label: "Admin", icon: Shield },
];

export function AppSidebar({
  username,
  role,
}: {
  username: string;
  role: "admin" | "user";
}) {
  const pathname = usePathname();
  const nav = role === "admin" ? [...baseNav, ...adminNav] : baseNav;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const links = nav.map(({ href, label, icon: Icon }) => (
    <Link
      key={href}
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive(href)
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  ));

  return (
    <aside className="flex w-full shrink-0 flex-col border-b bg-sidebar md:h-svh md:w-60 md:border-r md:border-b-0">
      <div className="flex items-center gap-2 px-4 py-4 text-sidebar-foreground">
        <Bug className="size-5" />
        <span className="font-semibold">Issue Tracker</span>
      </div>

      <nav className="flex flex-row gap-1 overflow-x-auto px-2 pb-2 md:flex-1 md:flex-col md:overflow-visible md:pb-0">
        {links}
      </nav>

      <div className="mt-auto flex items-center justify-between gap-2 border-t px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {username}
          </p>
          <p className="text-xs capitalize text-sidebar-foreground/60">{role}</p>
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </aside>
  );
}
