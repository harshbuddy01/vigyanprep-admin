import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileQuestion, BookOpen, Users, Receipt, Trophy, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../lib/utils';

export function Sidebar() {
  const logout = useAuthStore((state) => state.logout);

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/questions', icon: FileQuestion, label: 'Questions' },
    { to: '/tests', icon: BookOpen, label: 'Tests' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/transactions', icon: Receipt, label: 'Transactions' },
    { to: '/results', icon: Trophy, label: 'Results' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 bg-neutral-950 border-r border-white/10 h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white">VigyanPrep Admin</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-amber-400/10 text-amber-400'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                )
              }
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
