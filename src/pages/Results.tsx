import { useState, useEffect } from 'react';
import {
  Trophy, Send, BarChart3, CheckCircle2, AlertCircle, RefreshCw, Award,
  Users, X, CheckCircle, XCircle, FileText, Search
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { MathRenderer } from '../components/MathRenderer';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

function formatImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  return trimmed;
}

export function Results() {
  const token = useAuthStore((state) => state.token);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [selectedTest, setSelectedTest] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'attempts' | 'merit'>('attempts');
  
  // Data states
  const [attempts, setAttempts] = useState<any[]>([]);
  const [meritList, setMeritList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Response Sheet Drawer Modal
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalSubject, setModalSubject] = useState('Physics');

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
      fetchAttempts(selectedTestId);
      fetchMeritList(selectedTestId);
    }
  }, [selectedTestId, tests]);

  // 🔄 Silent Live 10-Second Auto-Refresh Polling for Real-Time Proctoring & Submissions
  useEffect(() => {
    if (!selectedTestId) return;

    const interval = setInterval(() => {
      fetchAttempts(selectedTestId);
      if (activeTab === 'merit') {
        fetchMeritList(selectedTestId);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [selectedTestId, activeTab]);

  const fetchAttempts = async (testId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/results/admin/attempts/${testId}?cb=${Date.now()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        setAttempts(data.attempts || []);
      } else {
        setAttempts([]);
      }
    } catch {
      setAttempts([]);
    }
  };

  const fetchMeritList = async (testId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/results/merit-list/${testId}?cb=${Date.now()}`, {
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

  const handleOpenAttemptDetail = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setDetailLoading(true);
    setAttemptDetail(null);
    try {
      const res = await fetch(`${API_BASE}/api/results/admin/attempt-detail/${attemptId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        setAttemptDetail(data);
      }
    } catch (err) {
      console.error('Failed to load candidate attempt details:', err);
    } finally {
      setDetailLoading(false);
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
        fetchAttempts(selectedTestId);
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

  const filteredAttempts = attempts.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.student_name || '').toLowerCase().includes(q) ||
      (a.student_email || '').toLowerCase().includes(q) ||
      (a.status || '').toLowerCase().includes(q)
    );
  });

  const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-zinc-100 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Exam Candidates &amp; Results Hub</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/10 border border-amber-400/30 text-amber-400 uppercase tracking-wider">
              Live CBT Control
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Monitor real-time candidate attempts, view individual response sheets, and declare official All-India Ranks
          </p>
        </div>

        {/* Test Selector Dropdown & Live Status */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live 10s Sync</span>
          </div>

          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="bg-[#18181c] border border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400 min-w-[220px]"
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
            onClick={() => {
              if (selectedTestId) {
                fetchAttempts(selectedTestId);
                fetchMeritList(selectedTestId);
              }
            }}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition cursor-pointer"
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <BarChart3 size={14} /> Calculate Ranks
              </button>

              <button
                onClick={handleReleaseResults}
                disabled={actionLoading || isReleased}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send size={14} /> {isReleased ? 'Results Already Released' : 'Release Results to Students'}
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#18181c] p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 text-[10px] font-bold uppercase">Live Students</span>
              <p className="font-bold text-white mt-0.5 text-base">{attempts.length} Attempted</p>
            </div>
            <div className="bg-[#18181c] p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 text-[10px] font-bold uppercase">Submitted</span>
              <p className="font-bold text-emerald-400 mt-0.5 text-base">
                {attempts.filter(a => a.status === 'submitted').length} Completed
              </p>
            </div>
            <div className="bg-[#18181c] p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 text-[10px] font-bold uppercase">Duration</span>
              <p className="font-bold text-zinc-300 mt-0.5">{selectedTest.duration_minutes || 180} mins</p>
            </div>
            <div className="bg-[#18181c] p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 text-[10px] font-bold uppercase">Declared Date</span>
              <p className="font-bold text-amber-400 mt-0.5 text-[11px]">
                {selectedTest.response_released_at ? new Date(selectedTest.response_released_at).toLocaleString('en-IN') : 'After 09:00 PM'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('attempts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'attempts'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            <Users size={15} />
            <span>Live Candidate Attempts ({attempts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('merit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'merit'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy size={15} />
            <span>Declared Merit List ({meritList.length})</span>
          </button>
        </div>

        {activeTab === 'attempts' && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search candidate name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#18181c] border border-zinc-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 w-64"
            />
          </div>
        )}
      </div>

      {/* TAB 1: LIVE CANDIDATE ATTEMPTS */}
      {activeTab === 'attempts' && (
        <div className="bg-[#121215] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-[#18181c] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white">Candidate Attempts &amp; Submission Progress</h3>
            </div>
            <span className="text-xs text-zinc-400">Total Attempts: <strong>{attempts.length}</strong></span>
          </div>

          {filteredAttempts.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 space-y-2">
              <Users size={36} className="mx-auto text-zinc-600" />
              <p className="text-sm font-bold text-white">No Student Attempts Found</p>
              <p className="text-xs text-zinc-500">
                When students start or submit their test, their names, attempted question counts, and response sheets will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#141418] text-[10px] uppercase tracking-wider text-zinc-400 border-b border-white/5">
                  <tr>
                    <th className="px-5 py-3 font-bold">Candidate</th>
                    <th className="px-5 py-3 font-bold">Email</th>
                    <th className="px-5 py-3 font-bold text-center">Status</th>
                    <th className="px-5 py-3 font-bold text-center">Questions Answered</th>
                    <th className="px-5 py-3 font-bold text-center">Proctor Warnings</th>
                    <th className="px-5 py-3 font-bold">Started At</th>
                    <th className="px-5 py-3 font-bold">Submitted At</th>
                    <th className="px-5 py-3 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {filteredAttempts.map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-800/30 transition">
                      <td className="px-5 py-3 font-bold text-white">
                        {a.student_name || 'Candidate'}
                      </td>
                      <td className="px-5 py-3 text-zinc-400 font-mono text-[11px]">
                        {a.student_email}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {a.status === 'submitted' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            🟢 Submitted
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            🟡 In Progress
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="font-extrabold text-amber-400">{a.attempted_count}</span>
                        <span className="text-zinc-500 text-[10px]"> / 60 Qs</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {a.warning_count > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/40">
                            {a.warning_count} / 3
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold">0 Clean</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-zinc-400 text-[11px]">
                        {a.started_at ? new Date(a.started_at).toLocaleTimeString('en-IN') : '—'}
                      </td>
                      <td className="px-5 py-3 text-zinc-400 text-[11px]">
                        {a.submitted_at ? new Date(a.submitted_at).toLocaleTimeString('en-IN') : '—'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handleOpenAttemptDetail(a.id)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs rounded-lg border border-amber-400/30 transition flex items-center gap-1.5 mx-auto cursor-pointer shadow-sm"
                        >
                          <FileText size={13} />
                          <span>View Response Sheet</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MERIT LIST / RANK TABLE */}
      {activeTab === 'merit' && (
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
      )}

      {/* 📄 CANDIDATE RESPONSE SHEET MODAL */}
      {selectedAttemptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#121215] border border-white/20 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 bg-[#18181c] border-b border-zinc-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-white">Candidate Official Response Sheet</h3>
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-extrabold text-[10px] border border-amber-400/30 uppercase">
                    Admin Inspector
                  </span>
                </div>
                {attemptDetail && (
                  <p className="text-xs text-zinc-400 mt-1">
                    Candidate: <strong className="text-white">{attemptDetail.studentName}</strong> ({attemptDetail.studentEmail}) • Total Attempted: <strong className="text-emerald-400">{attemptDetail.attempted_count} / {attemptDetail.total_questions} Questions</strong>
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedAttemptId(null)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="p-12 text-center text-zinc-400 space-y-3">
                  <RefreshCw size={24} className="animate-spin mx-auto text-amber-400" />
                  <p className="text-xs font-bold">Loading candidate questions and recorded responses...</p>
                </div>
              ) : attemptDetail?.questions ? (
                <>
                  {/* Subject Tabs */}
                  <div className="flex border-b border-zinc-800 pb-2 gap-2 overflow-x-auto">
                    {subjects.map(sec => {
                      const secQs = attemptDetail.questions.filter((q: any) => q.section === sec || (!subjects.includes(q.section) && sec === 'Physics'));
                      const ansCount = secQs.filter((q: any) => q.studentAnswer).length;
                      return (
                        <button
                          key={sec}
                          onClick={() => setModalSubject(sec)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            modalSubject === sec
                              ? 'bg-[#1e1e24] text-amber-400 border border-amber-400/30'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {sec} ({ansCount}/{secQs.length})
                        </button>
                      );
                    })}
                  </div>

                  {/* Question Rows */}
                  <div className="space-y-4">
                    {attemptDetail.questions
                      .filter((q: any) => q.section === modalSubject || (!subjects.includes(q.section) && modalSubject === 'Physics'))
                      .map((q: any, idx: number) => {
                        const studentAns = q.studentAnswer;
                        const correctAns = q.correct_answer;
                        const opts = q.options && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'];
                        const optLabels = ['A', 'B', 'C', 'D'];

                        return (
                          <div key={q.id} className="p-5 rounded-2xl bg-[#18181c] border border-white/5 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-amber-400">
                                  {q.question_number || idx + 1}
                                </span>
                                <span className="text-[11px] font-bold text-zinc-400">{q.section}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {studentAns ? (
                                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                    studentAns === correctAns
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}>
                                    Candidate Picked: <strong>{studentAns}</strong>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-500 border border-zinc-700">
                                    Not Attempted
                                  </span>
                                )}

                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                  Key: {correctAns || '—'}
                                </span>
                              </div>
                            </div>

                            {/* Question Text & Diagram */}
                            <div className="text-xs text-zinc-200 leading-relaxed">
                              <MathRenderer text={q.question_text || q.text || ''} />
                            </div>

                            {q.image_url && (
                              <div className="my-2">
                                <img src={formatImageUrl(q.image_url)} alt="diagram" className="max-h-48 object-contain rounded-xl border border-zinc-800" />
                              </div>
                            )}

                            {/* Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                              {opts.map((opt: string, oi: number) => {
                                const label = optLabels[oi];
                                const isSelected = studentAns === label;
                                const isKey = correctAns === label;

                                let borderClass = 'border-zinc-800 bg-[#121215] text-zinc-400';
                                if (isKey) borderClass = 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300 font-bold';
                                if (isSelected && !isKey) borderClass = 'border-red-500/50 bg-red-950/20 text-red-300 font-bold';

                                return (
                                  <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${borderClass}`}>
                                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-zinc-800 text-zinc-300">
                                      {label}
                                    </span>
                                    <div className="flex-1">
                                      <MathRenderer text={opt} />
                                    </div>
                                    {isKey && <CheckCircle size={14} className="text-emerald-400 shrink-0" />}
                                    {isSelected && !isKey && <XCircle size={14} className="text-red-400 shrink-0" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-zinc-500">
                  <p className="text-xs">No questions loaded for this attempt.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#18181c] border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedAttemptId(null)}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
