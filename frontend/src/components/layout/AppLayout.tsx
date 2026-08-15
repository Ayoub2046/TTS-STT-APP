import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, PenLine, ShieldCheck, ListChecks, FileText } from "lucide-react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import NetworkStatus from "./NetworkStatus";
import { useAuthStore } from "@/store/auth";

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();

  const isReviewerOrAdmin = user?.role === "reviewer" || user?.role === "admin";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Drawer */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <TopBar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          <NetworkStatus />
          <Outlet />
        </main>

        {/* Mobile Bottom Quick Navigation Bar (< lg) */}
        <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-white/10 bg-slate-950/90 backdrop-blur-xl px-3 py-2 flex items-center justify-around text-slate-400">
          <NavLink
            to="/contributor/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
                isActive ? "text-indigo-400" : "hover:text-slate-200"
              }`
            }
          >
            <LayoutDashboard size={20} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/contributor/submit"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
                isActive ? "text-indigo-400" : "hover:text-slate-200"
              }`
            }
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <PenLine size={16} />
            </div>
            <span className="text-[10px]">Add</span>
          </NavLink>

          <NavLink
            to="/contributor/contributions"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
                isActive ? "text-indigo-400" : "hover:text-slate-200"
              }`
            }
          >
            <ListChecks size={20} />
            <span>Mine</span>
          </NavLink>

          {isReviewerOrAdmin && (
            <NavLink
              to={user?.role === "admin" ? "/admin/submissions" : "/reviewer/queue"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
                  isActive ? "text-indigo-400" : "hover:text-slate-200"
                }`
              }
            >
              {user?.role === "admin" ? <FileText size={20} /> : <ShieldCheck size={20} />}
              <span>{user?.role === "admin" ? "Submissions" : "Review"}</span>
            </NavLink>
          )}
        </nav>
      </div>
    </div>
  );
}