import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { Sidebar } from './Sidebar';

export function ProtectedRoute() {
  const { isAuthenticated, token, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Ensure theme class is applied on document root on mount
    setTheme(theme);

    const validateSession = async () => {
      const storedToken = token || localStorage.getItem('admin_token') || localStorage.getItem('token');
      
      if (!storedToken) {
        logout();
        setIsValid(false);
        setLoading(false);
        return;
      }

      // Decode JWT and check expiry (without library)
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.warn('⚠️ Admin token expired. Logging out.');
          logout();
          setIsValid(false);
          setLoading(false);
          return;
        }
      } catch {
        // If JWT decode fails, token is invalid
        logout();
        setIsValid(false);
        setLoading(false);
        return;
      }

      // Verify with backend
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';
        const res = await fetch(`${apiBase}/api/admin/auth/validate-session`, {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        if (!res.ok) {
          console.warn('⚠️ Admin session invalid. Logging out.');
          logout();
          setIsValid(false);
          setLoading(false);
          return;
        }
      } catch {
        // Network error — allow offline access with valid token
      }

      setIsValid(true);
      setLoading(false);
    };

    validateSession();
  }, [isAuthenticated, token, logout, theme, setTheme]);

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-100 dark:bg-neutral-950 text-amber-500 items-center justify-center font-mono font-bold">
        Loading Admin Portal...
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-neutral-950 text-slate-900 dark:text-white transition-colors">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
