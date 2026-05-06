import { type NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/server/session";
import { createDebtPaymentForUser } from "@/lib/server/workspace-service";
import type { CreateDebtPaymentInput } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const input = (await request.json()) as CreateDebtPaymentInput;

    await createDebtPaymentForUser(user, input);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && "status" in error && typeof error.status === "number") {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.json({ message: "Terjadi kesalahan sistem." }, { status: 500 });
  }
}
