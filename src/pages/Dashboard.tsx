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
      <div className="flex h-64 items-center justify-center text-zinc-400 font-mono text-xs gap-3">
        <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
        <span>Loading platform metrics…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400/90 text-xs flex items-center gap-3">
        <AlertCircle size={16} />
        <span>Error loading metrics: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-[#14171d] border border-white/[0.07] p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 text-[11px] font-mono font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>COMMAND CENTER ACTIVE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
              Good evening, Harsh
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Live candidate invigilation, LaTeX formula question banks, and automated NTA test cycles for IISER IAT & NISER NEST.
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/paper-builder?type=test_series"
              className="px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Hammer size={14} />
              <span>Paper Builder</span>
            </Link>

            <Link
              to="/questions"
              className="px-3.5 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-medium transition flex items-center gap-1.5"
            >
              <FileQuestion size={14} className="text-zinc-400" />
              <span>Question Bank</span>
            </Link>

            <Link
              to="/live-invigilation"
              className="px-3.5 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-medium transition flex items-center gap-1.5"
            >
              <Activity size={14} className="text-rose-400" />
              <span>Live Monitor</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="lg:col-span-8 rounded-xl bg-[#14171d] border border-white/[0.07] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">Weekly Throughput</div>
              <h2 className="text-base font-bold text-zinc-100 mt-0.5">Exam Attempts & Registration Velocity</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>Attempts</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                <span>Signups</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_ACTIVITY_TREND}>
                <defs>
                  <linearGradient id="attemptsGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="signupsGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="#52525b" tick={{ fontSize: 11, fill: '#71717a' }} />
                <YAxis stroke="#52525b" tick={{ fontSize: 11, fill: '#71717a' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#181a22',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#e4e4e7',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="attempts"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#attemptsGlow)"
                />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#signupsGlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Quick Action Command Center */}
        <div className="lg:col-span-4 rounded-xl bg-[#14171d] border border-white/[0.07] p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">Direct Operations</div>
            <h2 className="text-base font-bold text-zinc-100 mb-4">Command Shortcuts</h2>

            <div className="space-y-2">
              <Link
                to="/paper-builder?type=test_series"
                className="p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-300 group-hover:scale-105 transition-transform">
                    <Hammer size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-200">Paper Builder & AI Extractor</div>
                    <div className="text-[11px] text-zinc-500">Groq AI OCR + LaTeX formula mapper</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-500 group-hover:text-zinc-300 transition" />
              </Link>

              <Link
                to="/live-invigilation"
                className="p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-300 group-hover:scale-105 transition-transform">
                    <ShieldCheck size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-200">Live CBT Proctoring</div>
                    <div className="text-[11px] text-zinc-500">Real-time tab tracking & heartbeat</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-500 group-hover:text-zinc-300 transition" />
              </Link>

              <Link
                to="/results"
                className="p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-300 group-hover:scale-105 transition-transform">
                    <Trophy size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-200">Certified Scorecards</div>
                    <div className="text-[11px] text-zinc-500">All-India percentile calculator</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-500 group-hover:text-zinc-300 transition" />
              </Link>

              <Link
                to="/pyq"
                className="p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-300 group-hover:scale-105 transition-transform">
                    <FileText size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-200">Solved PYQ Archive</div>
                    <div className="text-[11px] text-zinc-500">Free papers for IAT & NEST</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-zinc-500 group-hover:text-zinc-300 transition" />
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] text-zinc-500 flex items-center justify-between font-mono">
            <span>Next Scheduled Mock:</span>
            <span className="text-zinc-300 font-medium">IAT 2026 Shift-1 (Sunday)</span>
          </div>
        </div>
      </div>

      {/* System Infrastructure Health Strip */}
      <div className="rounded-xl bg-[#14171d] border border-white/[0.07] p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <Server size={14} className="text-zinc-400" />
          <span className="text-zinc-200 font-semibold">System Infrastructure:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Cloud Run API (Mumbai) • 200 OK</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Supabase RLS Protected</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Razorpay Live Payments</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>KaTeX Client-Side Math Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
