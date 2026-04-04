import type { NextRequest } from "next/server";
import { fail, ok } from "@/lib/server/route";
import { requireSessionUser } from "@/lib/server/session";
import { restockProductForUser } from "@/lib/server/workspace-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSessionUser(request);
    const { id } = await params;
    const body = (await request.json()) as { qty: number };
    await restockProductForUser(user, id, body.qty);
    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}
