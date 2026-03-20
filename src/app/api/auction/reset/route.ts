import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function POST() {
  const db = getDb();

  db.transaction(() => {
    db.prepare("UPDATE auction_players SET status = 'available', sold_to = NULL, sold_price = NULL").run();
    db.prepare("DELETE FROM player_match_stats").run();
    db.prepare("DELETE FROM matches").run();
    db.prepare("DELETE FROM participants").run();
  })();

  return NextResponse.json({ success: true });
}
