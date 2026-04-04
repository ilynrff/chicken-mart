import type { NextRequest } from "next/server";
import { requireSessionUser } from "@/lib/server/session";
import { resetWorkspaceForUser } from "@/lib/server/workspace-service";
import { fail, ok } from "@/lib/server/route";

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const data = await resetWorkspaceForUser(user);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
