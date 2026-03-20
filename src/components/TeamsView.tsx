"use client";

import { useState, useEffect } from "react";
import { TEAM_COLORS, TEAM_SHORT } from "@/lib/teams";

interface TeamPlayer {
  id: number;
  name: string;
  team: string;
  role: string;
  nationality: string;
  sold_price: number;
}

interface TeamData {
  id: number;
  name: string;
  budget: number;
  players: TeamPlayer[];
}

export default function TeamsView() {
  const [teams, setTeams] = useState<TeamData[]>([]);

  useEffect(() => {
    const fetchTeams = async () => {
      const res = await fetch("/api/teams");
      if (res.ok) {
        setTeams(await res.json());
      }
    };
    fetchTeams();
  }, []);

  if (teams.length === 0) {
    return (
      <p className="text-gray-400 text-sm">
        No participants yet. Add participants in the Auction tab to get started.
      </p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {teams.map((team) => {
        const spent = team.players.reduce((sum, p) => sum + p.sold_price, 0);
        return (
          <div key={team.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-100">{team.name}</h3>
              <div className="text-right text-sm">
                <div className="text-gray-400">
                  Remaining: <span className="text-green-400 font-medium">{team.budget.toFixed(1)}</span>
                </div>
                <div className="text-gray-500">
                  Spent: {spent.toFixed(1)} &middot; {team.players.length} players
                </div>
              </div>
            </div>

            {team.players.length === 0 ? (
              <p className="text-gray-500 text-sm">No players purchased yet</p>
            ) : (
              <div className="overflow-x-auto rounded border border-gray-700/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-900/50 text-gray-400 text-left">
                      <th className="px-3 py-2 font-medium">Player</th>
                      <th className="px-3 py-2 font-medium">Team</th>
                      <th className="px-3 py-2 font-medium">Role</th>
                      <th className="px-3 py-2 font-medium text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.players.map((p) => (
                      <tr key={p.id} className="border-t border-gray-800/50">
                        <td className="px-3 py-2 text-gray-200">{p.name}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              TEAM_COLORS[p.team] ?? "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {TEAM_SHORT[p.team] ?? p.team}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-400">{p.role}</td>
                        <td className="px-3 py-2 text-gray-300 text-right">{p.sold_price.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
