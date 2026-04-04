import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/components/layout/route-guards";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
