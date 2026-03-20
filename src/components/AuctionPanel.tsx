"use client";

import { useState, useEffect, useCallback } from "react";
import type { Player, Participant } from "@/types/player";
import { TEAM_COLORS, TEAM_SHORT } from "@/lib/teams";
import ParticipantSetup from "./ParticipantSetup";

interface AuctionStats {
  total: number;
  available: number;
  sold: number;
  unsold: number;
}

export default function AuctionPanel() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<number | "">("");
  const [bidPrice, setBidPrice] = useState("");
  const [stats, setStats] = useState<AuctionStats>({ total: 250, available: 250, sold: 0, unsold: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const fetchParticipants = useCallback(async () => {
    const res = await fetch("/api/participants");
    if (res.ok) setParticipants(await res.json());
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/auction/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => {
    fetchParticipants();
    fetchStats();
  }, [fetchParticipants, fetchStats]);

  const pickRandom = async () => {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/auction/random");
    if (!res.ok) {
      setMessage("No available players remaining!");
      setCurrentPlayer(null);
      setLoading(false);
      return;
    }
    const player = await res.json();
    setCurrentPlayer(player);
    setBidPrice("");
    setSelectedParticipant("");
    setLoading(false);
  };

  const markSold = async () => {
    if (!currentPlayer || !selectedParticipant || !bidPrice) return;
    setMessage("");

    const res = await fetch("/api/auction/sell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: currentPlayer.id,
        participantId: selectedParticipant,
        price: parseFloat(bidPrice),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error);
      return;
    }

    const buyer = participants.find((p) => p.id === selectedParticipant);
    setMessage(`${currentPlayer.name} sold to ${buyer?.name} for ${bidPrice}`);
    setCurrentPlayer(null);
    fetchStats();
    fetchParticipants();
  };

  const markUnsold = async () => {
    if (!currentPlayer) return;
    setMessage("");

    await fetch("/api/auction/unsold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: currentPlayer.id }),
    });

    setMessage(`${currentPlayer.name} went unsold`);
    setCurrentPlayer(null);
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center gap-4 text-sm">
        <div className="bg-gray-800/50 rounded-lg px-4 py-2">
          <span className="text-gray-400">Available:</span>{" "}
          <span className="text-green-400 font-medium">{stats.available}</span>
        </div>
        <div className="bg-gray-800/50 rounded-lg px-4 py-2">
          <span className="text-gray-400">Sold:</span>{" "}
          <span className="text-blue-400 font-medium">{stats.sold}</span>
        </div>
        <div className="bg-gray-800/50 rounded-lg px-4 py-2">
          <span className="text-gray-400">Unsold:</span>{" "}
          <span className="text-yellow-400 font-medium">{stats.unsold}</span>
        </div>
        {confirmReset ? (
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className="text-gray-300">Clear all participants, bids &amp; match data?</span>
            <button
              onClick={async () => {
                await fetch("/api/auction/reset", { method: "POST" });
                setConfirmReset(false);
                setCurrentPlayer(null);
                setBidPrice("");
                setSelectedParticipant("");
                setMessage("");
                fetchStats();
                fetchParticipants();
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
            >
              Yes, reset
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="text-gray-400 hover:text-gray-200 px-2 py-1 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="ml-auto text-gray-500 hover:text-red-400 text-xs transition-colors"
          >
            Reset Auction
          </button>
        )}
      </div>

      {/* Pick Button */}
      <div className="flex gap-3">
        <button
          onClick={pickRandom}
          disabled={loading || stats.available === 0}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? "Picking..." : "Pick Random Player"}
        </button>
        {stats.unsold > 0 && !currentPlayer && (
          <button
            onClick={async () => {
              await fetch("/api/auction/reset-unsold", { method: "POST" });
              fetchStats();
              setMessage(`Re-auctioning ${stats.unsold} unsold players`);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            Re-auction Unsold ({stats.unsold})
          </button>
        )}
      </div>

      {/* Current Player Card */}
      {currentPlayer && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-100">{currentPlayer.name}</h2>
              <div className="flex gap-2 mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    TEAM_COLORS[currentPlayer.team] ?? "bg-gray-700 text-gray-300"
                  }`}
                >
                  {TEAM_SHORT[currentPlayer.team] ?? currentPlayer.team}
                </span>
                <span className="text-sm text-gray-400">{currentPlayer.role}</span>
              </div>
            </div>
            <div className="text-right text-sm text-gray-400">
              <div>{currentPlayer.nationality}</div>
              <div>{currentPlayer.acquisition} &middot; {currentPlayer.price}</div>
            </div>
          </div>

          {/* Bid Controls */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Participant</label>
              <select
                value={selectedParticipant}
                onChange={(e) => setSelectedParticipant(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select participant...</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.budget.toFixed(1)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Bid Price</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={bidPrice}
                onChange={(e) => setBidPrice(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
              />
            </div>
            <button
              onClick={markSold}
              disabled={!selectedParticipant || !bidPrice}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Sold
            </button>
            <button
              onClick={markUnsold}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Unsold
            </button>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <p className="text-sm text-gray-300 bg-gray-800/40 rounded-lg px-4 py-2">{message}</p>
      )}

      {/* Participant Management */}
      <ParticipantSetup onUpdate={fetchParticipants} />
    </div>
  );
}
