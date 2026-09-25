import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileQuestion, BookOpen, Users, Receipt,
  Trophy, LogOut, BarChart2, Shield, Settings, Activity, AlertCircle, FileText, Tag, Sun, Moon,
  PanelLeftClose, PanelLeftOpen, Hammer
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
    label: 'Test Series (Paid)',
    links: [
      { to: '/test-series', icon: BookOpen, label: 'Test Series' },
      { to: '/paper-builder?type=test_series', icon: Hammer, label: 'Paper Builder', badge: 'PRO' },
      { to: '/pricing', icon: Tag, label: 'Pricing & Plans' },
      { to: '/live-invigilation', icon: Activity, label: 'Live Invigilation', badge: 'LIVE', badgeColor: 'bg-rose-500/10 text-rose-400/90 border-rose-500/20' },
      { to: '/question-reports', icon: AlertCircle, label: 'Question Reports' },
    ]
  },
  {
    label: 'PYQ Section (Free)',
    links: [
      { to: '/pyq', icon: FileText, label: 'PYQ Papers', badge: 'FREE' },
      { to: '/paper-builder?type=pyq', icon: Hammer, label: 'Upload Free PYQ' },
    ]
  },
  {
    label: 'Question Bank',
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
    <aside
      className={cn(
        "bg-[#0a0c0f] border-r border-white/[0.07] h-screen flex flex-col shrink-0 transition-all duration-200 relative z-30 select-none",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "h-14 px-3.5 border-b border-white/[0.07] flex items-center justify-between shrink-0",
          sidebarCollapsed && "flex-col justify-center gap-1.5 px-2 py-2"
        )}
      >
        <a
          href="https://vigyanprep.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 group overflow-hidden"
          title="Open VigyanPrep Website"
        >
          <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
            VP
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-zinc-100 text-sm tracking-tight leading-none">
                Vigyan<span className="text-zinc-400">.prep</span>
              </span>
              <span className="text-[9px] font-mono font-medium uppercase tracking-wider text-zinc-500 mt-0.5">
                Admin Studio
              </span>
            </div>
          )}
        </a>

        {/* Action Controls: Collapse & Theme Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>

          {!sidebarCollapsed && (
            <button
              onClick={toggleTheme}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            {!sidebarCollapsed && (
              <p className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-wider px-2.5 mb-1 truncate">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
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
                        'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group relative',
                        sidebarCollapsed && 'justify-center px-1.5 py-2',
                        isActive
                          ? 'bg-white/[0.08] text-white font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                      )
                    }
                  >
                    <Icon size={15} className="shrink-0 transition-transform group-hover:scale-105" />
                    {!sidebarCollapsed && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{link.label}</span>
                        {'badge' in link && (
                          <span
                            className={cn(
                              "text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase ml-2 border",
                              link.badgeColor || "bg-zinc-800 text-zinc-400 border-zinc-700/60"
                            )}
                          >
                            {link.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin User Card & Logout */}
      <div className="p-2.5 border-t border-white/[0.07] bg-[#0a0c0f]">
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-zinc-900/60 border border-white/[0.05]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center shrink-0">
                HA
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-zinc-200 truncate">Harsh Anand</div>
                <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Super Admin</span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            title="Sign Out"
            className="w-full flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
