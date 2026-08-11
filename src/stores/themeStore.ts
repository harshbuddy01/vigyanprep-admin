import { create } from 'zustand';

interface ThemeState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const getInitialTheme = (): 'dark' | 'light' => {
  const saved = localStorage.getItem('admin_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'dark'; // default
};

const getInitialSidebar = (): boolean => {
  return localStorage.getItem('admin_sidebar_collapsed') === 'true';
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  sidebarCollapsed: getInitialSidebar(),
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('admin_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: nextTheme };
    });
  },
  setTheme: (theme) => {
    localStorage.setItem('admin_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
  toggleSidebar: () => {
    set((state) => {
      const next = !state.sidebarCollapsed;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return { sidebarCollapsed: next };
    });
  },
  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem('admin_sidebar_collapsed', String(collapsed));
    set({ sidebarCollapsed: collapsed });
  }
}));
