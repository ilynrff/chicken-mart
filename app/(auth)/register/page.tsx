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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 z-10">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 flex-col-reverse lg:flex-row">
        
        {/* LEFT SIDE: REGISTER FORM */}
        <div className="relative w-full max-w-lg mx-auto lg:mr-auto lg:order-1 order-2">
          <Card className="glass-card border-white/10 overflow-hidden relative w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <CardContent className="p-8 relative z-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Buat Akun Baru</h2>
                <p className="text-sm text-slate-400">
                  Daftarkan toko Anda untuk mulai mengelola bisnis.
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
                    setError(caughtError instanceof Error ? caughtError.message : "Pendaftaran gagal. Silakan coba lagi.");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Nama Lengkap</Label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="ownerName"
                      value={ownerName}
                      onChange={(event) => setOwnerName(event.target.value)}
                      className="pl-11 h-12 bg-black/20 border-white/10 text-white focus-visible:border-red-500 focus-visible:ring-1 focus-visible:ring-red-500/50 transition-all rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeName" className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Nama Warung/Toko</Label>
                  <div className="relative">
                    <Store className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="storeName"
                      value={storeName}
                      onChange={(event) => setStoreName(event.target.value)}
                      className="pl-11 h-12 bg-black/20 border-white/10 text-white focus-visible:border-red-500 focus-visible:ring-1 focus-visible:ring-red-500/50 transition-all rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300 font-semibold text-xs uppercase tracking-wider">No. WhatsApp</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="pl-11 h-12 bg-black/20 border-white/10 text-white focus-visible:border-red-500 focus-visible:ring-1 focus-visible:ring-red-500/50 transition-all rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-11 pr-12 h-12 bg-black/20 border-white/10 text-white focus-visible:border-red-500 focus-visible:ring-1 focus-visible:ring-red-500/50 transition-all rounded-xl"
                      placeholder="Minimal 8 karakter"
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

                <Button type="submit" size="lg" className="w-full h-12 text-base mt-4" disabled={isSubmitting}>
                  {isSubmitting ? "Membuat akun..." : "Daftar"}
                </Button>
              </form>

              <div className="mt-6 text-center border-t border-white/5 pt-5">
                <p className="text-sm text-slate-400">
                  Sudah pernah mendaftar? {" "}
                  <Link href="/login" className="font-bold text-white hover:text-red-400 transition-colors">
                    Masuk ke akun Anda
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE: BRANDING */}
        <section className="relative flex flex-col justify-center max-w-xl mx-auto lg:mx-0 lg:order-2 order-1 lg:pl-8">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 mb-6 glow-red">
              <Store className="size-4" />
              Chicken Mart POS
            </div>
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-[3.5rem] mb-6">
              Mulai langkah baru untuk bisnis Anda.
            </h1>
            <p className="text-base leading-relaxed text-slate-400 mb-10 max-w-lg">
              Satu akun untuk mengelola transaksi kasir, mengecek inventaris, dan melihat laporan penjualan secara real-time.
            </p>

            <div className="space-y-4">
              {[
                { title: "Manajemen Pintar", desc: "Kontrol stok dan pantau laporan harian otomatis." },
                { title: "Transaksi Cepat", desc: "Tingkatkan pengalaman belanja pelanggan." },
              ].map((item, idx) => (
                <div key={idx} className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="font-bold text-white text-sm">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
