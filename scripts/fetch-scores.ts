/**
 * Daily cron job — fetch IPL match scores from cricapi.com and store fantasy points.
 *
 * Usage:
 *   CRICAPI_KEY=your_key npx tsx scripts/fetch-scores.ts
 *
 * Or set CRICAPI_KEY in .env.local and run:
 *   npx tsx --env-file=.env.local scripts/fetch-scores.ts
 */

import Database from "better-sqlite3";
import path from "path";
import { calculatePoints } from "../src/lib/scoring";
import type { PlayerMatchStats } from "../src/lib/scoring";
import playersJson from "../src/data/players.json";

const API_KEY = process.env.CRICAPI_KEY;
if (!API_KEY) {
  console.error("Error: CRICAPI_KEY env var is not set.");
  process.exit(1);
}

// ── DB setup ──────────────────────────────────────────────────────────────────

const db = new Database(path.join(process.cwd(), "auction.db"));
db.pragma("journal_mode = WAL");

// Ensure tables exist (mirrors src/lib/db.ts)
db.exec(`
  CREATE TABLE IF NOT EXISTS matches (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    date        TEXT NOT NULL,
    status      TEXT DEFAULT 'completed'
  );

  CREATE TABLE IF NOT EXISTS player_match_stats (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id         INTEGER NOT NULL,
    match_id          INTEGER NOT NULL REFERENCES matches(id),
    runs              INTEGER DEFAULT 0,
    fours             INTEGER DEFAULT 0,
    sixes             INTEGER DEFAULT 0,
    is_out            INTEGER DEFAULT 0,
    wickets           INTEGER DEFAULT 0,
    maidens           INTEGER DEFAULT 0,
    catches           INTEGER DEFAULT 0,
    stumpings         INTEGER DEFAULT 0,
    run_outs_direct   INTEGER DEFAULT 0,
    run_outs_indirect INTEGER DEFAULT 0,
    played            INTEGER DEFAULT 1,
    points            REAL DEFAULT 0,
    UNIQUE(player_id, match_id)
  );
`);

// ── Player name index ─────────────────────────────────────────────────────────

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
}

const playerIndex = new Map<string, number>();
for (const p of playersJson) {
  playerIndex.set(normalizeName(p.name), p.id);
}

function resolvePlayerId(name: string): number | null {
  const key = normalizeName(name);
  if (playerIndex.has(key)) return playerIndex.get(key)!;
  // Try partial match (last name)
  const lastName = key.split(" ").pop()!;
  for (const [k, id] of playerIndex) {
    if (k.endsWith(lastName) || k.startsWith(key.split(" ")[0])) return id;
  }
  return null;
}

// ── Fielding parser ───────────────────────────────────────────────────────────

interface FieldingCredit {
  playerId: number;
  type: "catch" | "stumping" | "run_out_direct" | "run_out_indirect";
}

function parseFieldingFromDismissal(dismissalText: string): FieldingCredit[] {
  const credits: FieldingCredit[] = [];
  if (!dismissalText) return credits;

  const text = dismissalText.trim();

  // "c PlayerName b Bowler" or "c&b Bowler"
  const catchMatch = text.match(/^c\s+([^b]+)\s+b\s+/i);
  if (catchMatch) {
    const id = resolvePlayerId(catchMatch[1].trim());
    if (id) credits.push({ playerId: id, type: "catch" });
    return credits;
  }

  // "st PlayerName b Bowler"
  const stumpMatch = text.match(/^st\s+([^b]+)\s+b\s+/i);
  if (stumpMatch) {
    const id = resolvePlayerId(stumpMatch[1].trim());
    if (id) credits.push({ playerId: id, type: "stumping" });
    return credits;
  }

  // "run out (PlayerA/PlayerB)" or "run out (PlayerA)"
  const roMatch = text.match(/run out \(([^)]+)\)/i);
  if (roMatch) {
    const names = roMatch[1].split("/").map((n) => n.trim());
    if (names[0]) {
      const id = resolvePlayerId(names[0]);
      if (id) credits.push({ playerId: id, type: "run_out_direct" });
    }
    if (names[1]) {
      const id = resolvePlayerId(names[1]);
      if (id) credits.push({ playerId: id, type: "run_out_indirect" });
    }
    return credits;
  }

  return credits;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiFetch(endpoint: string, params: Record<string, string>) {
  const url = new URL(`https://api.cricapi.com/v1/${endpoint}`);
  url.searchParams.set("apikey", API_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`cricapi ${endpoint} failed: ${res.status}`);
  return res.json();
}

function isIPL(name: string, seriesId?: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes("ipl") ||
    lower.includes("indian premier league") ||
    (seriesId ?? "").includes("ipl")
  );
}

// ── Prepare statements ────────────────────────────────────────────────────────

