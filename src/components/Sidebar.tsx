import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileQuestion, BookOpen, Users, Receipt,
  Trophy, LogOut, FileUp, Calendar, BarChart2, Shield, Settings, Activity, AlertCircle, FileText, Tag
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../lib/utils';

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

  return (
    <div className="w-64 bg-neutral-950 border-r border-white/10 h-screen flex flex-col overflow-y-auto shrink-0">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <span className="text-neutral-950 font-black text-sm">V</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">VIGYAN.PREP</h1>
            <span className="text-[10px] text-amber-400 font-medium tracking-widest uppercase">Admin Portal</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={'end' in link ? link.end : false}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                        isActive
                          ? 'bg-amber-400/15 text-amber-300 font-semibold border border-amber-400/20'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                      )
                    }
                  >
                    <Icon size={16} />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
