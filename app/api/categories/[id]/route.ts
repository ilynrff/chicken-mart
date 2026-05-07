import type { NextRequest } from "next/server";
import type { CategoryInput } from "@/lib/types";
import { fail, ok } from "@/lib/server/route";
import { requireSessionUser } from "@/lib/server/session";
import { updateCategoryForUser, deleteCategoryForUser } from "@/lib/server/workspace-service";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireSessionUser(request);
    const body = (await request.json()) as CategoryInput;
    await updateCategoryForUser(user, params.id, body);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireSessionUser(request);
    await deleteCategoryForUser(user, params.id);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
