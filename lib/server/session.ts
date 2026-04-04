import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { HttpError } from "@/lib/server/errors";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null | undefined;
};

export async function requireSessionUser(request: NextRequest): Promise<SessionUser> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    throw new HttpError(401, "Sesi login tidak ditemukan.");
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}
