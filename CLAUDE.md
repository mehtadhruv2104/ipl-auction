# IPL Auction v2

Next.js 15 web app for simulating IPL 2026 player auctions.

## Commands

```bash
npm run dev      # Start dev server (Turbopack) at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Architecture

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: SQLite via `better-sqlite3`, WAL mode, file: `auction.db`
- **Styling**: Tailwind CSS 4
- **Data**: 250 players in `src/data/players.json` (parsed from Excel)

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Root page with tab navigation
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── auction/
│       │   ├── random/route.ts   # GET: pick random available player
│       │   ├── sell/route.ts     # POST: mark player sold
│       │   ├── unsold/route.ts   # POST: mark player unsold
│       │   └── stats/route.ts    # GET: auction statistics
│       ├── participants/
│       │   ├── route.ts          # GET/POST participants
│       │   └── [id]/route.ts     # DELETE participant
│       └── teams/route.ts        # GET: rosters with budgets
├── components/
│   ├── AuctionPanel.tsx          # Core auction UI
│   ├── PlayersTable.tsx          # Searchable/filterable player list
│   ├── TeamsView.tsx             # Rosters and budgets view
│   ├── ParticipantSetup.tsx      # Add/remove participants
│   └── TabNav.tsx
├── lib/
│   ├── db.ts                     # DB init, schema, seeding
│   └── teams.ts                  # IPL team colors and abbreviations
├── data/players.json             # 250 player records
└── types/player.ts               # TypeScript interfaces
```

## Database Schema

```sql
-- Auction participants (each gets a budget, default 120 Cr)
CREATE TABLE participants (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name   TEXT NOT NULL UNIQUE,
  budget REAL NOT NULL DEFAULT 120.0
);

-- One row per player; seeded with 250 rows on first run
CREATE TABLE auction_players (
  player_id  INTEGER PRIMARY KEY,
  status     TEXT NOT NULL DEFAULT 'available',  -- available | sold | unsold
  sold_to    INTEGER REFERENCES participants(id),
  sold_price REAL
);
```

## Player Data Shape

```ts
interface Player {
  id: number;
  name: string;
  team: string;          // IPL team name
  role: string;          // Batter | Bowler | All-Rounder | WK-Batter
  nationality: string;   // Indian | Overseas
  acquisition: string;   // Retained | RTM | Signed
  price: number;         // in Cr
}
```

## Key Notes

- DB is a singleton in `src/lib/db.ts`; seeded automatically on first request
- `auction.db` lives at project root; do not commit it
- Players table is read-only (sourced from JSON); auction state lives in SQLite
- Default participant budget is 120 Cr
- Scripts: `scripts/parse-players.ts` re-generates `players.json` from `IPL_2026_Squads.xlsx`
