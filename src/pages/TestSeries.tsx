import { useState, useEffect } from 'react';
import { Plus, X, Eye, Lock, CheckCircle2, AlertCircle, Edit3, Trash2, Trophy, BarChart3, Send } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

export function TestSeries() {
  const token = useAuthStore((state) => state.token);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('IAT');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('180');
  const [description, setDescription] = useState('');

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/test-series`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.tests) {
        setTests(data.tests);
      }
    } catch (err) {
      console.error('Failed to fetch test series:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleExamTypeChange = (type: string) => {
    setExamType(type);
    if (type === 'CMI') setDuration('210');
    else setDuration('180');
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/test-series`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          title,
          name: title,
          exam_type: examType,
          window_start: startDate ? new Date(startDate + ':00+05:30').toISOString() : undefined,
          window_end: endDate ? new Date(endDate + ':00+05:30').toISOString() : undefined,
          duration_minutes: parseInt(duration) || 180,
          description: description || `${title} Scheduled Paper`
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setShowModal(false);
        fetchTests();
        setTitle(''); setExamType('IAT'); setStartDate(''); setEndDate(''); setDuration('180'); setDescription('');
      } else {
        alert('Error creating test series paper: ' + (data.error || data.message || 'Server error'));
      }
    } catch (err: any) {
      alert('Error creating test series paper: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFreezeTest = async (test: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/test-series/${test.id}/freeze`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert('✅ Test paper frozen successfully. No further edits allowed.');
        fetchTests();
      } else {
        alert('🔒 PREVIEW QUALITY GATE BLOCKED: ' + (data.error || 'Complete an admin preview run before freezing.'));
      }
    } catch (err: any) {
      alert('Error freezing test: ' + err.message);
    }
  };

  const handleDeleteTest = async (test: any) => {
    if (window.confirm('Are you sure you want to delete this test? This cannot be undone.')) {
      try {
        const res = await fetch(`${API_BASE}/api/admin/test-series/${test.id}`, {
          method: 'DELETE',
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        if (res.ok) {
          fetchTests();
        } else {
          alert('Failed to delete test');
        }
      } catch (err: any) {
        alert('Error deleting test: ' + err.message);
      }
    }
  };

  // 🏆 Calculate Rankings
  const handleCalculateRankings = async (test: any) => {
    if (!window.confirm(`Calculate rankings for "${test.title || test.name}"?\n\nThis computes All-India Ranks for all submitted attempts.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/results/calculate/${test.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Rankings calculated for ${data.count || 0} students!\nNow click "Release Results" to notify students.`);
        fetchTests();
      } else {
        alert('Failed: ' + (data.error || 'Server error'));
      }
    } catch (err: any) { alert('Error: ' + err.message); }
  };

  // 📢 Release Results — sets result_released_at and emails all students
  const handleReleaseResults = async (test: any) => {
    if (!window.confirm(`Release results for "${test.title || test.name}"?\n\n✓ Students can immediately see rank, score & answers\n✓ Email sent to all participants\n\nThis cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/results/release/${test.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Results Released! ${data.notified || 0} students notified via email.`);
        fetchTests();
      } else {
        alert('Failed: ' + (data.error || 'Server error'));
      }
    } catch (err: any) { alert('Error: ' + err.message); }
  };

  function getTestStatus(test: any) {
    const now = new Date();
    if (test.window_end && new Date(test.window_end) < now) return 'expired';
    if (test.window_start && new Date(test.window_start) > now) return 'upcoming';
    if (test.window_start && test.window_end && 
        new Date(test.window_start) <= now && new Date(test.window_end) >= now) return 'live';
    return test.status || 'draft';
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'expired': return 'bg-gray-500/15 text-gray-700 dark:text-gray-300';
      case 'upcoming': return 'bg-blue-500/15 text-blue-700 dark:text-blue-400';
      case 'live': return 'bg-green-500/15 text-green-700 dark:text-green-400';
      default: return 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-400';
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not Scheduled';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Test Series Management (Paid)</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">24-Hour Allen Model Schedule & Server-Enforced Preview Gate</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-400 text-neutral-950 px-4 py-2 rounded-lg font-bold hover:bg-amber-500 transition-colors shadow"
        >
          <Plus size={20} />
          Create Test Series Paper
        </button>
      </div>

      {loading ? (
        <div className="text-slate-600 dark:text-white">Loading test series papers...</div>
      ) : (
        <div className="bg-white dark:bg-neutral-800/50 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-700 dark:text-neutral-300">
            <thead className="bg-slate-50 dark:bg-neutral-900/50 text-xs uppercase text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">Exam Type</th>
                <th className="px-6 py-4 font-semibold">Window Start</th>
                <th className="px-6 py-4 font-semibold">Window End</th>
                <th className="px-6 py-4 font-semibold">Duration</th>
                <th className="px-6 py-4 font-semibold">Preview Gate</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Results</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {tests.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{t.title || t.name}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700 dark:text-neutral-300">{t.exam_type || 'IAT'}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-600 dark:text-neutral-400">{formatDate(t.window_start)}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-600 dark:text-neutral-400">{formatDate(t.window_end)}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-neutral-300">{t.duration_minutes || 180} mins</td>
                  <td className="px-6 py-4">
                    {t.preview_status === 'valid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 size={13} /> Validated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30">
                        <AlertCircle size={13} /> Preview Needed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono uppercase ${getStatusColor(getTestStatus(t))}`}>
                      {getTestStatus(t)}
                    </span>
                  </td>
                  {/* Results Release Column */}
                  <td className="px-6 py-4">
                    {getTestStatus(t) === 'expired' || getTestStatus(t) === 'live' ? (
                      t.result_released_at ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 size={12} /> Released
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => handleCalculateRankings(t)}
                            className="px-2.5 py-1 bg-blue-500/15 text-blue-800 dark:text-blue-400 border border-blue-500/30 rounded-lg text-[11px] font-bold hover:bg-blue-500 hover:text-white transition inline-flex items-center gap-1"
                          >
                            <BarChart3 size={11} /> Calc Ranks
                          </button>
                          <button
                            onClick={() => handleReleaseResults(t)}
                            className="px-2.5 py-1 bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold hover:bg-emerald-500 hover:text-white transition inline-flex items-center gap-1"
                          >
                            <Send size={11} /> Release Results
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <a
                      href={`/questions?testId=${t.id}`}
                      className="px-3 py-1.5 bg-amber-400/20 text-amber-900 dark:text-amber-300 border border-amber-400/40 rounded-lg text-xs font-bold hover:bg-amber-400 hover:text-neutral-950 transition inline-flex items-center gap-1 shadow-sm"
                    >
                      <Edit3 size={13} /> Questions
                    </a>
                    <a
                      href={`/preview/${t.id}`}
                      className="px-3 py-1.5 bg-blue-500/15 text-blue-800 dark:text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold hover:bg-blue-500 hover:text-white transition inline-flex items-center gap-1 shadow-sm"
                    >
                      <Eye size={13} /> Preview
                    </a>
                    {t.status !== 'frozen' && (
                      <button
                        onClick={() => handleFreezeTest(t)}
                        className="px-3 py-1.5 bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold hover:bg-amber-400 hover:text-neutral-950 transition inline-flex items-center gap-1 shadow-sm"
                      >
                        <Lock size={13} /> Freeze
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTest(t)}
                      className="px-3 py-1.5 bg-red-500/15 text-red-800 dark:text-red-400 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition inline-flex items-center gap-1 shadow-sm"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {tests.length === 0 && (
                <tr><td colSpan={8} className="p-4 text-center text-slate-500 dark:text-neutral-400">No scheduled test series papers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Test Series Paper</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1">Exam Type</label>
                <select required value={examType} onChange={e => handleExamTypeChange(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white">
                  <option value="IAT">IAT</option>
                  <option value="NEST">NEST</option>
                  <option value="CMI">CMI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1">Window Open Time (Start)</label>
                <input required type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1">Window Close Time (End)</label>
                <input required type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1">Duration (mins)</label>
                <input required type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1">Description</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white h-24" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-amber-400 text-neutral-950 font-bold py-2.5 rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50 shadow">
                {saving ? 'Saving...' : 'Save Scheduled Test'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
