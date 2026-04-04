import { GuestOnly } from "@/components/layout/route-guards";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <GuestOnly>{children}</GuestOnly>;
}
