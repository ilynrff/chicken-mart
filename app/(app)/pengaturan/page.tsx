"use client";

import { useState } from "react";
import { RotateCcw, Save, Store, Settings, UserCircle, Smartphone, MapPin } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentMethod, StoreProfile, StoreSettings } from "@/lib/types";

const allMethods: PaymentMethod[] = ["Tunai", "QRIS", "Transfer"];

function SettingsEditor({ initialProfile, initialSettings }: { initialProfile: StoreProfile; initialSettings: StoreSettings }) {
  const { updateSettings, resetWorkspace, isMutating } = useData();
  const [profile, setProfile] = useState<StoreProfile>(initialProfile);
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [message, setMessage] = useState<string | null>(null);

  const toggleMethod = (method: PaymentMethod) => {
    setSettings((current) => {
      const exists = current.enabledPaymentMethods.includes(method);
      const nextMethods = exists ? current.enabledPaymentMethods.filter((item) => item !== method) : [...current.enabledPaymentMethods, method];
      return { ...current, enabledPaymentMethods: nextMethods.length ? nextMethods : current.enabledPaymentMethods };
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card className="glass-card flex flex-col border-white/5">
        <CardHeader className="border-b border-white/5 pb-5">
          <CardTitle className="flex items-center gap-2 text-white">
            <Store className="size-5 text-red-400" /> Profil Warung
          </CardTitle>
          <CardDescription className="text-slate-400 mt-1.5">Atur informasi toko dan detail operasional dasar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <Label htmlFor="store-name" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Nama warung</Label>
            <div className="relative">
              <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <Input id="store-name" value={profile.name} onChange={(e) => setProfile(c => ({ ...c, name: e.target.value }))} className="pl-10 bg-black/20 border-white/10 text-white h-12 rounded-xl" />
            </div>
          </div>
          <div className="space-y-3">
            <Label htmlFor="owner-name" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Nama pemilik</Label>
            <div className="relative">
              <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <Input id="owner-name" value={profile.ownerName} onChange={(e) => setProfile(c => ({ ...c, ownerName: e.target.value }))} className="pl-10 bg-black/20 border-white/10 text-white h-12 rounded-xl" />
            </div>
          </div>
          <div className="space-y-3">
            <Label htmlFor="address" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Alamat</Label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <Input id="address" value={profile.address} onChange={(e) => setProfile(c => ({ ...c, address: e.target.value }))} className="pl-10 bg-black/20 border-white/10 text-white h-12 rounded-xl" />
            </div>
          </div>
          <div className="space-y-3">
            <Label htmlFor="phone" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">No. telepon</Label>
            <div className="relative">
              <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <Input id="phone" value={profile.phone} onChange={(e) => setProfile(c => ({ ...c, phone: e.target.value }))} className="pl-10 bg-black/20 border-white/10 text-white h-12 rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 flex flex-col">
        <Card className="glass-card flex-1 border-white/5">
          <CardHeader className="border-b border-white/5 pb-5">
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="size-5 text-red-400" /> Pengaturan Sistem
            </CardTitle>
            <CardDescription className="text-slate-400 mt-1.5">Metode pembayaran dan preferensi aplikasi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Metode pembayaran aktif</Label>
              <div className="flex flex-wrap gap-2">
                {allMethods.map((method) => {
                  const active = settings.enabledPaymentMethods.includes(method);
                  return (
                    <Button key={method} variant={active ? "default" : "outline"} onClick={() => toggleMethod(method)} className="h-10 rounded-xl">
                      {method}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="minimum-stock" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Minimum stok default (Alert limit)</Label>
              <Input
                id="minimum-stock"
                type="number"
                min={0}
                value={settings.defaultMinimumStock}
                onChange={(e) => setSettings(c => ({ ...c, defaultMinimumStock: Number(e.target.value) }))}
                className="bg-black/20 border-white/10 text-white h-12 rounded-xl w-full"
              />
            </div>
            
            <div className="pt-4 border-t border-white/5">
              <Button size="lg" onClick={async () => { await updateSettings({ profile, settings }); setMessage("Pengaturan berhasil disimpan."); }} disabled={isMutating} className="w-full h-12">
                <Save className="size-4 mr-2" /> Simpan Pengaturan
              </Button>
            </div>
            {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400 text-center">{message}</div>}
          </CardContent>
        </Card>

        <Card className="border border-red-500/30 bg-red-500/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-red-400">Reset Workspace</CardTitle>
            <CardDescription className="text-slate-400 mt-1">Mengembalikan semua data produk, transaksi, dan hutang ke data seed demo awal.</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            <Button
              variant="destructive"
              className="w-full h-12 bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/50"
              onClick={async () => {
                const confirmed = window.confirm("Reset semua data demo di workspace ini? Tindakan ini tidak bisa dibatalkan.");
                if (!confirmed) return;
                await resetWorkspace();
                setMessage("Workspace berhasil direset ke data awal.");
              }}
              disabled={isMutating}
            >
              <RotateCcw className="size-4 mr-2" /> Reset Semua Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PengaturanPage() {
  const { data } = useData();
  if (!data) return null;
  return <SettingsEditor key={JSON.stringify([data.profile, data.settings])} initialProfile={data.profile} initialSettings={data.settings} />;
}
