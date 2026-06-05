"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import RecipeDetail from "./RecipeDetail";

interface HistoryItem {
  id: string;
  source_url: string | null;
  platform: string | null;
  dish: string | null;
  stage: string | null;
  caption: string | null;
  result: {
    dish: string;
    ingredients: string[];
    steps: string[];
    confidence: string;
    note?: string;
  } | null;
  searched_at: string;
}

const STAGE_COLORS: Record<string, string> = {
  caption: "bg-green-500",
  blog: "bg-blue-500",
  transcript: "bg-purple-500",
  fallback: "bg-[#3a3a4a]",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function HistoryTab() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/history?user_id=${user.id}`)
      .then((r) => r.json())
      .then((d) => setHistory(d.history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-[#f0f0f5]">History</h1>
          <p className="text-sm text-[#55556a] mt-1">
            {history.length > 0 ? `${history.length} extractions` : "Your recent extractions"}
          </p>
        </div>

        {loading ? (
          <div className="px-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4 space-y-2">
                <div className="h-4 shimmer rounded w-3/4" />
                <div className="h-3 shimmer rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-8 pt-20">
            <div className="w-16 h-16 rounded-2xl bg-[#16161e] border border-[#2a2a3a] flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-[#3a3a4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-[#55556a]">No history yet</p>
            <p className="text-xs text-[#3a3a4a] mt-1">Extracted recipes will appear here</p>
          </div>
        ) : (
          <div className="px-5 pb-6 space-y-3">
            {history.map((item) => {
              const hasRecipe = item.result && item.stage !== "fallback";
              const dotColor = STAGE_COLORS[item.stage || "fallback"] || "bg-[#3a3a4a]";

              return (
                <button
                  key={item.id}
                  onClick={() => hasRecipe && setSelected(item)}
                  disabled={!hasRecipe}
                  className={`w-full bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4 text-left
                              transition-colors ${hasRecipe ? "active:bg-[#1e1e2a]" : "opacity-60"}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Status dot */}
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#f0f0f5] truncate">
                        {item.dish || "No recipe found"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.platform && (
                          <span className="text-[10px] text-[#55556a] capitalize">{item.platform}</span>
                        )}
                        <span className="text-[10px] text-[#3a3a4a]">
                          {timeAgo(item.searched_at)}
                        </span>
                      </div>
                    </div>
                    {hasRecipe && (
                      <svg className="w-4 h-4 text-[#3a3a4a] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && selected.result && (
        <RecipeDetail
          dish={selected.result.dish}
          ingredients={selected.result.ingredients}
          steps={selected.result.steps}
          stage={selected.stage || undefined}
          platform={selected.platform || undefined}
          source_url={selected.source_url || undefined}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
