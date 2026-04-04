"use client";

import { useState } from "react";
import { RotateCcw, Save, Store } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentMethod, StoreProfile, StoreSettings } from "@/lib/types";

const allMethods: PaymentMethod[] = ["Tunai", "QRIS", "Transfer"];

function SettingsEditor({
  initialProfile,
  initialSettings,
}: {
  initialProfile: StoreProfile;
  initialSettings: StoreSettings;
}) {
  const { updateSettings, resetWorkspace, isMutating } = useData();
  const [profile, setProfile] = useState<StoreProfile>(initialProfile);
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [message, setMessage] = useState<string | null>(null);

  const toggleMethod = (method: PaymentMethod) => {
    setSettings((current) => {
      const exists = current.enabledPaymentMethods.includes(method);
      const nextMethods = exists
        ? current.enabledPaymentMethods.filter((item) => item !== method)
        : [...current.enabledPaymentMethods, method];

      return {
        ...current,
        enabledPaymentMethods: nextMethods.length ? nextMethods : current.enabledPaymentMethods,
      };
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="size-5 text-primary" />
            Profil warung
          </CardTitle>
          <CardDescription>Atur informasi toko dan preferensi operasional dasar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">Nama warung</Label>
            <Input id="store-name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-name">Nama pemilik</Label>
            <Input id="owner-name" value={profile.ownerName} onChange={(event) => setProfile((current) => ({ ...current, ownerName: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Input id="address" value={profile.address} onChange={(event) => setProfile((current) => ({ ...current, address: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">No. telepon</Label>
            <Input id="phone" value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Metode pembayaran</CardTitle>
            <CardDescription>Metode yang muncul di halaman kasir.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {allMethods.map((method) => {
                const active = settings.enabledPaymentMethods.includes(method);
                return (
                  <Button key={method} variant={active ? "default" : "outline"} onClick={() => toggleMethod(method)}>
                    {method}
                  </Button>
                );
              })}
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimum-stock">Minimum stok default</Label>
              <Input
                id="minimum-stock"
                type="number"
                min={0}
                value={settings.defaultMinimumStock}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    defaultMinimumStock: Number(event.target.value),
                  }))
                }
              />
            </div>
            <Button
              size="lg"
              onClick={async () => {
                await updateSettings({ profile, settings });
                setMessage("Pengaturan berhasil disimpan.");
              }}
              disabled={isMutating}
            >
              <Save className="size-4" />
              Simpan pengaturan
            </Button>
            {message ? <div className="rounded-[20px] bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle>Reset workspace</CardTitle>
            <CardDescription>
              Mengembalikan produk, transaksi, hutang, dan pengaturan ke data seed demo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={async () => {
                const confirmed = window.confirm("Reset semua data demo di workspace ini?");
                if (!confirmed) {
                  return;
                }

                await resetWorkspace();
                setMessage("Workspace berhasil direset ke data awal.");
              }}
              disabled={isMutating}
            >
              <RotateCcw className="size-4" />
              Reset workspace demo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PengaturanPage() {
  const { data } = useData();

  if (!data) {
    return null;
  }

  return (
    <SettingsEditor
      key={JSON.stringify([data.profile, data.settings])}
      initialProfile={data.profile}
      initialSettings={data.settings}
    />
  );
}
