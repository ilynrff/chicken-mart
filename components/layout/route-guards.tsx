"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

function Splash({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="panel-surface flex w-full max-w-md flex-col items-center gap-4 px-6 py-10 text-center">
        <div className="rounded-full bg-secondary p-4 text-primary">
          <LoaderCircle className="size-8 animate-spin" />
        </div>
        <div>
          <p className="text-lg font-semibold">{message}</p>
          <p className="text-sm text-muted-foreground">Tunggu sebentar, kami sedang menyiapkan halaman.</p>
        </div>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === "guest") {
      router.replace("/login");
    }
  }, [router, status, mounted]);

  if (!mounted || status !== "authenticated") {
    return <Splash message="Memeriksa sesi login" />;
  }

  return <>{children}</>;
}

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status, mounted]);

  if (!mounted || status === "loading") {
    return <Splash message="Mengecek akses halaman" />;
  }

  if (status === "authenticated") {
    return <Splash message="Mengalihkan ke dashboard" />;
  }

  return <>{children}</>;
}
