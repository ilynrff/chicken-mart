import type { NextRequest } from "next/server";
import { requireSessionUser } from "@/lib/server/session";
import { getBootstrapData } from "@/lib/server/workspace-service";
import { fail, ok } from "@/lib/server/route";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const data = await getBootstrapData(user);
    return ok(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}
