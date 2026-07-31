import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Sidebar } from './Sidebar';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

export function ProtectedRoute() {
  const { isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No session');
        }
        await api.getDashboardStats();
        setIsValid(true);
      } catch (err) {
        logout();
        setIsValid(false);
      }
      setLoading(false);
    };
    
    if (isAuthenticated) {
      checkAuth();
    } else {
      setLoading(false);
      setIsValid(false);
    }
  }, [isAuthenticated, logout]);

  if (loading) {
    return <div className="flex h-screen bg-neutral-900 text-white items-center justify-center">Loading...</div>;
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
