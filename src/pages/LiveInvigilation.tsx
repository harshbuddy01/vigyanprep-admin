import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, RefreshCw, Users } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

export function LiveInvigilation() {
  const token = useAuthStore((state) => state.token);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [activeStudents, setActiveStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTests = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/test-series`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.tests && data.tests.length > 0) {
        setTests(data.tests);
        if (!selectedTestId) {
          setSelectedTestId(data.tests[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tests for invigilation:', err);
    }
  };

  const fetchActive = async () => {
    if (!selectedTestId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/results/attempts/${selectedTestId}?cb=${Date.now()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        const attempts = data.attempts || [];
        setActiveStudents(attempts.map((d: any) => ({
          id: d.id,
          name: d.student_name || 'Candidate',
          email: d.student_email,
          answersCount: d.attempted_count || 0,
          warningCount: d.warning_count || 0,
          status: d.status === 'submitted' ? '🟢 Submitted' : d.warning_count > 2 ? '🔴 3 Warnings' : d.warning_count > 0 ? '🟡 1-2 Warnings' : '🟢 Active',
          isSubmitted: d.status === 'submitted',
          startedAt: d.started_at ? new Date(d.started_at).toLocaleTimeString('en-IN') : '—',
          submittedAt: d.submitted_at ? new Date(d.submitted_at).toLocaleTimeString('en-IN') : '—'
        })));
      }
    } catch (err) {
      console.error('Failed to fetch live invigilation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [token]);

  useEffect(() => {
    if (selectedTestId) {
      fetchActive();
      const interval = setInterval(fetchActive, 10000); // 10s silent refresh
      return () => clearInterval(interval);
    }
  }, [selectedTestId, token]);

  const activeCount = activeStudents.filter(s => !s.isSubmitted).length;
  const submittedCount = activeStudents.filter(s => s.isSubmitted).length;
  const warningCount = activeStudents.filter(s => s.warningCount > 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-zinc-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Live Invigilation &amp; Proctoring</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/10 border border-amber-400/30 text-amber-400 uppercase tracking-wider">
              Real-Time
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time anti-cheat monitoring, candidate status, and tab-switch warning alerts
          </p>
        </div>

        {/* Test Selector Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="bg-[#18181c] border border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400 min-w-[220px]"
          >
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title || t.name} ({t.exam_type || 'IAT'})
              </option>
            ))}
          </select>

          <button
            onClick={fetchActive}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#121215] p-4 rounded-2xl border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Candidates</div>
          <div className="text-2xl font-black text-white mt-1">{activeStudents.length}</div>
        </div>
        <div className="bg-[#121215] p-4 rounded-2xl border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Active In-Progress</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</div>
        </div>
        <div className="bg-[#121215] p-4 rounded-2xl border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Submitted</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{submittedCount}</div>
        </div>
        <div className="bg-[#121215] p-4 rounded-2xl border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Warnings Flagged</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{warningCount}</div>
        </div>
      </div>

      {/* Candidate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeStudents.map((s) => (
          <div key={s.id} className="bg-[#121215] border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-white text-sm">{s.name}</h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{s.email}</p>
                </div>
                <div className="text-xs font-bold">{s.status}</div>
              </div>

              <div className="space-y-2 mt-4 text-xs text-zinc-300 bg-[#18181c] p-3 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-400"><Clock size={13} /> Started</span>
                  <span className="font-bold text-white">{s.startedAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-400"><CheckCircle size={13} /> Answers Recorded</span>
                  <span className="font-extrabold text-amber-400">{s.answersCount} / 60 Qs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-400"><AlertTriangle size={13} /> Anti-Cheat Warnings</span>
                  <span className={`font-bold ${s.warningCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {s.warningCount > 0 ? `${s.warningCount} / 3` : '0 Clean'}
                  </span>
                </div>
              </div>
            </div>

            {s.isSubmitted && (
              <div className="text-[11px] font-bold text-center text-emerald-400 bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20">
                ✅ Exam Successfully Submitted at {s.submittedAt}
              </div>
            )}
          </div>
        ))}

        {activeStudents.length === 0 && (
          <div className="col-span-full p-12 text-center text-zinc-500 bg-[#121215] border border-white/10 rounded-2xl space-y-2">
            <Users size={32} className="mx-auto text-zinc-600" />
            <p className="text-sm font-bold text-white">No Active Candidates Right Now</p>
            <p className="text-xs text-zinc-500">Live candidate sessions will appear here as students begin their test.</p>
          </div>
        )}
      </div>
    </div>
  );
}
