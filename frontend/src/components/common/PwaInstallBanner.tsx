import { useState, useEffect } from "react";
import { Download, X, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setShowBanner(false);
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      console.log("User accepted the PWA install prompt");
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-5 right-5 left-5 md:left-auto md:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="glass p-4 rounded-2xl border border-indigo-500/30 bg-slate-900/95 backdrop-blur-xl shadow-2xl flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
          <Sparkles className="h-5 w-5 text-white" />
        </div>

        <div className="flex-1 space-y-1">
          <h4 className="text-xs font-semibold text-slate-100">Install MaayMaxaa App</h4>
          <p className="text-[11px] text-slate-400 leading-tight">
            Install on your mobile or desktop device for quick access & offline support.
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs transition"
            >
              Later
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowBanner(false)}
          className="text-slate-500 hover:text-slate-300 p-1 rounded-md transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
