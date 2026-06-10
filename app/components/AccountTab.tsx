"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthProvider";
import HistoryTab from "./HistoryTab";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function AccountTab() {
  const { user, signOut } = useAuth();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const name = user?.name || "User";
  const email = user?.email || "";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const checkSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setNotifSupported(true);

    if (!user) return;
    try {
      const res = await fetch(`/api/push?user_id=${user.id}`);
      const d = await res.json();
      setNotifEnabled(d.subscribed || false);
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  async function toggleNotifications() {
    if (!user || notifLoading) return;
    setNotifLoading(true);
    setNotifError(null);

    try {
      if (notifEnabled) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();

        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id }),
        });
        setNotifEnabled(false);
      } else {
        if (!VAPID_PUBLIC_KEY) {
          setNotifError("Push not configured. VAPID key missing.");
          setNotifLoading(false);
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission === "denied") {
          setNotifError("Notifications blocked. Enable them in browser settings.");
          setNotifLoading(false);
          return;
        }
        if (permission !== "granted") {
          setNotifLoading(false);
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const res = await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            subscription: sub.toJSON(),
          }),
        });

        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setNotifError(d.error || "Could not save subscription");
          setNotifLoading(false);
          return;
        }

        setNotifEnabled(true);
      }
    } catch (err) {
      console.error("Notification toggle error:", err);
      setNotifError(String(err instanceof Error ? err.message : err));
    } finally {
      setNotifLoading(false);
    }
  }

  if (showHistory) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
          <button
            onClick={() => setShowHistory(false)}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-gray-900">History</h2>
        </div>
        <HistoryTab />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-5 pt-4 space-y-3">
        {/* Profile card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900 truncate">{name}</p>
            <p className="text-sm text-gray-400 truncate">{email}</p>
          </div>
        </div>

        {/* Menu items */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          {/* History */}
          <button
            onClick={() => setShowHistory(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between active:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700">History</span>
            </div>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Notifications toggle */}
          <div className="px-4 py-3.5 flex items-center justify-between border-t border-gray-100">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div>
                <span className="text-sm text-gray-700">Meal reminders</span>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {notifSupported
                    ? "Get notified when it's time to cook"
                    : "Not supported on this browser"}
                </p>
              </div>
            </div>
            {notifSupported ? (
              <button
                onClick={toggleNotifications}
                disabled={notifLoading}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  notifEnabled ? "bg-blue-500" : "bg-gray-300"
                } ${notifLoading ? "opacity-50" : ""}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    notifEnabled ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            ) : (
              <span className="text-[10px] text-gray-400">Unavailable</span>
            )}
          </div>
          {notifError && (
            <div className="px-4 pb-3">
              <p className="text-[11px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{notifError}</p>
            </div>
          )}

          {/* App info */}
          {[
            { label: "App version", value: "1.0.0", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          ].map((item) => (
            <div
              key={item.label}
              className="px-4 py-3.5 flex items-center justify-between border-t border-gray-100"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <span className="text-sm text-gray-400">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-3.5
                     text-red-500 text-sm font-medium active:bg-red-100 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
