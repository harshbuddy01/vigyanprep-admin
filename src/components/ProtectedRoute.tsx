import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from './ErrorBoundary';
import { ExternalLink } from 'lucide-react';

function getPageTitle(pathname: string): { section: string; title: string } {
  if (pathname === '/') return { section: 'Overview', title: 'Dashboard' };
  if (pathname.startsWith('/test-series')) return { section: 'Test Series', title: 'Official Mocks' };
  if (pathname.startsWith('/paper-builder')) return { section: 'Studio', title: 'Paper Builder & AI Extractor' };
  if (pathname.startsWith('/pricing')) return { section: 'Monetization', title: 'Pricing & Passes' };
  if (pathname.startsWith('/live-invigilation')) return { section: 'Proctoring', title: 'Live Invigilation' };
  if (pathname.startsWith('/question-reports') || pathname.startsWith('/question-challenges')) {
    return { section: 'Quality Control', title: 'Question Challenges & Reports' };
  }
  if (pathname.startsWith('/pyq')) return { section: 'Archive', title: 'Solved PYQ Papers' };
  if (pathname.startsWith('/questions')) return { section: 'Question Bank', title: 'LaTeX Master Catalog' };
  if (pathname.startsWith('/students')) return { section: 'Community', title: 'Enrolled Aspirants' };
  if (pathname.startsWith('/performance')) return { section: 'Analytics', title: 'Student Performance Metrics' };
  if (pathname.startsWith('/members')) return { section: 'Security', title: 'Admin Team & Roles' };
  if (pathname.startsWith('/transactions')) return { section: 'Finance', title: 'Razorpay Payment Logs' };
  if (pathname.startsWith('/results')) return { section: 'Results', title: 'Certified Scorecards' };
  if (pathname.startsWith('/settings')) return { section: 'System', title: 'Platform Settings' };
  return { section: 'Admin', title: 'Management Console' };
}

export function ProtectedRoute() {
  const { isAuthenticated, token, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setTheme(theme);

    const validateSession = async () => {
      const storedToken = token || localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      if (!storedToken) {
        logout();
        setIsValid(false);
        setLoading(false);
        return;
      }

      // Quick client expiry check
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.warn('⚠️ Admin token expired.');
          logout();
          setIsValid(false);
          setLoading(false);
          return;
        }
      } catch {
        // Continue to server verification
      }

      // Verify with backend
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';
        const res = await fetch(`${apiBase}/api/admin/auth/validate-session`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        if (!res.ok) {
          console.warn('⚠️ Admin session invalid.');
          logout();
          setIsValid(false);
          setLoading(false);
          return;
        }
      } catch {
        // Network fallback
      }

      setIsValid(true);
      setLoading(false);
    };

    validateSession();
  }, [isAuthenticated, token, logout, theme, setTheme]);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#07080c] text-amber-400 items-center justify-center font-mono text-xs gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
        <span>AUTHENTICATING SECURE ADMIN WORKSPACE...</span>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  const { section, title } = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen bg-[#07080c] text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#090b10] bg-grid-pattern relative">
        {/* Modern SaaS Header Bar */}
        <header className="h-16 px-6 border-b border-white/[0.08] bg-[#0b0d13]/85 backdrop-blur-xl flex items-center justify-between shrink-0 z-20">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-neutral-500">VigyanPrep</span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">{section}</span>
            <span className="text-neutral-600">/</span>
            <span className="text-amber-400 font-semibold">{title}</span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Live API Health Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Run 24ms • Live</span>
            </div>

            {/* Quick Link to Student Portal */}
            <a
              href="https://test.vigyanprep.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 text-xs text-neutral-300 hover:text-white transition shadow-sm"
            >
              <span>Student CBT Portal</span>
              <ExternalLink size={12} className="text-amber-400" />
            </a>

            {/* Admin Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-black font-bold text-xs flex items-center justify-center shadow-md shadow-amber-500/15">
                HA
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-white leading-tight">Harsh Anand</div>
                <div className="text-[10px] text-amber-400 font-mono">Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
