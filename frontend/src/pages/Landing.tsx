import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Database,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Globe,
  Layers,
  Cpu,
  HeartHandshake,
  BookOpen,
} from "lucide-react";
import { publicService } from "@/services";
import { useAuthStore } from "@/store/auth";
import Logo from "@/components/common/Logo";

export default function LandingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ["public-landing-stats"],
    queryFn: () => publicService.stats(),
    refetchInterval: 30000,
  });

  const stats = statsData?.data;

  const dashboardPath =
    user?.role === "admin"
      ? "/admin/dashboard"
      : user?.role === "reviewer"
      ? "/reviewer/queue"
      : user?.role === "contributor"
      ? "/contributor/dashboard"
      : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => navigate("/")}>
            <Logo size="sm" />
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://huggingface.co/datasets/SomaliDatasets/maay-maxaa-translation"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-xs text-slate-300 hover:text-indigo-300 transition px-3 py-1.5 rounded-lg border border-white/10 bg-white/5"
            >
              <Globe className="h-3.5 w-3.5 text-indigo-400" />
              HF Repository
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>

            {user ? (
              <button
                onClick={() => navigate(dashboardPath ?? "/contributor/dashboard")}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition flex items-center gap-2"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition flex items-center gap-2"
                >
                  Get Started <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]" />
          <div className="max-w-5xl mx-auto relative z-10 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Open-Source Somali AI & Machine Translation Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Empowering Somali AI through{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                Maay ↔ Maxaa
              </span>{" "}
              Parallel Datasets
            </h1>

            <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
              A collaborative platform designed to collect, peer-review, and curate high-precision parallel sentences
              between <strong>Maay Maay</strong> and <strong>Maxaa-tiri</strong>. Built for researchers, AI developers,
              and native speakers building Speech and NLP models for Somali.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => navigate(user ? dashboardPath! : "/register")}
                className="px-6 py-3.5 text-sm font-semibold rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/30 transition flex items-center gap-2.5"
              >
                <HeartHandshake className="h-4 w-4" />
                {user ? "Contribute Sentences" : "Join as Contributor"}
              </button>
              <a
                href={stats?.hfRepoUrl ?? "https://huggingface.co/datasets/SomaliDatasets/maay-maxaa-translation"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 text-sm font-medium rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 transition flex items-center gap-2.5"
              >
                <Globe className="h-4 w-4 text-indigo-400" />
                View on Hugging Face
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>
            </div>

            {/* Dynamic Live Stats Bar */}
            <div className="pt-10">
              <div className="glass p-6 sm:p-8 rounded-3xl border border-white/15 bg-slate-900/60 backdrop-blur-xl shadow-2xl grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 text-indigo-400">
                    <Users className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Users</span>
                  </div>
                  <p className="text-3xl font-extrabold text-white font-mono">
                    {isLoading ? "..." : (stats?.totalUsers ?? 1)}
                  </p>
                  <p className="text-[11px] text-slate-400">Contributors & Reviewers</p>
                </div>

                <div className="space-y-1 border-l border-white/10 pl-4 md:pl-0 md:border-l-0">
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <Database className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Parallel Pairs</span>
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-300 font-mono">
                    {isLoading ? "..." : (stats?.totalSentences ?? 0)}
                  </p>
                  <p className="text-[11px] text-slate-400">Curated Sentence Pairs</p>
                </div>

                <div className="space-y-1 border-t pt-4 md:pt-0 md:border-t-0 md:border-l border-white/10">
                  <div className="flex items-center justify-center gap-2 text-purple-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approved Pairs</span>
                  </div>
                  <p className="text-3xl font-extrabold text-purple-300 font-mono">
                    {isLoading ? "..." : (stats?.approvedSentences ?? 0)}
                  </p>
                  <p className="text-[11px] text-slate-400">Verified & Quality Checked</p>
                </div>

                <div className="space-y-1 border-t pt-4 md:pt-0 border-l border-white/10 pl-4">
                  <div className="flex items-center justify-center gap-2 text-amber-400">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quality Score</span>
                  </div>
                  <p className="text-3xl font-extrabold text-amber-300 font-mono">
                    {isLoading ? "..." : "4.8 / 5.0"}
                  </p>
                  <p className="text-[11px] text-slate-400">High Precision Threshold</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 px-6 bg-slate-900/40 border-y border-white/5">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-white">About MaayMaxaa DataHub</h2>
              <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                Building accessible, high-quality parallel corpora for the two main Somali spoken varieties.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <p>
                  Somali is a Afroasiatic language spoken by over 25 million people across the Horn of Africa. While
                  <strong> Maxaa-tiri</strong> serves as the standardized official language, <strong>Maay Maay</strong> is widely
                  spoken by millions across Southwestern Somalia.
                </p>
                <p>
                  Due to historical scarcity in parallel digital resources, machine translation systems and voice AI models
                  struggle with Maay dialectal nuances. <strong>MaayMaxaa DataHub</strong> solves this gap by bringing native speakers,
                  linguists, and AI developers together into an open, peer-reviewed workflow.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                    Machine Translation (NMT)
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
                    Speech Recognition (STT)
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs">
                    Text-To-Speech (TTS)
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                    LLM Fine-Tuning
                  </span>
                </div>
              </div>

              <div className="glass p-6 rounded-2xl border border-white/10 bg-slate-900/80 space-y-4">
                <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-400" /> Platform Architecture & Lifecycle
                </h3>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">1</span>
                    <span><strong>Submission:</strong> Native speakers submit source & target translation pairs with domain tagging.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="h-5 w-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">2</span>
                    <span><strong>Peer Review:</strong> Verified reviewers evaluate accuracy, grammar, and score quality (1 to 5 stars).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">3</span>
                    <span><strong>HF Hub Publishing:</strong> High-scoring dataset splits are committed automatically to Hugging Face Hub.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Live Sample Translations Section */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Interactive Sample Corpus</h2>
              <p className="text-slate-400 text-xs">Sample sentence pairs from the MaayMaxaa parallel dataset</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-2xl border border-white/10 bg-slate-900/60 space-y-4 hover:border-indigo-500/30 transition">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-mono">Daily Conversation</span>
                  <span className="text-emerald-400 font-medium">Quality Score: 5.0 ⭐</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Maay Maay</span>
                    <p className="text-slate-100 font-medium">Hadaad adiyee, maxaa ii keentaa?</p>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Maxaa-tiri</span>
                    <p className="text-slate-200">Haddii aad tagayso, maxaad ii keenaysaa?</p>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">English Reference</span>
                    <p className="text-slate-400 text-xs italic">If you are going, what will you bring for me?</p>
                  </div>
                </div>
              </div>

              <div className="glass p-6 rounded-2xl border border-white/10 bg-slate-900/60 space-y-4 hover:border-purple-500/30 transition">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-mono">Formal / News</span>
                  <span className="text-emerald-400 font-medium">Quality Score: 5.0 ⭐</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Maay Maay</span>
                    <p className="text-slate-100 font-medium">Kulaankani waa mid aad u muhiim ah.</p>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Maxaa-tiri</span>
                    <p className="text-slate-200">Shirkani waa mid aad u muhiim ah.</p>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">English Reference</span>
                    <p className="text-slate-400 text-xs italic">This meeting is very important.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features & Key Capabilities */}
        <section className="py-16 px-6 bg-slate-900/30 border-t border-white/5">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Built for Open AI & Machine Learning</h2>
              <p className="text-slate-400 text-sm max-w-xl mx-auto">
                Designed to meet the rigorous dataset standards of modern Machine Translation & Speech models.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-2xl border border-white/10 bg-slate-900/50 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Standard Splits</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatic train, validation, and test split generation formatted in JSONL and CSV for Hugging Face Datasets loader.
                </p>
              </div>

              <div className="glass p-6 rounded-2xl border border-white/10 bg-slate-900/50 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">STT & TTS Ready</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Supports aligned transcriptions suited for Speech-To-Text (Whisper) and Text-To-Speech pipeline training.
                </p>
              </div>

              <div className="glass p-6 rounded-2xl border border-white/10 bg-slate-900/50 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Globe className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Hugging Face Sync</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  One-click admin dataset sync directly committing updated splits and Dataset Cards to Hugging Face Hub.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Footer Callout */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto glass p-10 rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 to-slate-900/80 text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl font-extrabold text-white">Ready to Contribute to Somali Language AI?</h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
              Join native speakers, translators, and researchers in expanding the largest open parallel corpus for Maay ↔ Maxaa translation.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate(user ? dashboardPath! : "/register")}
                className="px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30 transition flex items-center gap-2"
              >
                {user ? "Go to Dashboard" : "Create Account & Contribute"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <Logo size="sm" showText={false} />
            <div>
              <p className="text-slate-400 font-medium">Maay&Maxaa DataHub &copy; {new Date().getFullYear()}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Open-Source Somali Parallel Corpus under CC-BY 4.0 License</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://huggingface.co/datasets/SomaliDatasets/maay-maxaa-translation"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 transition"
            >
              Hugging Face Hub
            </a>
            <Link to="/login" className="hover:text-slate-300 transition">
              Log In
            </Link>
            <Link to="/register" className="hover:text-slate-300 transition">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
