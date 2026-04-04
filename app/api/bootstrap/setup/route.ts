import type { NextRequest } from "next/server";
import { requireSessionUser } from "@/lib/server/session";
import { setupWorkspace } from "@/lib/server/workspace-service";
import { fail, ok } from "@/lib/server/route";

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const body = (await request.json()) as {
      storeName?: string;
      ownerName?: string;
      phone?: string;
      address?: string;
    };

    const data = await setupWorkspace(user, body);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
