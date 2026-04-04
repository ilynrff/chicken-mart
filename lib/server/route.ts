import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/server/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(error: unknown) {
  const status = typeof error === "object" && error !== null && "status" in error ? Number((error as { status: number }).status) : 500;
  return NextResponse.json({ message: getErrorMessage(error) }, { status });
}
