import type { NextRequest } from "next/server";
import type { ProductInput } from "@/lib/types";
import { fail, ok } from "@/lib/server/route";
import { requireSessionUser } from "@/lib/server/session";
import { updateProductForUser } from "@/lib/server/workspace-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSessionUser(request);
    const { id } = await params;
    const body = (await request.json()) as ProductInput;
    await updateProductForUser(user, id, body);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
