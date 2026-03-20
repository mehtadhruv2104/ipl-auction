export interface PlayerMatchStats {
  played: boolean;
  runs: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  wickets: number;
  maidens: number;
  catches: number;
  stumpings: number;
  runOutsDirect: number;
  runOutsIndirect: number;
}

export function calculatePoints(s: PlayerMatchStats): number {
  let pts = 0;

  if (s.played) pts += 4;

  // Batting
  pts += s.runs;
  pts += s.fours;        // boundary bonus (+1 per four)
  pts += s.sixes * 2;   // six bonus (+2 per six)
  if (s.runs >= 100) pts += 16;
  else if (s.runs >= 50) pts += 8;
  if (s.runs === 0 && s.isOut) pts -= 2; // duck

  // Bowling
  pts += s.wickets * 25;
  pts += s.maidens * 4;
  if (s.wickets >= 3) pts += 4;  // 3-wicket haul bonus
  if (s.wickets >= 4) pts += 4;  // 4-wicket haul bonus
  if (s.wickets >= 5) pts += 4;  // 5-wicket haul bonus

  // Fielding
  pts += s.catches * 8;
  pts += s.stumpings * 12;
  pts += s.runOutsDirect * 12;
  pts += s.runOutsIndirect * 6;

  return pts;
}
