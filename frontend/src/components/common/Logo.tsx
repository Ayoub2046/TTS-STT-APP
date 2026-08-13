interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-4xl",
  };

  const badgeSizes = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
    xl: "text-base px-3 py-1",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Dynamic Glowing Logo Emblem */}
      <div className={`relative flex shrink-0 items-center justify-center ${iconSizes[size]}`}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 opacity-60 blur-md transition-all duration-300 group-hover:opacity-100" />

        {/* Outer Glass Ring */}
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-white/20 bg-slate-900/90 shadow-xl backdrop-blur-xl">
          {/* Custom Interlocking Dialect Waveform SVG */}
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3/4 w-3/4">
            <defs>
              <linearGradient id="logo-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id="logo-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>

            {/* Left Node (Maay Maay) */}
            <circle cx="14" cy="20" r="9" fill="url(#logo-grad-1)" fillOpacity="0.85" />

            {/* Right Node (Maxaa-tiri) */}
            <circle cx="26" cy="20" r="9" fill="url(#logo-grad-2)" fillOpacity="0.85" />

            {/* Interlocking Parallel Dataset Waveform Bridge */}
            <path
              d="M12 20C14 16 17 16 19 20C21 24 24 24 26 20C27 18 29 18 30 20"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Spark Nodes */}
            <circle cx="20" cy="14" r="2" fill="#ffffff" />
            <circle cx="20" cy="26" r="2" fill="#34d399" />
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight ${textSizes[size]} bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent`}>
              Maay<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Maxaa</span>
            </span>
            <span className={`rounded-md font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 ${badgeSizes[size]}`}>
              DataHub
            </span>
          </div>
          <span className="text-[11px] font-medium tracking-wide text-slate-400">
            Somali Dialect AI Corpus
          </span>
        </div>
      )}
    </div>
  );
}
