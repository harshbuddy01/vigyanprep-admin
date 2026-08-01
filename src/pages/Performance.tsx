import { useState, useEffect } from 'react';
import { BarChart3, Trophy, Medal, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

export function Performance() {
  const token = useAuthStore((state) => state.token);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/admin/dashboard/stats`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
          if (data.stats.leaderboard) setLeaderboard(data.stats.leaderboard);
        }
      } catch (err) {
        console.error('Failed to fetch performance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformanceData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="text-amber-400" /> Student Performance & Leaderboard
        </h1>
        <p className="text-sm text-neutral-400 mt-1">Live ranking, attempt metrics, and test performance analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-800/50 border border-white/10 p-6 rounded-xl space-y-2">
          <div className="text-xs text-neutral-400 font-semibold uppercase">Total Registered Students</div>
          <div className="text-3xl font-extrabold text-amber-400">{stats?.totalStudents || 0}</div>
          <div className="text-xs text-neutral-400">Enrolled across IISER & NEST programs</div>
        </div>
        <div className="bg-neutral-800/50 border border-white/10 p-6 rounded-xl space-y-2">
          <div className="text-xs text-neutral-400 font-semibold uppercase">Total Exam Attempts</div>
          <div className="text-3xl font-extrabold text-white">{stats?.totalAttempts || 0}</div>
          <div className="text-xs text-neutral-400">Across {stats?.activeTests || 0} published test papers</div>
        </div>
        <div className="bg-neutral-800/50 border border-white/10 p-6 rounded-xl space-y-2">
          <div className="text-xs text-neutral-400 font-semibold uppercase">Active Test Papers</div>
          <div className="text-3xl font-extrabold text-emerald-400">{stats?.activeTests || 0}</div>
          <div className="text-xs text-emerald-400">Live & Scheduled CBT Series</div>
        </div>
      </div>

      <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="text-amber-400" size={20} /> Real-Time Merit List Leaderboard
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-neutral-400 font-mono flex items-center justify-center gap-2">
            <RefreshCw className="animate-spin" size={18} /> Calculating merit rankings...
          </div>
        ) : (
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-900/50 text-xs uppercase text-neutral-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Test Series</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-6 py-4 font-bold">
                    {idx === 0 && <Medal className="text-amber-400 inline mr-1" size={16} />}
                    {idx === 1 && <Medal className="text-slate-300 inline mr-1" size={16} />}
                    {idx === 2 && <Medal className="text-amber-700 inline mr-1" size={16} />}
                    #{idx + 1}
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">{item.name || item.studentName}</td>
                  <td className="px-6 py-4 text-xs text-neutral-400">{item.test || 'IISER IAT Full Mock'}</td>
                  <td className="px-6 py-4 font-bold text-amber-400">{item.score || 'In Evaluation'}</td>
                  <td className="px-6 py-4 text-emerald-400 font-semibold">{item.status || 'Verified'}</td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-400 font-mono">
                    No evaluated exam attempts recorded yet. Ranks will automatically calculate when students complete scheduled CBT tests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
