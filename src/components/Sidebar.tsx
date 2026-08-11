import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileQuestion, BookOpen, Users, Receipt,
  Trophy, LogOut, FileUp, Calendar, BarChart2, Shield, Settings, Activity, AlertCircle, FileText, Tag, Sun, Moon,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { cn } from '../lib/utils';
import { useEffect } from 'react';

const navGroups = [
  {
    label: 'Overview',
    links: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ]
  },
  {
    label: 'TEST SERIES (paid)',
    links: [
      { to: '/test-series', icon: BookOpen, label: 'Test Series' },
      { to: '/pricing', icon: Tag, label: 'Pricing & Plans' },
      { to: '/test-series/calendar', icon: Calendar, label: 'Schedule Calendar' },
      { to: '/live-invigilation', icon: Activity, label: 'Live Invigilation' },
      { to: '/question-reports', icon: AlertCircle, label: 'Question Reports' },
    ]
  },
  {
    label: 'PYQ SECTION (free)',
    links: [
      { to: '/pyq', icon: FileText, label: 'PYQ Papers' },
      { to: '/pyq/upload', icon: FileUp, label: 'Upload PYQ PDF' },
    ]
  },
  {
    label: 'QUESTION BANK',
    links: [
      { to: '/questions', icon: FileQuestion, label: 'All Questions' },
    ]
  },
  {
    label: 'Students & Team',
    links: [
      { to: '/students', icon: Users, label: 'All Students' },
      { to: '/performance', icon: BarChart2, label: 'Performance' },
      { to: '/members', icon: Shield, label: 'Admin Members' },
    ]
  },
  {
    label: 'Financial & Analytics',
    links: [
      { to: '/transactions', icon: Receipt, label: 'Transactions' },
      { to: '/results', icon: Trophy, label: 'View Results' },
    ]
  },
  {
    label: 'System',
    links: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ]
  }
];

export function Sidebar() {
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme, setTheme, sidebarCollapsed, toggleSidebar } = useThemeStore();

  useEffect(() => {
    setTheme(theme);
  }, []);

  return (
    <div
      className={cn(
        "bg-slate-900 dark:bg-neutral-950 border-r border-slate-700/50 dark:border-white/10 h-screen flex flex-col overflow-y-auto shrink-0 transition-all duration-300 relative group",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn("p-4 border-b border-slate-700/50 dark:border-white/10 flex items-center justify-between", sidebarCollapsed && "flex-col gap-3 px-2")}>
        <a
          href="https://vigyanprep.com/"
          className="flex items-center gap-2 group cursor-pointer overflow-hidden"
          title="Go to VigyanPrep Homepage"
        >
          <img
            src="/vigyan-logo-light.png"
            alt="VigyanPrep Official Logo"
            className={cn("w-auto object-contain transition-all duration-300", sidebarCollapsed ? "h-10" : "h-12")}
          />
          {!sidebarCollapsed && (
            <span className="text-[9px] text-amber-400 font-extrabold tracking-widest uppercase border-l border-white/20 pl-2 shrink-0">
              ADMIN
            </span>
          )}
        </a>

        {/* Action Controls: Collapse & Theme Toggle */}
        <div className="flex items-center gap-1">
          {/* Collapse/Minimize Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-slate-800 dark:bg-neutral-900 border border-slate-700 dark:border-white/10 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition shadow"
            title={sidebarCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Theme Toggle Button */}
          {!sidebarCollapsed && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-800 dark:bg-neutral-900 border border-slate-700 dark:border-white/10 text-amber-400 hover:text-amber-300 transition shadow"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-widest px-3 mb-1.5 truncate">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={'end' in link ? link.end : false}
                    title={sidebarCollapsed ? link.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                        sidebarCollapsed && 'justify-center px-2',
                        isActive
                          ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 shadow-xs'
                          : 'text-slate-300 dark:text-neutral-400 hover:bg-slate-800 dark:hover:bg-neutral-900 hover:text-white'
                      )
                    }
                  >
                    <Icon size={18} className="shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{link.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700/50 dark:border-white/10">
        <button
          onClick={logout}
          title={sidebarCollapsed ? "Logout" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-slate-300 dark:text-neutral-400 hover:bg-red-500/15 hover:text-red-400 transition-colors",
            sidebarCollapsed && "justify-center px-2"
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
