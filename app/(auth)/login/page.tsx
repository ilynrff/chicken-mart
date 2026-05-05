"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, Store, ShieldCheck, Database, Zap } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 z-10">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        
        {/* LEFT SIDE: BRANDING */}
        <section className="relative flex flex-col justify-center max-w-xl mx-auto lg:mx-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 mb-6 glow-red">
              <Store className="size-4" />
              Chicken Mart POS
            </div>
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-[3.5rem] mb-6">
              Kelola warung <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">lebih rapi</span> dan cepat.
            </h1>
            <p className="text-base leading-relaxed text-slate-400 mb-12 max-w-lg">
              Sistem kasir modern dengan keamanan data tingkat tinggi. Kelola stok, transaksi, dan hutang dari mana saja dengan tampilan premium.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: ShieldCheck, title: "Aman", desc: "Sistem otentikasi mutakhir." },
                { icon: Database, title: "Tersimpan", desc: "Data cloud yang andal." },
                { icon: Zap, title: "Cepat", desc: "Transaksi tanpa lemot." },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-2 text-red-400">
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT SIDE: LOGIN FORM */}
        <div className="relative w-full max-w-md mx-auto lg:ml-auto">
          <Card className="glass-card border-white/10 overflow-hidden relative w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <CardContent className="p-8 relative z-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Masuk ke akun Anda</h2>
                <p className="text-sm text-slate-400">
                  Masukkan email dan password untuk melanjutkan.
                </p>
              </div>

              <form
                className="space-y-5"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setError(null);
                  setIsSubmitting(true);
                  try {
                    await login({ email, password });
                    router.replace("/dashboard");
                  } catch (caughtError) {
                    setError(caughtError instanceof Error ? caughtError.message : "Login gagal. Periksa kembali kredensial Anda.");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="pl-11 h-12 bg-black/20 border-white/10 text-white focus-visible:border-red-500 focus-visible:ring-1 focus-visible:ring-red-500/50 transition-all rounded-xl"
                      placeholder="owner@warung.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Password</Label>
                    <Link href="#" className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium">Lupa password?</Link>
                  </div>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-11 pr-12 h-12 bg-black/20 border-white/10 text-white focus-visible:border-red-500 focus-visible:ring-1 focus-visible:ring-red-500/50 transition-all rounded-xl"
                      placeholder="••••••••"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-medium text-red-400 text-center">
                    {error}
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full h-12 text-base mt-2" disabled={isSubmitting}>
                  {isSubmitting ? "Memproses..." : "Masuk"}
                </Button>
              </form>

              <div className="mt-8 text-center border-t border-white/5 pt-6">
                <p className="text-sm text-slate-400">
                  Belum punya akun? {" "}
                  <Link href="/register" className="font-bold text-white hover:text-red-400 transition-colors">
                    Daftar di sini
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
