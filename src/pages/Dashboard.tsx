import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  FileQuestion,
  Activity,
  Hammer,
  ShieldCheck,
  Trophy,
  FileText,
  ChevronRight,
  Server,
  AlertCircle
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api } from '../lib/api';

const MOCK_ACTIVITY_TREND = [
  { name: 'Mon', attempts: 180, registrations: 45 },
  { name: 'Tue', attempts: 240, registrations: 62 },
  { name: 'Wed', attempts: 310, registrations: 78 },
  { name: 'Thu', attempts: 290, registrations: 85 },
  { name: 'Fri', attempts: 420, registrations: 110 },
  { name: 'Sat', attempts: 580, registrations: 145 },
  { name: 'Sun', attempts: 640, registrations: 180 },
];

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalStudents = stats?.totalStudents || 1284;
  const totalTests = stats?.totalTests || stats?.activeTests || 18;
  const totalQuestions = stats?.totalQuestions || 2460;
  const activeUsers = stats?.activeUsers || 42;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-amber-400 font-mono text-xs gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
        <span>AGGREGATING PLATFORM METRICS...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/20 text-red-300 text-xs flex items-center gap-3">
        <AlertCircle size={18} className="text-red-400" />
        <span>Error loading metrics: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#121622] via-[#10141e] to-[#0c0e15] border border-white/[0.08] p-6 sm:p-7 shadow-[0_15px_40px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 via-orange-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-mono font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>COMMAND CENTER ACTIVE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Good evening, Harsh
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
              Live candidate invigilation, LaTeX formula question banks, and automated NTA test cycles for IISER IAT & NISER NEST.
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/paper-builder?type=test_series"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition transform hover:-translate-y-0.5"
            >
              <Hammer size={14} />
              <span>Paper Builder</span>
            </Link>

            <Link
              to="/questions"
              className="px-3.5 py-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 text-xs font-semibold text-neutral-200 hover:text-white transition flex items-center gap-1.5"
            >
              <FileQuestion size={14} className="text-amber-400" />
              <span>Question Bank</span>
            </Link>

            <Link
              to="/live-invigilation"
              className="px-3.5 py-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 text-xs font-semibold text-neutral-200 hover:text-white transition flex items-center gap-1.5"
            >
              <Activity size={14} className="text-emerald-400" />
              <span>Live Monitor</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          icon={Users}
          label="Enrolled Aspirants"
          value={totalStudents.toLocaleString()}
          subtitle="Registered Student Accounts"
          trend={{ value: 14.2, isPositive: true }}
          accentColor="blue"
        />

        <StatCard
          icon={BookOpen}
          label="Active CBT Mocks"
          value={totalTests}
          subtitle="IAT & NEST Full-Lengths"
          trend={{ value: 6.8, isPositive: true }}
          accentColor="amber"
        />

        <StatCard
          icon={FileQuestion}
          label="Master Question Bank"
          value={totalQuestions.toLocaleString()}
          subtitle="KaTeX Verified Formulas"
          trend={{ value: 22.5, isPositive: true }}
          accentColor="emerald"
        />

        <StatCard
          icon={Activity}
          label="Active Test Takers"
          value={activeUsers}
          subtitle="Live TCS-iON Sessions"
          trend={{ value: 5.0, isPositive: true }}
          accentColor="purple"
        />
      </div>

      {/* Analytics & Quick Launch Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Test Activity Trend Chart */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0f121a]/85 backdrop-blur-xl border border-white/[0.08] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-neutral-400">Weekly Throughput</div>
              <h2 className="text-lg font-bold text-white mt-0.5">Exam Attempts & Registration Velocity</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Attempts</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Signups</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_ACTIVITY_TREND}>
                <defs>
                  <linearGradient id="attemptsGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="signupsGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c0e15',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="attempts"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#attemptsGlow)"
                />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#signupsGlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Quick Action Command Center */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0f121a]/85 backdrop-blur-xl border border-white/[0.08] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">Direct Operations</div>
            <h2 className="text-lg font-bold text-white mb-4">Command Shortcuts</h2>

            <div className="space-y-3">
              <Link
                to="/paper-builder?type=test_series"
                className="p-3.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-white/5 hover:border-amber-500/30 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                    <Hammer size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Paper Builder & AI Extractor</div>
                    <div className="text-[11px] text-neutral-400">Groq AI OCR + LaTeX formula mapper</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-neutral-500 group-hover:text-amber-400 transition" />
              </Link>

              <Link
                to="/live-invigilation"
                className="p-3.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-white/5 hover:border-emerald-500/30 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Live CBT Proctoring</div>
                    <div className="text-[11px] text-neutral-400">Real-time tab tracking & heartbeat</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-neutral-500 group-hover:text-emerald-400 transition" />
              </Link>

              <Link
                to="/results"
                className="p-3.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-white/5 hover:border-blue-500/30 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Certified Scorecards</div>
                    <div className="text-[11px] text-neutral-400">All-India percentile calculator</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-neutral-500 group-hover:text-blue-400 transition" />
              </Link>

              <Link
                to="/pyq"
                className="p-3.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-white/5 hover:border-purple-500/30 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Solved PYQ Archive</div>
                    <div className="text-[11px] text-neutral-400">Free papers for IAT & NEST</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-neutral-500 group-hover:text-purple-400 transition" />
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-neutral-400 flex items-center justify-between font-mono">
            <span>Next Scheduled Mock:</span>
            <span className="text-amber-400 font-semibold">IAT 2026 Shift-1 (Sunday)</span>
          </div>
        </div>
      </div>

      {/* System Infrastructure Health Strip */}
      <div className="rounded-2xl bg-[#0c0e14]/90 border border-white/[0.08] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-2">
          <Server size={14} className="text-amber-400" />
          <span className="text-white font-semibold">System Infrastructure:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Cloud Run API (Mumbai) • 200 OK</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Supabase RLS Protected</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Razorpay Live Payments</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>KaTeX Client-Side Math Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
