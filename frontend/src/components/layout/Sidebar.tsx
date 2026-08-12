import { NavLink } from "react-router-dom";
import { Languages, LayoutDashboard, PenLine, ListChecks, ShieldCheck, Users, Rocket, CloudUpload } from "lucide-react";
import { useAuthStore } from "@/store/auth";

const links = [
  { to: "/contributor/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["contributor"] },
  { to: "/contributor/submit", icon: PenLine, label: "Add Translation", roles: ["contributor"] },
  { to: "/contributor/contributions", icon: ListChecks, label: "My Contributions", roles: ["contributor"] },
  { to: "/reviewer/queue", icon: ShieldCheck, label: "Review Queue", roles: ["reviewer", "admin"] },
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Admin", roles: ["admin"] },
  { to: "/admin/users", icon: Users, label: "Users", roles: ["admin"] },
  { to: "/admin/huggingface", icon: CloudUpload, label: "Hugging Face", roles: ["admin"] },
];

export default function Sidebar() {
  const { user } = useAuthStore();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-white/10 bg-white/[0.02] backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
          <Languages size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold">MaayMaxaa</p>
          <p className="text-xs text-slate-400">DataHub</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links
          .filter((l) => !user || l.roles.includes(user.role))
          .map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-500/15 text-indigo-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`
              }
            >
              <l.icon size={18} />
              {l.label}
            </NavLink>
          ))}
      </nav>

      <div className="border-t border-white/10 p-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Rocket size={14} className="text-emerald-400" />
          Somali AI Research
        </div>
        <p className="mt-1">Maay ↔ Maxaa parallel corpus</p>
      </div>
    </aside>
  );
}