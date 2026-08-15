import { useState, useEffect } from 'react';
import {
  Trophy, Send, BarChart3, CheckCircle2, AlertCircle, RefreshCw, Award
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

export function Results() {
  const token = useAuthStore((state) => state.token);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [selectedTest, setSelectedTest] = useState<any | null>(null);
  const [meritList, setMeritList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/test-series`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.tests) {
        setTests(data.tests);
        if (data.tests.length > 0 && !selectedTestId) {
          setSelectedTestId(data.tests[0].id);
          setSelectedTest(data.tests[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    if (selectedTestId) {
      const found = tests.find(t => t.id === selectedTestId);
      setSelectedTest(found || null);
      fetchMeritList(selectedTestId);
    }
  }, [selectedTestId, tests]);

  const fetchMeritList = async (testId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/results/merit-list/${testId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        setMeritList(data.meritList || data.results || []);
      } else {
        setMeritList([]);
      }
    } catch {
      setMeritList([]);
    }
  };

  const handleCalculateRanks = async () => {
    if (!selectedTestId) return;
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/results/calculate/${selectedTestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ type: 'success', text: `✅ Rankings calculated for ${data.count || 0} students!` });
        fetchTests();
        fetchMeritList(selectedTestId);
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to calculate rankings' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseResults = async () => {
    if (!selectedTestId) return;
    if (!window.confirm(`Release results for "${selectedTest?.title || 'Selected Test'}"?\n\n✓ All students can see scores, ranks & full solutions\n✓ Notification email dispatched to all candidates.`)) return;

    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/results/release/${selectedTestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ type: 'success', text: `✅ Results released successfully! ${data.notified || 0} students notified.` });
        fetchTests();
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to release results' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const isReleased = !!(selectedTest?.response_released_at || selectedTest?.status === 'completed');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-zinc-100 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Exam Results &amp; Merit List</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/10 border border-amber-400/30 text-amber-400 uppercase tracking-wider">
              Official Declared Ranks
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Calculate percentiles, All-India ranks, and release official response sheets &amp; answer keys to candidates
          </p>
        </div>

        {/* Test Selector Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="bg-[#18181c] border border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400 min-w-[240px]"
          >
            {tests.length === 0 ? (
              <option value="">No tests available</option>
            ) : (
              tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title || t.name} ({t.exam_type || 'IAT'})
                </option>
              ))
            )}
          </select>

          <button
            onClick={fetchTests}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
            title="Refresh List"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          msg.type === 'success'
            ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/40 border border-red-500/40 text-red-300'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      {/* Selected Test Executive Card */}
      {selectedTest && (
        <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-black text-white">{selectedTest.title || selectedTest.name}</h2>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 text-[10px] font-bold">
                  {selectedTest.exam_type || 'IAT'}
                </span>
                {isReleased ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    🟢 Results Released
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    🟡 Results Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">{selectedTest.description || 'Live scheduled examination'}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCalculateRanks}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <BarChart3 size={14} /> Calculate Ranks
              </button>

              <button
                onClick={handleReleaseResults}
                disabled={actionLoading || isReleased}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send size={14} /> {isReleased ? 'Results Already Released' : 'Release Results to Students'}
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#18181c] p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 text-[10px] font-bold uppercase">Duration</span>
              <p className="font-bold text-white mt-0.5">{selectedTest.duration_minutes || 180} mins</p>
            </div>
            <div className="bg-[#18181c] p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 text-[10px] font-bold uppercase">Window Start</span>
              <p className="font-bold text-zinc-300 mt-0.5 text-[11px]">
                {selectedTest.window_start ? new Date(selectedTest.window_start).toLocaleDateString('en-IN') : 'N/A'}
              </p>
            </div>
            <div className="bg-[#18181c] p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 text-[10px] font-bold uppercase">Status</span>
              <p className="font-bold text-zinc-300 mt-0.5 uppercase">{selectedTest.status || 'Active'}</p>
            </div>
            <div className="bg-[#18181c] p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 text-[10px] font-bold uppercase">Declared Date</span>
              <p className="font-bold text-emerald-400 mt-0.5 text-[11px]">
                {selectedTest.response_released_at ? new Date(selectedTest.response_released_at).toLocaleDateString('en-IN') : 'Not Yet'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Merit List / Rank Table */}
      <div className="bg-[#121215] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-[#18181c] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">All-India Merit List</h3>
          </div>
          <span className="text-xs text-zinc-400">Total Ranked Candidates: <strong>{meritList.length}</strong></span>
        </div>

        {meritList.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-2">
            <Award size={36} className="mx-auto text-zinc-600" />
            <p className="text-sm font-bold text-white">No Rankings Calculated Yet</p>
            <p className="text-xs text-zinc-500">
              Click &quot;Calculate Ranks&quot; above to compute scores and percentiles for submitted attempts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#141418] text-[10px] uppercase tracking-wider text-zinc-400 border-b border-white/5">
                <tr>
                  <th className="px-5 py-3 font-bold">AIR</th>
                  <th className="px-5 py-3 font-bold">Student Name</th>
                  <th className="px-5 py-3 font-bold">Email</th>
                  <th className="px-5 py-3 font-bold text-center">Raw Score</th>
                  <th className="px-5 py-3 font-bold text-center">Percentile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {meritList.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-zinc-800/30 transition">
                    <td className="px-5 py-3 font-extrabold text-amber-400">
                      #{row.rank_overall || idx + 1}
                    </td>
                    <td className="px-5 py-3 font-bold text-white">
                      {row.students?.full_name || row.name || 'Candidate'}
                    </td>
                    <td className="px-5 py-3 text-zinc-400 font-mono text-[11px]">
                      {row.students?.email || row.email || '—'}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-emerald-400">
                      {row.raw_score ?? 0}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-amber-400">
                      {row.percentile ? `${Number(row.percentile).toFixed(2)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
