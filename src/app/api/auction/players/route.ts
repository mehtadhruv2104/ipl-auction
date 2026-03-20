import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import players from "@/data/players.json";

export function GET() {
  const db = getDb();
  const rows = db
    .prepare("SELECT player_id, status FROM auction_players WHERE status != 'sold'")
    .all() as { player_id: number; status: string }[];

  const statusMap = new Map(rows.map((r) => [r.player_id, r.status]));

  const result = players
    .filter((p) => statusMap.has(p.id))
    .map((p) => ({ ...p, status: statusMap.get(p.id) }));

  return NextResponse.json(result);
}
