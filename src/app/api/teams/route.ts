import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import players from "@/data/players.json";

export function GET() {
  const db = getDb();

  const participants = db.prepare("SELECT * FROM participants ORDER BY name").all() as {
    id: number;
    name: string;
    budget: number;
  }[];

  const soldPlayers = db
    .prepare("SELECT player_id, sold_to, sold_price FROM auction_players WHERE status = 'sold'")
    .all() as { player_id: number; sold_to: number; sold_price: number }[];

  const teams = participants.map((p) => {
    const roster = soldPlayers
      .filter((sp) => sp.sold_to === p.id)
      .map((sp) => {
        const player = players.find((pl) => pl.id === sp.player_id);
        return {
          ...player,
          sold_price: sp.sold_price,
        };
      });

    return {
      ...p,
      players: roster,
    };
  });

  return NextResponse.json(teams);
}
