import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function TopBar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/10 bg-base/70 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        Maay ↔ Maxaa Translation Platform
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
          <User size={14} className="text-indigo-300" />
          <span className="capitalize">{user?.full_name ?? user?.email}</span>
          <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[10px] uppercase text-indigo-300">
            {user?.role}
          </span>
        </div>
        <button onClick={handleLogout} className="btn-ghost" title="Log out">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}