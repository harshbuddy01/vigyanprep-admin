import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileQuestion, BookOpen, Users, Receipt,
  Trophy, LogOut, FileUp, Calendar, Eye, UserPlus, BarChart2
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
    label: 'Test Management',
    links: [
      { to: '/tests', icon: BookOpen, label: 'Test Series' },
      { to: '/calendar', icon: Calendar, label: 'Test Calendar' },
      { to: '/live-preview', icon: Eye, label: 'Live Preview' },
    ]
  },
  {
    label: 'Question Bank',
    links: [
      { to: '/questions', icon: FileQuestion, label: 'Questions' },
      { to: '/upload-pdf', icon: FileUp, label: 'Upload PYQ PDF' },
    ]
  },
  {
    label: 'Students',
    links: [
      { to: '/students', icon: Users, label: 'All Students' },
      { to: '/students/add', icon: UserPlus, label: 'Add Student' },
      { to: '/performance', icon: BarChart2, label: 'Performance' },
    ]
  },
  {
    label: 'Financial',
    links: [
      { to: '/transactions', icon: Receipt, label: 'Transactions' },
    ]
  },
  {
    label: 'Analytics',
    links: [
      { to: '/results', icon: Trophy, label: 'View Results' },
    ]
  },
];

export function Sidebar() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="w-64 bg-neutral-950 border-r border-white/10 h-screen flex flex-col overflow-y-auto shrink-0">
      {/* Logo */}
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

      {/* Nav Groups */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest px-3 mb-2">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={'end' in link ? link.end : false}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
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

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
