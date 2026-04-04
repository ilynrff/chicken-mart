import type { NextRequest } from "next/server";
import type { StoreProfile, StoreSettings } from "@/lib/types";
import { fail, ok } from "@/lib/server/route";
import { requireSessionUser } from "@/lib/server/session";
import { updateSettingsForUser } from "@/lib/server/workspace-service";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const body = (await request.json()) as { profile: StoreProfile; settings: StoreSettings };
    await updateSettingsForUser(user, body);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
