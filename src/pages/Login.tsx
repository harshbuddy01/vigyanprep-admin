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
    <div className="min-h-screen bg-[var(--bg-page)] relative flex flex-col justify-between items-center p-4 sm:p-6 overflow-hidden selection:bg-[var(--accent)] selection:text-white">
      {/* Top Header Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white font-extrabold text-base">
            VP
          </div>
          <div>
            <div className="font-extrabold text-[var(--text-main)] text-base tracking-tight flex items-center gap-2">
              <span>Vigyan<span className="text-[var(--text-accent)]">.prep</span></span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--text-accent)] border border-[var(--accent)]/20">
                Admin Studio
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">Master Command & Question Builder</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-card)] px-3 py-1.5 rounded-full border border-[var(--border-main)]">
          <span className="w-2 h-2 rounded-full bg-teal-400/70" />
          <span>Cloud Run 24ms Mumbai • SSL 256-bit</span>
        </div>
      </header>

      {/* Main Login Card */}
      <div className="w-full max-w-md my-auto relative z-10 py-6">
        <div className="relative rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] p-7 sm:p-9 shadow-lg">
          {/* Subtle accent top edge */}
          <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />

          {/* Heading */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/20 text-[var(--text-accent)] text-[11px] font-mono font-medium mb-3">
              <ShieldCheck className="w-3 h-3" />
              <span>ADMIN PORTAL</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)] mb-1.5">
              Welcome Back
            </h1>
            <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
              Sign in to manage IISER IAT / NEST exam schedules, KaTeX question banks, and live results.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 text-xs text-red-400/90 bg-red-950/15 border border-red-500/15 p-3 rounded-xl animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400/80 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider font-mono">
                Admin Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all font-mono"
                  placeholder="admin or harshbuddy01@gmail.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider font-mono">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl pl-10 pr-11 py-3 text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all font-mono"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember info */}
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400/70" />
                <span>Encrypted Session (30 Days)</span>
              </span>
              <span className="text-[11px] font-mono">v3.4 Production</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[var(--accent)] hover:opacity-90 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating…</span>
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
          <div className="mt-6 pt-5 border-t border-[var(--border-main)] text-center">
            <p className="text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-1.5 font-mono">
              <span>Restricted access for VigyanPrep staff only.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 py-4 text-xs text-[var(--text-muted)] relative z-10 border-t border-[var(--border-main)]">
        <div>
          © {new Date().getFullYear()} VigyanPrep • Pure Science Entrance CBT Engine
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://test.vigyanprep.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-accent)] transition flex items-center gap-1"
          >
            <span>Student Test Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>•</span>
          <a
            href="https://vigyanprep.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-accent)] transition"
          >
            Main Website
          </a>
        </div>
      </footer>
    </div>
  );
}
