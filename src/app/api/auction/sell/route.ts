import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const { playerId, participantId, price } = await request.json();

  if (!playerId || !participantId || price == null || price <= 0) {
    return NextResponse.json({ error: "playerId, participantId, and price are required" }, { status: 400 });
  }

  const db = getDb();

  const participant = db.prepare("SELECT * FROM participants WHERE id = ?").get(participantId) as
    | { id: number; name: string; budget: number }
    | undefined;

  if (!participant) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }

  if (participant.budget < price) {
    return NextResponse.json({ error: "Insufficient budget" }, { status: 400 });
  }

  const sell = db.transaction(() => {
    db.prepare("UPDATE auction_players SET status = 'sold', sold_to = ?, sold_price = ? WHERE player_id = ?").run(
      participantId,
      price,
      playerId
    );
    db.prepare("UPDATE participants SET budget = budget - ? WHERE id = ?").run(price, participantId);
  });

  sell();

  return NextResponse.json({ success: true });
}
