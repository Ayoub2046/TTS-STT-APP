import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import NetworkStatus from "./NetworkStatus";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-base">
      <Sidebar />
      <div className="pl-64">
        <TopBar />
        <main className="p-6">
          <NetworkStatus />
          <Outlet />
        </main>
      </div>
    </div>
  );
}