import { create } from 'zustand';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('adminToken'),
  isAuthenticated: !!localStorage.getItem('adminToken'),
  login: (token) => {
    localStorage.setItem('adminToken', token);
    set({ token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('adminToken');
    set({ token: null, isAuthenticated: false });
  },
}));
