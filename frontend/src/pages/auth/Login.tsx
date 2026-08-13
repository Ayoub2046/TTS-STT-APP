import { FormEvent, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { authService } from "@/services";
import { ApiError } from "@/services/api";
import Logo from "@/components/common/Logo";

export default function Login() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login({ email, password });
      setAuth(res.data.user, res.data.token);
      const dest = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      const homeByRole: Record<string, string> = {
        admin: "/admin/dashboard",
        reviewer: "/reviewer/queue",
        contributor: "/contributor/dashboard",
      };
      navigate(dest ?? homeByRole[res.data.user.role] ?? "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-4">
      <div className="glass w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo size="lg" />
          <p className="text-sm text-slate-400">Sign in to your account</p>
        </div>

        {error && <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          No account?{" "}
          <Link to="/register" className="text-indigo-300 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}