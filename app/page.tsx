"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export default function HomePage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }

    if (status === "guest") {
      router.replace("/login");
    }
  }, [router, status]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="panel-surface flex min-h-[220px] w-full max-w-md flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div className="rounded-full bg-secondary p-4 text-primary">
          <LoaderCircle className="size-8 animate-spin" />
        </div>
        <div>
          <p className="text-lg font-semibold">Menyiapkan Chicken Mart</p>
          <p className="text-sm text-muted-foreground">Memuat workspace warung Anda...</p>
        </div>
      </div>
    </main>
  );
}
