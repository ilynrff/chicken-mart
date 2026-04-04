"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, Store } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <main className="auth-stage relative flex h-screen items-center overflow-hidden px-4 py-4 sm:px-6">
      <div className="mx-auto grid h-full w-full max-w-6xl items-center gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:gap-5">
        <section className="panel-surface auth-brand-panel hero-pattern bg-hero-grid relative flex h-full min-h-0 overflow-hidden border-white/80 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="auth-badge inline-flex items-center gap-3 rounded-full border border-red-200/70 px-4 py-2 text-sm font-semibold text-primary shadow-sm">
                <Store className="size-4" />
                Chicken Mart
              </div>
              <div className="mt-6 max-w-xl">
                <h1 className="text-3xl font-black leading-tight text-foreground sm:text-4xl xl:text-[3.2rem] xl:leading-[1.02]">
                  Backend retail siap dipakai dengan auth, database, dan operasional yang lebih rapi.
                </h1>
                <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground sm:text-[15px]">
                  Login sekarang memakai session server Better Auth, jadi data toko, kasir, stok, dan laporan tidak lagi
                  bergantung ke localStorage browser.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Session aman", "Login tersimpan di cookie server."],
                ["Data konsisten", "Produk dan transaksi ada di database."],
                ["Siap berkembang", "API route siap dipakai frontend sekarang."],
              ].map(([title, description]) => (
                <div key={title} className="auth-stat rounded-[22px] border border-red-100/80 p-4 shadow-sm">
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="self-center">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">Masuk</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Selamat datang kembali</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Gunakan email dan password akun retail Chicken Mart yang sudah dibuat.
              </p>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setError(null);
                setIsSubmitting(true);
                try {
                  await login({ email, password });
                  router.replace("/dashboard");
                } catch (caughtError) {
                  setError(caughtError instanceof Error ? caughtError.message : "Login gagal.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-11"
                    placeholder="owner@warung.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-11 pr-12"
                    placeholder="Minimal 8 karakter"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                    aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Password minimal 8 karakter.</p>
              </div>

              {error ? <div className="rounded-[20px] bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

              <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/95" disabled={isSubmitting}>
                {isSubmitting ? "Memproses login..." : "Masuk ke Dashboard"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Belum punya akun? {" "}
              <Link href="/register" className="font-semibold text-primary">
                Daftar sekarang
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
