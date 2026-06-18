import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/data/user";
import { getNotifications } from "@/lib/data/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, notifications] = await Promise.all([getCurrentUser(), getNotifications()]);
  return (
    <AppShell user={user} notifications={notifications}>
      {children}
    </AppShell>
  );
}
