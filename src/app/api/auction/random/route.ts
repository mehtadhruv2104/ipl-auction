import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import players from "@/data/players.json";

export function GET() {
  const db = getDb();
  const row = db
    .prepare("SELECT player_id FROM auction_players WHERE status = 'available' ORDER BY RANDOM() LIMIT 1")
    .get() as { player_id: number } | undefined;

  if (!row) {
    return NextResponse.json({ error: "No available players" }, { status: 404 });
  }

  const player = players.find((p) => p.id === row.player_id);
  return NextResponse.json(player);
}
