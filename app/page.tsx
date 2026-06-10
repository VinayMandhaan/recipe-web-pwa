"use client";

import { useState, useEffect } from "react";
import AuthProvider, { useAuth } from "./components/AuthProvider";
import AuthScreen from "./components/AuthScreen";
import WelcomeScreen from "./components/WelcomeScreen";
import BottomTabs from "./components/BottomTabs";
import HomeTab from "./components/HomeTab";
import RecipesTab from "./components/RecipesTab";
import PlanTab from "./components/PlanTab";
import MacrosTab from "./components/MacrosTab";
import HistoryTab from "./components/HistoryTab";
import AccountTab from "./components/AccountTab";

type Tab = "home" | "recipes" | "plan" | "macros" | "history" | "account";

function AppShell() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    setShowWelcome(!localStorage.getItem("onboarded"));
  }, []);

  if (showWelcome === null) {
    return (
      <div className="h-dvh bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex justify-center">
        <div className="flex flex-col items-center justify-center h-full w-full max-w-[480px]">
          <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (showWelcome) {
    return (
      <WelcomeScreen
        onDone={() => {
          localStorage.setItem("onboarded", "1");
          setShowWelcome(false);
        }}
      />
    );
  }

  // Loading splash
  if (loading) {
    return (
      <div className="h-dvh bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex justify-center">
        <div className="flex flex-col items-center justify-center h-full w-full max-w-[480px]">
          <svg width="64" height="64" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="splash-bg" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3B82F6" />
                <stop offset="1" stopColor="#1D4ED8" />
              </linearGradient>
            </defs>
            <rect width="72" height="72" rx="18" fill="url(#splash-bg)" />
            <rect x="20" y="12" width="26" height="42" rx="5" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.9" />
            <line x1="29" y1="49" x2="39" y2="49" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
            <path d="M29 27 L29 39 L39 33 Z" fill="white" fillOpacity="0.9" />
            <g transform="translate(48, 20)">
              <path d="M2 0 L2 8 M5.5 0 L5.5 8 M9 0 L9 8 M0.5 8 Q0.5 12 5.5 12 Q10.5 12 10.5 8 M5.5 12 L5.5 28"
                stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeOpacity="0.85" />
            </g>
          </svg>
          <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mt-6" />
        </div>
      </div>
    );
  }

  // Auth gate
  if (!user) return <AuthScreen />;

  return (
    <div className="h-dvh bg-gray-50 flex justify-center">
      <div className="flex flex-col h-full w-full max-w-[480px] bg-white relative
                      lg:border-x lg:border-gray-200 lg:shadow-xl safe-top">
        {activeTab === "home" && <HomeTab />}
        {activeTab === "recipes" && <RecipesTab />}
        {activeTab === "plan" && <PlanTab />}
        {activeTab === "macros" && <MacrosTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "account" && <AccountTab />}
        <BottomTabs active={activeTab} onChange={setActiveTab} />
      </div>
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
