import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET() {
  const db = getDb();
  const matches = db
    .prepare("SELECT id, name, date, status FROM matches ORDER BY date DESC")
    .all();
  return NextResponse.json(matches);
}
