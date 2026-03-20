"use client";

import { useState } from "react";
import PlayersTable from "@/components/PlayersTable";
import TabNav, { type Tab } from "@/components/TabNav";
import AuctionPanel from "@/components/AuctionPanel";
import TeamsView from "@/components/TeamsView";
import PoolView from "@/components/PoolView";
import Leaderboard from "@/components/Leaderboard";
import players from "@/data/players.json";
import type { Player } from "@/types/player";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("Players");

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">IPL 2026 Cricket Manager</h1>
      <p className="text-gray-400 mb-6">250 players across 10 teams</p>
      <TabNav active={activeTab} onChange={setActiveTab} />
      {activeTab === "Players" && <PlayersTable players={players as Player[]} />}
      {activeTab === "Auction" && <AuctionPanel />}
      {activeTab === "Pool" && <PoolView />}
      {activeTab === "Teams" && <TeamsView />}
      {activeTab === "Leaderboard" && <Leaderboard />}
    </main>
  );
}
