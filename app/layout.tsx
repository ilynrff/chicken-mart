import type { Metadata } from "next";
import "@/app/globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Chicken Mart",
  description: "Frontend operasional toko retail untuk POS, stok, hutang, dan laporan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <AppProviders>{children}</AppProviders>
        <Toaster closeButton position="top-right" richColors expand={false} />
      </body>
    </html>
  );
}
