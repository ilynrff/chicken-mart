import type { NextRequest } from "next/server";
import type { CreateTransactionInput } from "@/lib/types";
import { fail, ok } from "@/lib/server/route";
import { requireSessionUser } from "@/lib/server/session";
import { createTransactionForUser } from "@/lib/server/workspace-service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const body = (await request.json()) as CreateTransactionInput;
    const transaction = await createTransactionForUser(user, body);
    return ok(transaction);
  } catch (error) {
    return fail(error);
  }
}
