import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getBootstrapData } from "@/lib/server/workspace-service";
import { KasirClient } from "./kasir-client";
import { Suspense } from "react";
import { Package } from "lucide-react";

export default async function KasirPage() {
  const head = await headers();
  const session = await auth.api.getSession({ headers: head });
  
  if (!session?.user) {
    return null;
  }

  // Fetch data on the server
  const initialData = await getBootstrapData({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name
  });

  return (
    <Suspense fallback={<KasirSkeleton />}>
      <KasirClient initialData={initialData} />
    </Suspense>
  );
}

function KasirSkeleton() {
  return (
    <div className="flex-1 flex flex-col space-y-6 animate-pulse p-8">
      <div className="flex justify-between items-center">
        <div className="h-10 bg-white/5 rounded-2xl w-48" />
        <div className="h-10 bg-white/5 rounded-2xl w-64" />
      </div>
      <div className="h-12 bg-white/5 rounded-2xl w-full" />
      <div className="flex gap-8 flex-1">
        <div className="flex-1 grid grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white/5 rounded-2xl h-64" />)}
        </div>
        <div className="w-[400px] bg-white/5 rounded-2xl h-full" />
      </div>
    </div>
  );
}
