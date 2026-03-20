"use client";

import { useState, useMemo } from "react";
import type { Player } from "@/types/player";
import { TEAM_COLORS, TEAM_SHORT } from "@/lib/teams";

export default function PlayersTable({ players }: { players: Player[] }) {
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState("");

  const teams = useMemo(() => [...new Set(players.map((p) => p.team))].sort(), [players]);
  const roles = useMemo(() => [...new Set(players.map((p) => p.role))].sort(), [players]);
  const nationalities = useMemo(
    () => [...new Set(players.map((p) => p.nationality))].sort(),
    [players]
  );

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (teamFilter && p.team !== teamFilter) return false;
      if (roleFilter && p.role !== roleFilter) return false;
      if (nationalityFilter && p.nationality !== nationalityFilter) return false;
      return true;
    });
  }, [players, search, teamFilter, roleFilter, nationalityFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search player..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
        />
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={nationalityFilter}
          onChange={(e) => setNationalityFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Nationalities</option>
          {nationalities.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-400">{filtered.length} players</p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/80 text-gray-300 text-left">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Team</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Nationality</th>
              <th className="px-4 py-3 font-medium">Acquisition</th>
              <th className="px-4 py-3 font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr
                key={p.id}
                className={`border-t border-gray-800/50 hover:bg-gray-800/40 transition-colors ${
                  i % 2 === 0 ? "bg-gray-900/30" : ""
                }`}
              >
                <td className="px-4 py-2.5 text-gray-500">{p.id}</td>
                <td className="px-4 py-2.5 font-medium text-gray-100">{p.name}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      TEAM_COLORS[p.team] ?? "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {TEAM_SHORT[p.team] ?? p.team}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-300">{p.role}</td>
                <td className="px-4 py-2.5 text-gray-400">{p.nationality}</td>
                <td className="px-4 py-2.5 text-gray-400">{p.acquisition}</td>
                <td className="px-4 py-2.5 text-gray-300">{p.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
