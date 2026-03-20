"use client";

import { useState, useEffect } from "react";
import type { Participant } from "@/types/player";

export default function ParticipantSetup({ onUpdate }: { onUpdate?: () => void }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("120");
  const [error, setError] = useState("");

  const fetchParticipants = async () => {
    const res = await fetch("/api/participants");
    if (res.ok) setParticipants(await res.json());
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const addParticipant = async () => {
    setError("");
    if (!name.trim()) return;

    const res = await fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), budget: parseFloat(budget) || 120 }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }

    setName("");
    setBudget("120");
    fetchParticipants();
    onUpdate?.();
  };

  const removeParticipant = async (id: number) => {
    const res = await fetch(`/api/participants/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    fetchParticipants();
    onUpdate?.();
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Manage Participants</h3>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addParticipant()}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
        />
        <input
          type="number"
          placeholder="Budget"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
        />
        <button
          onClick={addParticipant}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Add
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

      {participants.length > 0 && (
        <div className="space-y-1">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-gray-900/50 rounded px-3 py-2">
              <span className="text-sm text-gray-200">{p.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{p.budget.toFixed(1)}</span>
                <button
                  onClick={() => removeParticipant(p.id)}
                  className="text-gray-500 hover:text-red-400 text-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
