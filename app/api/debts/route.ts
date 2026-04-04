import type { NextRequest } from "next/server";
import type { CreateDebtInput } from "@/lib/types";
import { fail, ok } from "@/lib/server/route";
import { requireSessionUser } from "@/lib/server/session";
import { createDebtForUser } from "@/lib/server/workspace-service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const body = (await request.json()) as CreateDebtInput;
    await createDebtForUser(user, body);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
