import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { authService } from "@/services";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ContributorDashboard from "@/pages/contributor/Dashboard";
import SubmitTranslation from "@/pages/contributor/SubmitTranslation";
import MyContributions from "@/pages/contributor/MyContributions";
import ReviewQueue from "@/pages/reviewer/ReviewQueue";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminHuggingFace from "@/pages/admin/HuggingFace";

export default function App() {
  const { user, token, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      authService
        .me()
        .then((res) => setUser(res.data))
        .catch(() => logout());
    }
  }, [token, user, setUser, logout]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/contributor/dashboard" element={<ContributorDashboard />} />
          <Route path="/contributor/submit" element={<SubmitTranslation />} />
          <Route path="/contributor/contributions" element={<MyContributions />} />
          <Route path="/reviewer/queue" element={<ReviewQueue />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/huggingface" element={<AdminHuggingFace />} />
        </Route>
      </Route>
    </Routes>
  );
}

function Home() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const homeByRole: Record<string, string> = {
      admin: "/admin/dashboard",
      reviewer: "/reviewer/queue",
      contributor: "/contributor/dashboard",
    };
    navigate(homeByRole[user.role] ?? "/login", { replace: true });
  }, [user, navigate]);

  return null;
}