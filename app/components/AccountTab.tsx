"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthProvider";

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

  const name = user?.name || "User";
  const email = user?.email || "";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Check if push is supported and if user is subscribed
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

    try {
      if (notifEnabled) {
        // Unsubscribe
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
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setNotifLoading(false);
          return;
        }

        // Subscribe
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            subscription: sub.toJSON(),
          }),
        });
        setNotifEnabled(true);
      }
    } catch (err) {
      console.error("Notification toggle error:", err);
    } finally {
      setNotifLoading(false);
    }
  }

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

        {/* Settings */}
        <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl overflow-hidden">
          {/* Notifications toggle */}
          {notifSupported && (
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#55556a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <div>
                  <span className="text-sm text-[#c0c0d0]">Meal reminders</span>
                  <p className="text-[10px] text-[#3a3a4a] mt-0.5">
                    Get notified when it's time to cook
                  </p>
                </div>
              </div>
              <button
                onClick={toggleNotifications}
                disabled={notifLoading}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  notifEnabled ? "bg-orange-500" : "bg-[#2a2a3a]"
                } ${notifLoading ? "opacity-50" : ""}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    notifEnabled ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          )}

          {/* App info */}
          {[
            { label: "App version", value: "1.0.0", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Theme", value: "Dark", icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" },
          ].map((item) => (
            <div
              key={item.label}
              className="px-4 py-3.5 flex items-center justify-between border-t border-[#2a2a3a]"
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
