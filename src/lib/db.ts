import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = path.join(process.cwd(), "auction.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      budget REAL NOT NULL DEFAULT 120.0
    );

    CREATE TABLE IF NOT EXISTS auction_players (
      player_id INTEGER PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'available',
      sold_to INTEGER REFERENCES participants(id),
      sold_price REAL
    );

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

  // Seed 250 player IDs if empty
  const count = db.prepare("SELECT COUNT(*) as c FROM auction_players").get() as { c: number };
  if (count.c === 0) {
    const insert = db.prepare("INSERT INTO auction_players (player_id) VALUES (?)");
    const seedAll = db.transaction(() => {
      for (let i = 1; i <= 250; i++) {
        insert.run(i);
      }
    });
    seedAll();
  }

  return db;
}
