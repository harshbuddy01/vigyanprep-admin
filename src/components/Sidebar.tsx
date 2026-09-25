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
    label: 'TEST SERIES (paid)',
    links: [
      { to: '/test-series', icon: BookOpen, label: 'Test Series' },
      { to: '/paper-builder?type=test_series', icon: Hammer, label: 'Paper Builder', badge: 'PRO' },
      { to: '/pricing', icon: Tag, label: 'Pricing & Plans' },
      { to: '/live-invigilation', icon: Activity, label: 'Live Invigilation', badge: 'LIVE', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      { to: '/question-reports', icon: AlertCircle, label: 'Question Reports' },
    ]
  },
  {
    label: 'PYQ SECTION (free)',
    links: [
      { to: '/pyq', icon: FileText, label: 'PYQ Papers', badge: 'FREE' },
      { to: '/paper-builder?type=pyq', icon: Hammer, label: 'Upload Free PYQ' },
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
    <aside
      className={cn(
        "bg-[#090b10] border-r border-white/[0.08] h-screen flex flex-col shrink-0 transition-all duration-300 relative z-30 select-none",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "h-16 px-4 border-b border-white/[0.08] flex items-center justify-between shrink-0",
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-extrabold text-sm shrink-0 shadow-md shadow-amber-500/20">
            VP
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-sm tracking-tight leading-none">
                Vigyan<span className="text-amber-400">.prep</span>
              </span>
              <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-neutral-400 mt-0.5">
                Admin Studio
              </span>
            </div>
          )}
        </a>

        {/* Action Controls: Collapse & Theme Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-400 hover:text-white transition"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>

          {!sidebarCollapsed && (
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-amber-400 hover:text-amber-300 transition"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!sidebarCollapsed && (
              <p className="text-[10px] font-mono font-semibold text-neutral-400 uppercase tracking-wider px-3 mb-1.5 truncate">
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
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative',
                        sidebarCollapsed && 'justify-center px-2 py-2.5',
                        isActive
                          ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent text-amber-300 font-semibold border-l-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                          : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                      )
                    }
                  >
                    <Icon size={16} className="shrink-0 transition-transform group-hover:scale-110" />
                    {!sidebarCollapsed && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{link.label}</span>
                        {'badge' in link && (
                          <span
                            className={cn(
                              "text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ml-2 border",
                              link.badgeColor || "bg-amber-500/15 text-amber-400 border-amber-500/30"
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
      <div className="p-3 border-t border-white/[0.08] bg-[#0c0e14]">
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-900/60 border border-white/5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-black font-bold text-xs flex items-center justify-center shrink-0">
                HA
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">Harsh Anand</div>
                <div className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Super Admin</span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            title="Sign Out"
            className="w-full flex items-center justify-center p-2.5 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}
