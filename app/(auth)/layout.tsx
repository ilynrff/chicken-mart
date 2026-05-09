import { GuestOnly } from "@/components/layout/route-guards";
import { PageTransition } from "@/components/layout/page-transition";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestOnly>
      <PageTransition>{children}</PageTransition>
    </GuestOnly>
  );
}
