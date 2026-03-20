import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  // Check if participant has any purchased players
  const soldCount = db
    .prepare("SELECT COUNT(*) as c FROM auction_players WHERE sold_to = ?")
    .get(Number(id)) as { c: number };

  if (soldCount.c > 0) {
    return NextResponse.json(
      { error: "Cannot delete participant with purchased players" },
      { status: 400 }
    );
  }

  const result = db.prepare("DELETE FROM participants WHERE id = ?").run(Number(id));
  if (result.changes === 0) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
