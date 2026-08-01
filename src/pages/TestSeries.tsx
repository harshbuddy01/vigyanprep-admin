import { useState, useEffect } from 'react';
import { Plus, X, Eye, Lock, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';
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
          window_start: startDate,
          window_end: endDate,
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not Scheduled';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
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
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono uppercase bg-slate-200 dark:bg-neutral-700 text-slate-800 dark:text-neutral-200">
                      {t.status || 'draft'}
                    </span>
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
