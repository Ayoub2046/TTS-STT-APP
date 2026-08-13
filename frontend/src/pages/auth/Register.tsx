import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/services";
import { ApiError } from "@/services/api";
import Logo from "@/components/common/Logo";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    nativeLanguage: "other",
    experienceLevel: "learner",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        nativeLanguage: form.nativeLanguage,
        experienceLevel: form.experienceLevel,
      });
      setSuccess(res.message + " Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-4">
      <div className="glass w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo size="lg" />
          <p className="text-sm text-slate-400">Help build the Maay ↔ Maxaa corpus</p>
        </div>

        {error && <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
        {success && <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{success}</p>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.fullName} onChange={set("fullName")} required placeholder="Ayuub Aadan" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={set("email")} required placeholder="you@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Native Language</label>
              <select className="input" value={form.nativeLanguage} onChange={set("nativeLanguage")}>
                <option value="maay">Maay</option>
                <option value="maxaa">Maxaa</option>
                <option value="bilingual">Bilingual</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Experience</label>
              <select className="input" value={form.experienceLevel} onChange={set("experienceLevel")}>
                <option value="learner">Learner</option>
                <option value="native">Native speaker</option>
                <option value="translator">Translator</option>
                <option value="reviewer">Reviewer</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={set("password")} required minLength={8} placeholder="At least 8 characters" />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input className="input" type="password" value={form.confirmPassword} onChange={set("confirmPassword")} required placeholder="Repeat password" />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already registered?{" "}
          <Link to="/login" className="text-indigo-300 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}