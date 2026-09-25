import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Sparkles,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('harshbuddy01@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';
      const apiRes = await fetch(`${apiUrl}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });

      const apiData = await apiRes.json();

      if (apiRes.ok && apiData.token) {
        login(apiData.token);
        navigate('/');
        return;
      } else {
        throw new Error(apiData.message || apiData.error || 'Invalid username or password');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080c] relative flex flex-col justify-between items-center p-4 sm:p-6 overflow-hidden bg-grid-pattern selection:bg-amber-500 selection:text-black">
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-amber-600/15 via-orange-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[400px] bg-blue-600/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Top Header Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-extrabold text-base shadow-lg shadow-amber-500/20">
            VP
          </div>
          <div>
            <div className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
              <span>Vigyan<span className="text-amber-400">.prep</span></span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Admin Studio
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">Master Command & Question Builder</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-900/80 px-3 py-1.5 rounded-full border border-neutral-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Cloud Run 24ms Mumbai • SSL 256-bit</span>
        </div>
      </header>

      {/* Main Login Card */}
      <div className="w-full max-w-md my-auto relative z-10 py-6">
        <div className="relative rounded-2xl bg-[#0f121a]/85 backdrop-blur-2xl border border-white/10 p-7 sm:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(245,158,11,0.06)]">
          {/* Subtle amber top edge accent */}
          <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Heading */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-mono font-medium mb-3">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>SUPER ADMIN PORTAL</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
              Welcome Back
            </h1>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Sign in to manage IISER IAT / NEST exam schedules, KaTeX question banks, and live results.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 text-xs text-red-300 bg-red-950/40 border border-red-500/30 p-3 rounded-xl animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono">
                Admin Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0c12] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                  placeholder="admin or harshbuddy01@gmail.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono">
                Admin Secret Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0c12] border border-white/10 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-200 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember info */}
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted Session (30 Days)</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-500">v3.4 Production</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold py-3.5 px-4 rounded-xl shadow-[0_4px_25px_rgba(245,158,11,0.25)] hover:shadow-[0_6px_30px_rgba(245,158,11,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Admin Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Security Info */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1.5 font-mono">
              <span>Restricted access for VigyanPrep staff only.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 py-4 text-xs text-neutral-500 relative z-10 border-t border-neutral-900">
        <div>
          © {new Date().getFullYear()} VigyanPrep • Pure Science Entrance CBT Engine
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://test.vigyanprep.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-400 transition flex items-center gap-1"
          >
            <span>Student Test Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>•</span>
          <a
            href="https://vigyanprep.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-400 transition"
          >
            Main Website
          </a>
        </div>
      </footer>
    </div>
  );
}
