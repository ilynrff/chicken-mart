import type { NextRequest } from "next/server";
import type { CategoryInput } from "@/lib/types";
import { fail, ok } from "@/lib/server/route";
import { requireSessionUser } from "@/lib/server/session";
import { createCategoryForUser } from "@/lib/server/workspace-service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const body = (await request.json()) as CategoryInput;
    const category = await createCategoryForUser(user, body);
    return ok(category);
  } catch (error) {
    return fail(error);
  }
}
