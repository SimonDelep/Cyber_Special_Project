import { NextResponse } from "next/server";
import { getDailyInspiration } from "@/lib/inspiration";

export async function GET() {
  const quote = await getDailyInspiration();
  return NextResponse.json({ quote });
}
