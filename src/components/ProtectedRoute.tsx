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

    const storedToken = token || localStorage.getItem('admin_token') || localStorage.getItem('token');
    if (isAuthenticated || storedToken) {
      setIsValid(true);
    } else {
      logout();
      setIsValid(false);
    }
    setLoading(false);
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
