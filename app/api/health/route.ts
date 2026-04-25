import { NextResponse } from "next/server";
import { getHealthSnapshot } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "bizos",
    ts: Date.now(),
    runtime: getHealthSnapshot(),
  });
}
