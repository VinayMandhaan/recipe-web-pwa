"use client";

import { useState } from "react";
import AuthProvider, { useAuth } from "./components/AuthProvider";
import AuthScreen from "./components/AuthScreen";
import BottomTabs from "./components/BottomTabs";
import HomeTab from "./components/HomeTab";
import RecipesTab from "./components/RecipesTab";
import PlanTab from "./components/PlanTab";
import HistoryTab from "./components/HistoryTab";
import AccountTab from "./components/AccountTab";

type Tab = "home" | "recipes" | "plan" | "history" | "account";

function AppShell() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");

  // Loading splash
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh bg-[#0a0a0f]">
        <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mb-4">
          <span className="text-3xl">🍳</span>
        </div>
        <div className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mt-4" />
      </div>
    );
  }

  // Auth gate
  if (!user) return <AuthScreen />;

  return (
    <div className="flex flex-col h-dvh bg-[#0a0a0f] safe-top">
      {activeTab === "home" && <HomeTab />}
      {activeTab === "recipes" && <RecipesTab />}
      {activeTab === "plan" && <PlanTab />}
      {activeTab === "history" && <HistoryTab />}
      {activeTab === "account" && <AccountTab />}
      <BottomTabs active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
