"use client";

import { useState, useEffect, useCallback } from "react";
import AuthProvider, { useAuth } from "./components/AuthProvider";
import AuthScreen from "./components/AuthScreen";
import WelcomeScreen from "./components/WelcomeScreen";
import BottomTabs from "./components/BottomTabs";
import HomeTab from "./components/HomeTab";
import RecipesTab from "./components/RecipesTab";
import PlanTab from "./components/PlanTab";
import MacrosTab from "./components/MacrosTab";
import SnapMeal from "./components/SnapMeal";

type Tab = "home" | "recipes" | "plan" | "macros";

function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    const ua = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIos(ios);

    if (ios) {
      const dismissed = localStorage.getItem("install_dismissed");
      if (!dismissed) setShowBanner(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem("install_dismissed");
      if (!dismissed) setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (isIos || !deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt, isIos]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem("install_dismissed", "1");
  }, []);

  if (isStandalone || !showBanner) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-[440px] z-50
                    bg-white border border-gray-200 rounded-2xl p-4 shadow-xl shadow-black/10
                    animate-[slide-up_0.3s_ease-out]">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center
                   text-gray-400 active:bg-gray-200"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Add ReelRecipe to Home Screen</p>
          {isIos ? (
            <p className="text-xs text-gray-400 mt-0.5">
              Tap <span className="inline-block align-middle">
                <svg className="w-3.5 h-3.5 inline text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </span> then &quot;Add to Home Screen&quot;
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">Install the app for quick access</p>
          )}
        </div>
      </div>

      {!isIos && deferredPrompt && (
        <button
          onClick={handleInstall}
          className="w-full mt-3 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-xl
                     active:bg-blue-600 transition-colors"
        >
          Install App
        </button>
      )}
    </div>
  );
}

function AppShell() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);
  const [showSnapMeal, setShowSnapMeal] = useState(false);

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
        <BottomTabs active={activeTab} onChange={setActiveTab} onCamera={() => setShowSnapMeal(true)} />
        {showSnapMeal && <SnapMeal onClose={() => setShowSnapMeal(false)} />}
        <InstallBanner />
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
