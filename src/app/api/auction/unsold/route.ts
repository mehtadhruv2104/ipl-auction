import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const { playerId } = await request.json();

  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("UPDATE auction_players SET status = 'unsold' WHERE player_id = ?").run(playerId);

  return NextResponse.json({ success: true });
}
