import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import players from "@/data/players.json";

const playerMap = new Map(players.map((p) => [p.id, p]));

export function GET() {
  const db = getDb();

  // Per-player totals per participant
  const playerTotals = db
    .prepare(
      `SELECT p.id as participant_id, p.name as participant_name,
              ap.player_id,
              COALESCE(SUM(pms.points), 0) as player_total
       FROM participants p
       LEFT JOIN auction_players ap ON ap.sold_to = p.id AND ap.status = 'sold'
       LEFT JOIN player_match_stats pms ON pms.player_id = ap.player_id
       GROUP BY p.id, ap.player_id`
    )
    .all() as {
      participant_id: number;
      participant_name: string;
      player_id: number | null;
      player_total: number;
    }[];

  // Per-player per-match points
  const matchPoints = db
    .prepare(
      `SELECT pms.player_id, pms.match_id, pms.points,
              m.name as match_name, m.date
       FROM player_match_stats pms
       JOIN matches m ON m.id = pms.match_id
       ORDER BY m.date ASC`
    )
    .all() as {
      player_id: number;
      match_id: number;
      points: number;
      match_name: string;
      date: string;
    }[];

  // Group match points by player
  const matchPointsByPlayer = new Map<number, typeof matchPoints>();
  for (const mp of matchPoints) {
    if (!matchPointsByPlayer.has(mp.player_id)) {
      matchPointsByPlayer.set(mp.player_id, []);
    }
    matchPointsByPlayer.get(mp.player_id)!.push(mp);
  }

  // Group by participant
  const participantMap = new Map<
    number,
    { id: number; name: string; total_points: number; players: unknown[] }
  >();

  for (const row of playerTotals) {
    if (!participantMap.has(row.participant_id)) {
      participantMap.set(row.participant_id, {
        id: row.participant_id,
        name: row.participant_name,
        total_points: 0,
        players: [],
      });
    }

    const participant = participantMap.get(row.participant_id)!;

    if (row.player_id != null) {
      participant.total_points += row.player_total;
      const info = playerMap.get(row.player_id);
      participant.players.push({
        player_id: row.player_id,
        name: info?.name ?? `Player #${row.player_id}`,
        team: info?.team ?? "",
        role: info?.role ?? "",
        total_points: row.player_total,
        match_points: matchPointsByPlayer.get(row.player_id) ?? [],
      });
    }
  }

  const ranked = [...participantMap.values()]
    .sort((a, b) => b.total_points - a.total_points)
    .map((p, i) => ({ rank: i + 1, ...p }));

  return NextResponse.json(ranked);
}