const insertMatch = db.prepare(
  "INSERT OR IGNORE INTO matches (external_id, name, date, status) VALUES (?, ?, ?, 'completed')"
);
const getMatch = db.prepare("SELECT id FROM matches WHERE external_id = ?");
const upsertStats = db.prepare(`
  INSERT INTO player_match_stats
    (player_id, match_id, runs, fours, sixes, is_out, wickets, maidens,
     catches, stumpings, run_outs_direct, run_outs_indirect, played, points)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  ON CONFLICT(player_id, match_id) DO UPDATE SET
    runs=excluded.runs, fours=excluded.fours, sixes=excluded.sixes,
    is_out=excluded.is_out, wickets=excluded.wickets, maidens=excluded.maidens,
    catches=excluded.catches, stumpings=excluded.stumpings,
    run_outs_direct=excluded.run_outs_direct,
    run_outs_indirect=excluded.run_outs_indirect,
    played=1, points=excluded.points
`);

// ── Main ──────────────────────────────────────────────────────────────────────

async function processMatch(matchId: string, matchName: string, matchDate: string) {
  console.log(`  Processing: ${matchName}`);

  const { data: sc } = await apiFetch("match_scorecard", { id: matchId });
  if (!sc?.scorecard?.length) {
    console.log("    No scorecard data, skipping.");
    return;
  }

  insertMatch.run(matchId, matchName, matchDate);
  const row = getMatch.get(matchId) as { id: number };
  const dbMatchId = row.id;

  // Accumulate stats per player across both innings
  const statsMap = new Map<number, PlayerMatchStats & { fielding: Map<string, number> }>();

  function getStats(playerId: number) {
    if (!statsMap.has(playerId)) {
      statsMap.set(playerId, {
        played: true,
        runs: 0, fours: 0, sixes: 0, isOut: false,
        wickets: 0, maidens: 0,
        catches: 0, stumpings: 0, runOutsDirect: 0, runOutsIndirect: 0,
        fielding: new Map(),
      });
    }
    return statsMap.get(playerId)!;
  }

  let matched = 0;
  let unmatched: string[] = [];

  for (const inning of sc.scorecard) {
    // Batting
    for (const b of inning.batting ?? []) {
      const name = b.batsman?.name ?? b["batsman-id"]?.name ?? "";
      const id = resolvePlayerId(name);
      if (!id) { unmatched.push(name); continue; }
      matched++;
      const s = getStats(id);
      s.runs += b.r ?? 0;
      s.fours += b["4s"] ?? 0;
      s.sixes += b["6s"] ?? 0;
      const dismissal = (b["dismissal-text"] ?? "").toLowerCase();
      if (dismissal && dismissal !== "not out" && dismissal !== "dnb") {
        s.isOut = true;
      }
      // Parse fielding from this dismissal
      for (const credit of parseFieldingFromDismissal(b["dismissal-text"] ?? "")) {
        const fs = getStats(credit.playerId);
        if (credit.type === "catch") fs.catches++;
        else if (credit.type === "stumping") fs.stumpings++;
        else if (credit.type === "run_out_direct") fs.runOutsDirect++;
        else if (credit.type === "run_out_indirect") fs.runOutsIndirect++;
      }
    }

    // Bowling
    for (const b of inning.bowling ?? []) {
      const name = b.bowler?.name ?? b["bowler-id"]?.name ?? "";
      const id = resolvePlayerId(name);
      if (!id) { unmatched.push(name); continue; }
      matched++;
      const s = getStats(id);
      s.wickets += b.w ?? 0;
      s.maidens += b.m ?? 0;
    }
  }

  // Write to DB
  const insertAll = db.transaction(() => {
    for (const [playerId, s] of statsMap) {
      const pts = calculatePoints(s);
      upsertStats.run(
        playerId, dbMatchId,
        s.runs, s.fours, s.sixes, s.isOut ? 1 : 0,
        s.wickets, s.maidens,
        s.catches, s.stumpings, s.runOutsDirect, s.runOutsIndirect,
        pts
      );
    }
  });
  insertAll();

  const uniqueUnmatched = [...new Set(unmatched)];
  console.log(`    Matched: ${matched} entries, ${statsMap.size} unique players`);
  if (uniqueUnmatched.length) {
    console.log(`    Unmatched names: ${uniqueUnmatched.slice(0, 10).join(", ")}${uniqueUnmatched.length > 10 ? "..." : ""}`);
  }
}

async function main() {
  console.log("Fetching current matches from cricapi.com...");
  const { data: matches } = await apiFetch("currentMatches", { offset: "0" });

  if (!Array.isArray(matches)) {
    console.error("Unexpected API response:", matches);
    process.exit(1);
  }

  const iplMatches = matches.filter(
    (m: Record<string, unknown>) =>
      isIPL(String(m.name ?? ""), String(m.series_id ?? "")) &&
      m.matchType === "t20" &&
      (String(m.status ?? "")).toLowerCase().includes("won") ||
      (String(m.status ?? "")).toLowerCase().includes("match over")
  );

  console.log(`Found ${iplMatches.length} completed IPL T20 match(es).`);

  let newCount = 0;
  for (const m of iplMatches) {
    const existing = getMatch.get(String(m.id));
    if (existing) {
      console.log(`  Skipping (already processed): ${m.name}`);
      continue;
    }
    await processMatch(String(m.id), String(m.name), String(m.date ?? m.dateTimeGMT ?? ""));
    newCount++;
  }

  console.log(`Done. Processed ${newCount} new match(es).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
