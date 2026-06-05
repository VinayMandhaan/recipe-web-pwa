"use client";

import { useState } from "react";
import ShoppingList from "./ShoppingList";

interface RecipeDetailProps {
  dish: string;
  ingredients: string[];
  steps: string[];
  stage?: string;
  platform?: string;
  source_url?: string;
  confidence?: string;
  onClose: () => void;
  onDelete?: () => void;
}

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  caption: { label: "From caption", color: "bg-green-500/15 text-green-400" },
  blog: { label: "From blog", color: "bg-blue-500/15 text-blue-400" },
  transcript: { label: "From audio", color: "bg-purple-500/15 text-purple-400" },
  fallback: { label: "Fallback", color: "bg-white/5 text-[#55556a]" },
};

export default function RecipeDetail({
  dish, ingredients, steps, stage, platform, source_url, onClose, onDelete,
}: RecipeDetailProps) {
  const [showShoppingList, setShowShoppingList] = useState(false);
  const stageInfo = stage ? STAGE_LABELS[stage] : null;

  function handleShare() {
    let text = `${dish}\n\n`;
    text += `Ingredients:\n`;
    text += ingredients.map((i) => `- ${i}`).join("\n");
    if (steps.length > 0) {
      text += `\n\nSteps:\n`;
      text += steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
    }
    if (source_url) text += `\n\nSource: ${source_url}`;

    if (navigator.share) {
      navigator.share({ title: dish, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Copied!"));
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col safe-top safe-bottom">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a2a3a]">
          <button onClick={onClose} className="p-1 -ml-1 text-[#8888a0] active:text-[#f0f0f5]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-[#f0f0f5] truncate flex-1">{dish}</h1>
          {onDelete && (
            <button onClick={onDelete} className="p-1 text-red-400/60 active:text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="px-5 py-5 space-y-5">
            {/* Badges */}
            <div className="flex items-center gap-2">
              {stageInfo && (
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${stageInfo.color}`}>
                  {stageInfo.label}
                </span>
              )}
              {platform && (
                <span className="text-[10px] text-[#55556a] capitalize">{platform}</span>
              )}
            </div>

            {/* Ingredients */}
            <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-5">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a] mb-3">
                Ingredients
              </h3>
              <ul className="space-y-2">
                {ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#c0c0d0]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps */}
            {steps.length > 0 && (
              <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-5">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#55556a] mb-3">
                  Steps
                </h3>
                <ol className="space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-[#c0c0d0]">
                      <span className="text-orange-500 font-bold shrink-0 w-5 text-right">{i + 1}</span>
                      <span className="flex-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Source link */}
            {source_url && (
              <a
                href={source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-orange-500 font-medium"
              >
                Open original reel
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-5 py-4 border-t border-[#2a2a3a] flex gap-3">
          <button
            onClick={() => setShowShoppingList(true)}
            className="flex-1 py-3 bg-orange-500/10 text-orange-500 font-medium rounded-xl text-sm
                       active:bg-orange-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Shopping List
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-3 bg-white/5 text-[#8888a0] font-medium rounded-xl text-sm
                       active:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>
      </div>

      {showShoppingList && (
        <ShoppingList
          ingredients={ingredients}
          dish={dish}
          onClose={() => setShowShoppingList(false)}
        />
      )}
    </>
  );
}
