"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
}

function storageKey(dish: string) {
  return `rr_shop_${dish.toLowerCase().replace(/\s+/g, "_")}`;
}

function mergeIngredients(ingredients: string[]): ShoppingItem[] {
  const seen = new Map<string, string>();
  for (const ing of ingredients) {
    const key = ing.toLowerCase().replace(/\s+/g, " ").trim();
    if (!key) continue;
    if (!seen.has(key)) seen.set(key, ing.trim());
  }
  return Array.from(seen.values()).map((text, i) => ({
    id: `item-${i}`,
    text,
    checked: false,
  }));
}

function loadItems(dish: string, ingredients: string[]): ShoppingItem[] {
  try {
    const stored = localStorage.getItem(storageKey(dish));
    if (stored) {
      const parsed = JSON.parse(stored) as ShoppingItem[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // corrupted, fall through
  }
  return mergeIngredients(ingredients);
}

export default function ShoppingList({
  ingredients,
  dish,
  onClose,
}: {
  ingredients: string[];
  dish: string;
  onClose: () => void;
}) {
  const [items, setItems] = useState<ShoppingItem[]>(() => loadItems(dish, ingredients));
  const [newItem, setNewItem] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist to localStorage on every change
  const persist = useCallback(
    (updated: ShoppingItem[]) => {
      try {
        localStorage.setItem(storageKey(dish), JSON.stringify(updated));
      } catch {
        // storage full, ignore
      }
    },
    [dish]
  );

  function toggleItem(id: string) {
    setItems((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
      persist(updated);
      return updated;
    });
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      persist(updated);
      return updated;
    });
  }

  function addItem() {
    const text = newItem.trim();
    if (!text) return;
    setItems((prev) => {
      const updated = [...prev, { id: `item-${Date.now()}`, text, checked: false }];
      persist(updated);
      return updated;
    });
    setNewItem("");
    inputRef.current?.focus();
  }

  function handleShare() {
    const unchecked = items.filter((i) => !i.checked);
    const checked = items.filter((i) => i.checked);
    let text = `Shopping list: ${dish}\n\n`;
    text += unchecked.map((i) => `[ ] ${i.text}`).join("\n");
    if (checked.length > 0) {
      text += "\n\nAlready have:\n";
      text += checked.map((i) => `[x] ${i.text}`).join("\n");
    }
    if (navigator.share) {
      navigator.share({ title: `Shopping list: ${dish}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Copied!"));
    }
  }

  const uncheckedCount = items.filter((i) => !i.checked).length;
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex justify-center">
    <div className="flex flex-col w-full max-w-[480px] bg-white
                    lg:border-x lg:border-gray-200">
      {/* Header */}
      <div className="glass border-b border-gray-200 px-4 py-3 flex items-center justify-between safe-top">
        <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-sm font-medium flex items-center gap-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h2 className="font-semibold text-gray-900 text-base">Shopping List</h2>
        <button onClick={handleShare} className="text-gray-500 hover:text-gray-900">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <p className="text-xs text-gray-500">{uncheckedCount} item{uncheckedCount !== 1 ? "s" : ""} left</p>
        {checkedCount > 0 && <p className="text-xs text-green-500">{checkedCount} done</p>}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3">
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                item.checked ? "bg-gray-50" : "bg-white border border-gray-100"
              }`}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all ${
                  item.checked ? "bg-green-500 border-green-500" : "border-gray-300"
                }`}
              >
                {item.checked && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-sm ${item.checked ? "line-through text-gray-400" : "text-gray-700"}`}>
                {item.text}
              </span>
              <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Add item */}
      <div className="glass border-t border-gray-200 px-4 py-3 safe-bottom">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Add an item..."
            className="flex-1 min-w-0 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                       focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50
                       placeholder:text-gray-400"
          />
          <button
            onClick={addItem}
            disabled={!newItem.trim()}
            className="px-5 py-2.5 gradient-accent text-white font-medium rounded-xl text-sm
                       active:opacity-80 transition-opacity disabled:opacity-30 shrink-0"
          >
            Add
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
