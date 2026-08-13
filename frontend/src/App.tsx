import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { authService } from "@/services";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import LandingPage from "@/pages/Landing";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ContributorDashboard from "@/pages/contributor/Dashboard";
import SubmitTranslation from "@/pages/contributor/SubmitTranslation";
import MyContributions from "@/pages/contributor/MyContributions";
import ReviewQueue from "@/pages/reviewer/ReviewQueue";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminHuggingFace from "@/pages/admin/HuggingFace";
import AdminSubmissions from "@/pages/admin/Submissions";

import PwaInstallBanner from "@/components/common/PwaInstallBanner";

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
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/contributor/dashboard" element={<ContributorDashboard />} />
            <Route path="/contributor/submit" element={<SubmitTranslation />} />
            <Route path="/contributor/contributions" element={<MyContributions />} />
            <Route path="/reviewer/queue" element={<ReviewQueue />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/submissions" element={<AdminSubmissions />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/huggingface" element={<AdminHuggingFace />} />
          </Route>
        </Route>
      </Routes>
      <PwaInstallBanner />
    </>
  );
}