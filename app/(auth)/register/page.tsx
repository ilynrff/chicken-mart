"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, LockKeyhole, Mail, Phone, Store } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [ownerName, setOwnerName] = useState("Ibu Siti Larasati");
  const [storeName, setStoreName] = useState("Chicken Mart");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <main className="auth-stage relative flex min-h-screen items-center overflow-hidden px-4 py-4 sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-4 lg:grid-cols-[0.92fr_1.08fr] lg:gap-5">
        <Card className="self-center">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">Daftar</p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Buat akun toko retail</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Pendaftaran sekarang langsung membuat akun auth dan workspace database untuk Chicken Mart.
              </p>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setError(null);
                setIsSubmitting(true);
                try {
                  await register({ email, fullName: ownerName, password });
                  await api.setupWorkspace({ storeName, ownerName, phone });
                  router.replace("/dashboard");
                } catch (caughtError) {
                  setError(caughtError instanceof Error ? caughtError.message : "Pendaftaran gagal.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="ownerName">Nama pemilik</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="ownerName"
                    value={ownerName}
                    onChange={(event) => setOwnerName(event.target.value)}
                    className="pl-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeName">Nama warung</Label>
                <div className="relative">
                  <Store className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="storeName"
                    value={storeName}
                    onChange={(event) => setStoreName(event.target.value)}
                    className="pl-11"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">No. WhatsApp</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="pl-11"
                    />
                  </div>
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
                {isSubmitting ? "Membuat akun..." : "Buat Akun"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Sudah pernah masuk? {" "}
              <Link href="/login" className="font-semibold text-primary">
                Kembali ke login
              </Link>
            </p>
          </CardContent>
        </Card>

        <section className="panel-surface auth-brand-panel hero-pattern bg-hero-grid relative overflow-hidden border-white/80 px-5 py-5 sm:px-7 sm:py-6">
          <div className="max-w-xl">
            <div className="auth-badge inline-flex items-center gap-2 rounded-full border border-red-200/70 px-4 py-2 text-sm font-semibold text-primary">
              <Store className="size-4" />
              PostgreSQL + Better Auth
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl xl:text-[3rem] xl:leading-[1.04]">
              Chicken Mart sekarang siap tumbuh di atas backend yang lebih nyata.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-[15px]">
              Akun pengguna tersimpan di auth server, sedangkan data produk, transaksi, hutang, dan pengaturan masuk ke
              database Postgres melalui route handler Next.js.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              ["Login server-side", "Sesi tidak lagi menempel di localStorage."],
              ["Data konsisten", "Semua halaman membaca sumber data yang sama."],
              ["Siap migrasi", "Schema Drizzle memudahkan evolusi tabel."],
              ["Route handler", "Frontend dan backend tetap satu codebase."],
            ].map(([title, description]) => (
              <div key={title} className="auth-stat rounded-[22px] border border-red-100/80 p-4 shadow-sm">
                <p className="font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
