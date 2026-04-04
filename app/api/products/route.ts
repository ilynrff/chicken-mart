import type { NextRequest } from "next/server";
import type { ProductInput } from "@/lib/types";
import { fail, ok } from "@/lib/server/route";
import { requireSessionUser } from "@/lib/server/session";
import { createProductForUser } from "@/lib/server/workspace-service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const body = (await request.json()) as ProductInput;
    await createProductForUser(user, body);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
