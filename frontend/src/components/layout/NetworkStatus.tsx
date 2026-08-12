import { useEffect, useState } from "react";
import { useOfflineQueue, syncOfflineQueue } from "@/lib/offlineQueue";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function NetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const queue = useOfflineQueue((s) => s.queue);
  const lastError = useOfflineQueue((s) => s.lastError);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (online && queue.length > 0) {
      setSyncing(true);
      syncOfflineQueue().finally(() => setSyncing(false));
    }
  }, [online, queue.length]);

  if (online && queue.length === 0) return null;

  return (
    <div
      className={`mb-6 flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
        online
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
      }`}
    >
      <div className="flex items-center gap-2">
        {online ? <Wifi size={16} /> : <WifiOff size={16} />}
        {online ? (
          <span>
            Syncing {queue.length} offline translation{queue.length > 1 ? "s" : ""}...
          </span>
        ) : (
          <span>
            You are offline. {queue.length} translation{queue.length !== 1 ? "s" : ""} saved locally and will
            sync automatically when you reconnect.
          </span>
        )}
        {lastError && <span className="text-rose-400">{lastError}</span>}
      </div>
      {online && (
        <button onClick={() => { setSyncing(true); syncOfflineQueue().finally(() => setSyncing(false)); }} className="btn-ghost px-2 py-1 text-xs" disabled={syncing}>
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} /> Sync now
        </button>
      )}
    </div>
  );
}