import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Sidebar } from './Sidebar';

export function ProtectedRoute() {
  const { isAuthenticated, token, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Check if token exists in store or localStorage
    const storedToken = token || localStorage.getItem('admin_token') || localStorage.getItem('token');
    
    if (isAuthenticated || storedToken) {
      setIsValid(true);
    } else {
      logout();
      setIsValid(false);
    }
    setLoading(false);
  }, [isAuthenticated, token, logout]);

  if (loading) {
    return (
      <div className="flex h-screen bg-neutral-900 text-amber-400 items-center justify-center font-mono">
        Loading Admin Dashboard...
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-neutral-900">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
