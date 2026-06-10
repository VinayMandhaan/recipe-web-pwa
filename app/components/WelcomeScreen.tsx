"use client";

import { useState, useRef, useEffect } from "react";

function ExtractScene() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 600);
    const t2 = setTimeout(() => setStep(2), 1400);
    const t3 = setTimeout(() => setStep(3), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="relative w-full h-[320px] flex items-center justify-center">
      {/* Floating platform badges */}
      <div className="absolute top-2 left-6 animate-float" style={{ animationDelay: "0s" }}>
        <div className="px-3 py-1.5 bg-white rounded-full shadow-md border border-gray-100 text-xs font-medium text-gray-700 flex items-center gap-1.5">
          <span className="w-4 h-4 bg-black rounded-sm flex items-center justify-center text-[8px] text-white font-bold">T</span>
          TikTok
        </div>
      </div>
      <div className="absolute top-2 right-6 animate-float" style={{ animationDelay: "0.5s" }}>
        <div className="px-3 py-1.5 bg-white rounded-full shadow-md border border-gray-100 text-xs font-medium text-gray-700 flex items-center gap-1.5">
          <span className="w-4 h-4 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-sm" />
          Instagram
        </div>
      </div>
      <div className="absolute top-12 left-1/2 -translate-x-1/2 animate-float" style={{ animationDelay: "1s" }}>
        <div className="px-3 py-1.5 bg-white rounded-full shadow-md border border-gray-100 text-xs font-medium text-gray-700 flex items-center gap-1.5">
          <span className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center">
            <span className="w-0 h-0 border-l-[5px] border-l-white border-y-[3px] border-y-transparent ml-[1px]" />
          </span>
          YouTube
        </div>
      </div>

      {/* Phone mockup */}
      <div className="relative mt-8">
        <div className="w-[140px] h-[220px] bg-white rounded-[20px] shadow-xl border-2 border-gray-200 overflow-hidden">
          {/* Status bar */}
          <div className="h-6 bg-gray-50 flex items-center justify-center">
            <div className="w-12 h-2 bg-gray-200 rounded-full" />
          </div>
          {/* URL bar with typing animation */}
          <div className="mx-2 mt-1 px-2 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
            <div className={`text-[8px] text-blue-600 font-mono overflow-hidden whitespace-nowrap ${step >= 1 ? "animate-typing" : "opacity-0"}`}>
              tiktok.com/recipe...
            </div>
          </div>
          {/* Video thumbnail */}
          <div className="mx-2 mt-2 h-[90px] bg-gradient-to-br from-orange-100 to-amber-50 rounded-lg flex items-center justify-center relative overflow-hidden">
            <span className="text-3xl">🍝</span>
            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                <div className="w-0 h-0 border-l-[8px] border-l-blue-500 border-y-[5px] border-y-transparent ml-1" />
              </div>
            </div>
          </div>
          {/* Caption lines */}
          <div className="mx-2 mt-2 space-y-1">
            <div className="h-2 bg-gray-100 rounded w-full" />
            <div className="h-2 bg-gray-100 rounded w-3/4" />
            <div className="h-2 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className={`mx-4 transition-all duration-500 ${step >= 2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
        <div className="flex items-center gap-1">
          <div className="w-8 h-0.5 bg-blue-400 rounded" />
          <div className="w-0 h-0 border-l-[8px] border-l-blue-400 border-y-[5px] border-y-transparent" />
        </div>
        <div className="text-[9px] text-blue-400 font-medium mt-1 text-center">extract</div>
      </div>

      {/* Recipe card result */}
      <div className={`transition-all duration-700 ${step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="w-[130px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2">
            <div className="text-[10px] text-white/70 font-medium">Recipe extracted</div>
            <div className="text-xs text-white font-bold">Creamy Pasta</div>
          </div>
          <div className="p-2.5 space-y-1.5">
            <div className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide">Ingredients</div>
            {["Pasta 200g", "Cream 100ml", "Garlic 3 cloves", "Parmesan 50g"].map((ing, i) => (
              <div key={i} className={`flex items-center gap-1.5 animate-fade-in-up`} style={{ animationDelay: `${2.4 + i * 0.15}s` }}>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-[9px] text-gray-600">{ing}</span>
              </div>
            ))}
            <div className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide mt-2">Steps</div>
            {["Boil pasta", "Saute garlic", "Add cream"].map((s, i) => (
              <div key={i} className={`flex items-center gap-1.5 animate-fade-in-up`} style={{ animationDelay: `${3.0 + i * 0.15}s` }}>
                <div className="w-3.5 h-3.5 rounded-full bg-blue-50 text-blue-500 text-[8px] flex items-center justify-center font-bold">{i + 1}</div>
                <span className="text-[9px] text-gray-600">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScanScene() {
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setScanned(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full h-[320px] flex items-center justify-center">
      {/* Phone with camera */}
      <div className="relative">
        <div className="w-[160px] h-[260px] bg-white rounded-[24px] shadow-xl border-2 border-gray-200 overflow-hidden">
          {/* Notch */}
          <div className="h-7 bg-gray-50 flex items-center justify-center">
            <div className="w-14 h-3 bg-gray-200 rounded-full" />
          </div>
          {/* Camera viewfinder */}
          <div className="mx-3 mt-1 h-[150px] bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl relative overflow-hidden border border-gray-100">
            {/* Food on plate */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white shadow-inner flex items-center justify-center">
                <div className="text-3xl">🥗</div>
              </div>
            </div>

            {/* Scan corners */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-blue-500 rounded-tl" />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-blue-500 rounded-tr" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-blue-500 rounded-bl" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-blue-500 rounded-br" />

            {/* Scanning line */}
            {!scanned && (
              <div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan-line" />
            )}

            {/* Scanned checkmark */}
            {scanned && (
              <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center animate-fade-in-up">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Snap button */}
          <div className="flex justify-center mt-3">
            <div className="w-12 h-12 rounded-full border-[3px] border-gray-300 flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Nutrition bubbles popping in */}
      {scanned && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 space-y-2.5">
          {[
            { label: "420 cal", color: "bg-green-50 border-green-200 text-green-700", delay: "0.2s", icon: "🔥" },
            { label: "32g protein", color: "bg-blue-50 border-blue-200 text-blue-700", delay: "0.4s", icon: "💪" },
            { label: "45g carbs", color: "bg-amber-50 border-amber-200 text-amber-700", delay: "0.6s", icon: "🌾" },
            { label: "18g fat", color: "bg-red-50 border-red-200 text-red-700", delay: "0.8s", icon: "🫧" },
          ].map((item, i) => (
            <div
              key={i}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 shadow-sm animate-pop-in ${item.color}`}
              style={{ animationDelay: item.delay }}
            >
              <span>{item.icon}</span>
              {item.label}
            </div>
          ))}
          {/* Rating */}
          <div className="animate-pop-in flex justify-center" style={{ animationDelay: "1s" }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col items-center justify-center shadow-lg">
              <span className="text-[7px] text-white/80">Rating</span>
              <span className="text-xs text-white font-bold leading-none">A+</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlannerScene() {
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFilled(prev => {
        if (prev >= 21) { clearInterval(interval); return 21; }
        return prev + 1;
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const meals = [
    ["🥣", "🍳", "🥞", "🥑", "🍞", "🥗", "🥣"],
    ["🍗", "🥪", "🍛", "🥙", "🐟", "🍝", "🥘"],
    ["🥩", "🥗", "🍲", "🌮", "🍣", "🥘", "🍜"],
  ];
  const mealLabels = ["Breakfast", "Lunch", "Dinner"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="relative w-full h-[320px] flex items-center justify-center px-4">
      <div className="w-full max-w-[300px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-sm">Weekly Meal Plan</div>
            <div className="text-white/70 text-[10px]">Personalized for you</div>
          </div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-sm">📅</span>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-8 gap-0 px-2 pt-2">
          <div />
          {days.map(d => (
            <div key={d} className="text-center text-[9px] text-gray-400 font-medium">{d}</div>
          ))}
        </div>

        {/* Meal grid */}
        {mealLabels.map((label, row) => (
          <div key={label} className="grid grid-cols-8 gap-0 px-2 py-1.5 items-center">
            <div className="text-[9px] text-gray-500 font-medium pr-1">{label}</div>
            {meals[row].map((emoji, col) => {
              const idx = row * 7 + col;
              const isVisible = idx < filled;
              return (
                <div key={col} className="flex justify-center">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all duration-300 ${
                    isVisible ? "bg-blue-50 scale-100" : "bg-gray-50 scale-90"
                  }`}>
                    {isVisible ? emoji : ""}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Bottom bar */}
        <div className="px-3 py-2 bg-gray-50 flex items-center justify-between border-t border-gray-100">
          <span className="text-[10px] text-gray-500">{Math.min(filled, 21)}/21 meals planned</span>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((filled / 21) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MacrosScene() {
  const [animate, setAnimate] = useState(false);
  const [loggedMeals, setLoggedMeals] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimate(true), 400);
    const t2 = setTimeout(() => setLoggedMeals(1), 1200);
    const t3 = setTimeout(() => setLoggedMeals(2), 2000);
    const t4 = setTimeout(() => setLoggedMeals(3), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const mealEntries = [
    { name: "Oatmeal with Berries", meal: "Breakfast", cal: 380 },
    { name: "Grilled Chicken Bowl", meal: "Lunch", cal: 520 },
    { name: "Greek Yogurt Snack", meal: "Snack", cal: 180 },
  ];

  return (
    <div className="relative w-full h-[320px] flex items-center justify-center px-4">
      <div className="w-full max-w-[280px]">
        {/* Profile badge */}
        <div className="flex justify-center mb-3">
          <div className="px-3 py-1 bg-blue-50 rounded-full border border-blue-100 text-[10px] text-blue-600 font-medium flex items-center gap-2 animate-fade-in-up">
            <span>👤</span> Active &middot; Maintain &middot; 2,100 cal target
          </div>
        </div>

        {/* Ring */}
        <div className="flex justify-center mb-4">
          <div className="relative w-[130px] h-[130px]">
            <svg width="130" height="130" viewBox="0 0 130 130" className="transform -rotate-90">
              <circle cx="65" cy="65" r="54" stroke="#E2E8F0" strokeWidth="10" fill="none" />
              <circle
                cx="65" cy="65" r="54"
                stroke="#3B82F6" strokeWidth="10" fill="none"
                strokeLinecap="round"
                strokeDasharray="339"
                strokeDashoffset={animate ? "85" : "339"}
                style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">1,580</span>
              <span className="text-[10px] text-gray-400">of 2,100 cal</span>
              <span className="text-[11px] text-blue-500 font-semibold">520 left</span>
            </div>
          </div>
        </div>

        {/* Macro bars */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: "Protein", value: "98/130g", pct: 75, color: "bg-blue-500" },
            { label: "Carbs", value: "180/250g", pct: 72, color: "bg-amber-500" },
            { label: "Fat", value: "52/70g", pct: 74, color: "bg-red-400" },
          ].map((m, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="text-[10px] font-semibold text-gray-700">{m.label}</span>
                <span className="text-[9px] text-gray-400">{m.value}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${m.color}`}
                  style={{
                    width: animate ? `${m.pct}%` : "0%",
                    transition: `width 1.2s ease-out ${0.3 + i * 0.2}s`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Logged meals */}
        <div className="space-y-1.5">
          {mealEntries.map((entry, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm transition-all duration-500 ${
                i < loggedMeals ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
            >
              <div>
                <div className="text-[8px] text-gray-400 font-medium uppercase">{entry.meal}</div>
                <div className="text-[11px] text-gray-800 font-medium">{entry.name}</div>
              </div>
              <span className="text-[11px] text-blue-600 font-bold">{entry.cal} cal</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const slides = [
  {
    scene: <ExtractScene />,
    title: "Extract Recipes Instantly",
    description: "Paste any TikTok, Instagram, or YouTube link and get the full recipe with ingredients and steps.",
  },
  {
    scene: <ScanScene />,
    title: "Snap & Get Nutrition",
    description: "Take a photo of any meal and get an instant breakdown of calories, protein, carbs, fat, and a health rating.",
  },
  {
    scene: <PlannerScene />,
    title: "Plan Your Week",
    description: "Get a personalized weekly meal plan based on your saved recipes and dietary preferences.",
  },
  {
    scene: <MacrosScene />,
    title: "Track Your Macros",
    description: "Set your fitness goals, get personalized targets, and track daily nutrition with an easy macro counter.",
  },
];

export default function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const touchStart = useRef(0);

  function goTo(idx: number) {
    setDirection(idx > current ? "right" : "left");
    setCurrent(idx);
  }

  function next() {
    if (current < slides.length - 1) {
      goTo(current + 1);
    } else {
      onDone();
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && current < slides.length - 1) goTo(current + 1);
      if (diff < 0 && current > 0) goTo(current - 1);
    }
  }

  const slide = slides[current];

  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex justify-center">
      <div
        className="flex flex-col min-h-dvh w-full max-w-[480px] safe-top safe-bottom relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Skip */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onDone}
            className="px-4 py-2 text-sm text-gray-400 font-medium hover:text-gray-600 transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Scene */}
        <div className="flex-1 flex items-center justify-center pt-10" key={current}>
          <div className="animate-fade-in-up w-full">
            {slide.scene}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-10">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3 animate-fade-in-up" key={`t-${current}`}>
            {slide.title}
          </h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed max-w-[320px] mx-auto animate-fade-in-up" key={`d-${current}`} style={{ animationDelay: "0.1s" }}>
            {slide.description}
          </p>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-8 mb-6">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-8 bg-blue-500"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          {/* Button */}
          <button
            onClick={next}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600
                       text-white font-semibold rounded-2xl text-sm shadow-lg shadow-blue-500/25
                       active:scale-[0.98] transition-all"
          >
            {current === slides.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
