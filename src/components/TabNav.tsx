"use client";

const TABS = ["Players", "Auction", "Pool", "Teams", "Leaderboard"] as const;
export type Tab = (typeof TABS)[number];

export default function TabNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1 mb-6 w-fit">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            active === tab
              ? "bg-gray-700 text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
