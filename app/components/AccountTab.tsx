"use client";

import { useAuth } from "./AuthProvider";

export default function AccountTab() {
  const { user, signOut } = useAuth();

  const name = user?.name || "User";
  const email = user?.email || "";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-[#f0f0f5]">Account</h1>
      </div>

      <div className="px-5 space-y-3">
        {/* Profile card */}
        <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full gradient-accent flex items-center justify-center">
            <span className="text-lg font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-[#f0f0f5] truncate">{name}</p>
            <p className="text-sm text-[#55556a] truncate">{email}</p>
          </div>
        </div>

        {/* Menu items */}
        <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl overflow-hidden">
          {[
            { label: "App version", value: "1.0.0", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Theme", value: "Dark", icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" },
          ].map((item, i) => (
            <div
              key={item.label}
              className={`px-4 py-3.5 flex items-center justify-between ${
                i > 0 ? "border-t border-[#2a2a3a]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#55556a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span className="text-sm text-[#c0c0d0]">{item.label}</span>
              </div>
              <span className="text-sm text-[#55556a]">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3.5
                     text-red-400 text-sm font-medium active:bg-red-500/20 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
