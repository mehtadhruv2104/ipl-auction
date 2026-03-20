import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function POST() {
  const db = getDb();
  const result = db
    .prepare("UPDATE auction_players SET status = 'available' WHERE status = 'unsold'")
    .run();
  return NextResponse.json({ reset: result.changes });
}
