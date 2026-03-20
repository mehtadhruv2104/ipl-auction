"use client";

import { useState, useEffect } from "react";
import { TEAM_COLORS, TEAM_SHORT } from "@/lib/teams";

interface MatchPoint {
  match_id: number;
  match_name: string;
  date: string;
  points: number;
}

interface LeaderboardPlayer {
  player_id: number;
  name: string;
  team: string;
  role: string;
  total_points: number;
  match_points: MatchPoint[];
}

interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  total_points: number;
  players: LeaderboardPlayer[];
}

interface Match {
  id: number;
  name: string;
  date: string;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard").then((r) => r.json()).then(setEntries);
    fetch("/api/matches").then((r) => r.json()).then(setMatches);
  }, []);

  const noMatches = matches.length === 0;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <span>
          {noMatches ? "No matches scored yet" : `${matches.length} match${matches.length === 1 ? "" : "es"} scored`}
        </span>
        {!noMatches && (
          <span className="text-gray-600">&middot;</span>
        )}
        {!noMatches && (
          <span>Last: {matches[0].name} ({matches[0].date})</span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-gray-500 text-sm">No participants yet.</p>
      ) : (
        <div className="rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/80 text-gray-300 text-left">
                <th className="px-4 py-3 font-medium w-12">Rank</th>
                <th className="px-4 py-3 font-medium">Participant</th>
                <th className="px-4 py-3 font-medium text-right">Total Points</th>
                <th className="px-4 py-3 font-medium text-right">Players</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <>
                  <tr
                    key={entry.id}
                    onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                    className="border-t border-gray-800/50 hover:bg-gray-800/40 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          entry.rank === 1
                            ? "bg-yellow-500 text-black"
                            : entry.rank === 2
                            ? "bg-gray-400 text-black"
                            : entry.rank === 3
                            ? "bg-amber-700 text-white"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-100">
                      <span className="flex items-center gap-2">
                        {entry.name}
                        <span className="text-gray-600 text-xs">
                          {expanded === entry.id ? "▲" : "▼"}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-400">
                      {entry.total_points.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">
                      {entry.players.length}
                    </td>
                  </tr>

                  {/* Expanded breakdown */}
                  {expanded === entry.id && (
                    <tr key={`${entry.id}-detail`} className="border-t border-gray-800/50">
                      <td colSpan={4} className="px-4 py-3 bg-gray-900/50">
                        {entry.players.length === 0 ? (
                          <p className="text-gray-500 text-sm">No players purchased yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-400 text-left border-b border-gray-800">
                                  <th className="pb-2 pr-4 font-medium">Player</th>
                                  <th className="pb-2 pr-4 font-medium">Team</th>
                                  <th className="pb-2 pr-4 font-medium">Role</th>
                                  {matches
                                    .slice()
                                    .reverse()
                                    .map((m) => (
                                      <th
                                        key={m.id}
                                        className="pb-2 pr-3 font-medium text-right whitespace-nowrap"
                                        title={m.name}
                                      >
                                        {m.date}
                                      </th>
                                    ))}
                                  <th className="pb-2 font-medium text-right text-gray-200">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {entry.players
                                  .slice()
                                  .sort((a, b) => b.total_points - a.total_points)
                                  .map((p) => {
                                    const matchPtsById = new Map(
                                      p.match_points.map((mp) => [mp.match_id, mp.points])
                                    );
                                    return (
                                      <tr
                                        key={p.player_id}
                                        className="border-t border-gray-800/30 hover:bg-gray-800/20"
                                      >
                                        <td className="py-1.5 pr-4 text-gray-200 whitespace-nowrap">
                                          {p.name}
                                        </td>
                                        <td className="py-1.5 pr-4">
                                          <span
                                            className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                                              TEAM_COLORS[p.team] ?? "bg-gray-700 text-gray-300"
                                            }`}
                                          >
                                            {TEAM_SHORT[p.team] ?? p.team}
                                          </span>
                                        </td>
                                        <td className="py-1.5 pr-4 text-gray-400">{p.role}</td>
                                        {matches
                                          .slice()
                                          .reverse()
                                          .map((m) => (
                                            <td
                                              key={m.id}
                                              className="py-1.5 pr-3 text-right text-gray-300"
                                            >
                                              {matchPtsById.has(m.id)
                                                ? matchPtsById.get(m.id)!.toFixed(1)
                                                : <span className="text-gray-700">—</span>}
                                            </td>
                                          ))}
                                        <td className="py-1.5 text-right font-semibold text-blue-400">
                                          {p.total_points.toFixed(1)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
