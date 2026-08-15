import { useNavigate } from "react-router-dom";
import { LogOut, User, Menu } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import Logo from "@/components/common/Logo";

interface TopBarProps {
  onOpenMobileMenu?: () => void;
}

export default function TopBar({ onOpenMobileMenu }: TopBarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-xl">
      {/* Left: Mobile Menu Button & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Logo */}
        <div className="lg:hidden">
          <Logo size="sm" />
        </div>

        {/* Desktop Title Tag */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Maay ↔ Maxaa Somali AI Data Platform
        </div>
      </div>

      {/* Right: User Avatar & Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm">
          <User size={14} className="text-indigo-300 shrink-0" />
          <span className="capitalize font-medium text-slate-200 max-w-[100px] sm:max-w-[160px] truncate">
            {user?.full_name ?? user?.email?.split("@")[0]}
          </span>
          <span className="hidden sm:inline-block rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[10px] uppercase font-bold text-indigo-300">
            {user?.role}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="btn-ghost p-2 text-slate-400 hover:text-rose-300"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}