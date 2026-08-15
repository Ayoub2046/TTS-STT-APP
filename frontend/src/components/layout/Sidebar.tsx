import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PenLine,
  ListChecks,
  ShieldCheck,
  Users,
  Rocket,
  CloudUpload,
  FileText,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import Logo from "@/components/common/Logo";

export const navLinks = [
  { to: "/contributor/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["contributor"] },
  { to: "/contributor/submit", icon: PenLine, label: "Add Translation", roles: ["contributor"] },
  { to: "/contributor/contributions", icon: ListChecks, label: "My Contributions", roles: ["contributor"] },
  { to: "/reviewer/queue", icon: ShieldCheck, label: "Review Queue", roles: ["reviewer", "admin"] },
  { to: "/admin/submissions", icon: FileText, label: "All Submissions", roles: ["admin", "reviewer"] },
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Admin Dashboard", roles: ["admin"] },
  { to: "/admin/users", icon: Users, label: "Users", roles: ["admin"] },
  { to: "/admin/huggingface", icon: CloudUpload, label: "Hugging Face", roles: ["admin"] },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user } = useAuthStore();

  const userLinks = navLinks.filter((l) => !user || l.roles.includes(user.role));

  const content = (
    <div className="flex h-full flex-col bg-slate-900/95 border-r border-white/10 backdrop-blur-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <Logo size="sm" />
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {userLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-500/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`
            }
          >
            <l.icon size={18} className="shrink-0" />
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="border-t border-white/10 p-4 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-medium text-slate-300">
          <Rocket size={14} className="text-emerald-400 shrink-0" />
          Somali AI Research
        </div>
        <p className="mt-1 text-[11px] text-slate-500">Maay ↔ Maxaa parallel corpus</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        {content}
      </aside>

      {/* Mobile Sidebar Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          {/* Drawer Slide-in Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl transition-transform">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}