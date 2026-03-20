import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET() {
  const db = getDb();
  const participants = db.prepare("SELECT * FROM participants ORDER BY name").all();
  return NextResponse.json(participants);
}

export async function POST(request: Request) {
  const { name, budget } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = getDb();
  try {
    const result = db
      .prepare("INSERT INTO participants (name, budget) VALUES (?, ?)")
      .run(name.trim(), budget ?? 120.0);
    const participant = db.prepare("SELECT * FROM participants WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(participant, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "Participant already exists" }, { status: 409 });
    }
    throw e;
  }
}
