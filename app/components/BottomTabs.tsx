"use client";

type Tab = "home" | "recipes" | "plan" | "macros";

const tabs: { key: Tab | "camera"; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    key: "home",
    label: "Home",
    icon: (a) => (
      <svg className="w-6 h-6" fill={a ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 1.5}
          d={a
            ? "M12 3l9 8h-3v9h-5v-5h-2v5H6v-9H3l9-8z"
            : "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          }
        />
      </svg>
    ),
  },
  {
    key: "recipes",
    label: "Recipes",
    icon: (a) => (
      <svg className="w-6 h-6" fill={a ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    key: "camera",
    label: "Scan",
    icon: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: "plan",
    label: "Plan",
    icon: (a) => (
      <svg className="w-6 h-6" fill={a ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 1.5}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    key: "macros",
    label: "Macros",
    icon: (a) => (
      <svg className="w-6 h-6" fill={a ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 0 : 1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

export default function BottomTabs({
  active,
  onChange,
  onCamera,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  onCamera: () => void;
}) {
  return (
    <nav className="bg-white/80 backdrop-blur-xl border-t border-gray-200 safe-bottom relative">
      <div className="flex items-center justify-around px-1 pt-2 pb-1">
        {tabs.map((tab) => {
          if (tab.key === "camera") {
            return (
              <button
                key="camera"
                onClick={onCamera}
                className="flex flex-col items-center -mt-7"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center
                                shadow-lg shadow-blue-500/30 text-white active:scale-95 transition-transform border-4 border-white">
                  {tab.icon(false)}
                </div>
                <span className="text-[9px] font-medium text-gray-400 mt-0.5">{tab.label}</span>
              </button>
            );
          }

          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key as Tab)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors min-w-[50px]
                ${isActive ? "text-blue-500" : "text-gray-400"}`}
            >
              {tab.icon(isActive)}
              <span className="text-[9px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
