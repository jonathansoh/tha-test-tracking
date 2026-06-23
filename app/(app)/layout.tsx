import { requireProfile } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <AppSidebar username={profile.username} role={profile.role} />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
