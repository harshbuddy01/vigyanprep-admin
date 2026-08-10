import { useState, useEffect } from 'react';
import { Plus, X, Eye, Lock, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

export function Tests() {
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
      const res = await fetch(`${API_BASE}/api/admin/pyq/list`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.tests) {
        setTests(data.tests);
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

  const handleExamTypeChange = (type: string) => {
    setExamType(type);
    if (type === 'CMI') setDuration('210');
    else setDuration('180');
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          title,
          name: title,
          exam_type: examType,
          duration_minutes: parseInt(duration) || 180,
          description: description || `${title} Test Paper`,
          window_start: startDate,
          window_end: endDate,
          scheduled_start: startDate,
          scheduled_end: endDate
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setShowModal(false);
        fetchTests();
        setTitle(''); setExamType('IAT'); setStartDate(''); setEndDate(''); setDuration('180'); setDescription('');
      } else {
        alert('Error creating test: ' + (data.error || data.message || 'Server error'));
      }
    } catch (err: any) {
      alert('Error creating test: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFreezeTest = async (test: any) => {
    if (test.preview_status !== 'valid') {
      const bypass = window.confirm(
        '⚠️ PREVIEW QUALITY GATE: You have not completed an admin preview run for this test.\n\nDo you want to bypass the quality gate and freeze/publish this test anyway?'
      );
      if (!bypass) return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/tests/${test.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ status: 'frozen' })
      });
      if (res.ok) {
        alert('✅ Test paper frozen successfully. No further edits allowed.');
        fetchTests();
      }
    } catch (err: any) {
      alert('Error freezing test: ' + err.message);
    }
  };

  const handleDeleteTest = async (test: any) => {
    if (window.confirm('Are you sure you want to delete this test? This cannot be undone.')) {
      try {
        const res = await fetch(`${API_BASE}/api/admin/tests/${test.id}`, {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tests & Scheduling Management</h1>
          <p className="text-sm text-neutral-400">Manage 24h Allen Model Test Pipeline & Preview Gates</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-400 text-neutral-950 px-4 py-2 rounded-lg font-semibold hover:bg-amber-500 transition-colors"
        >
          <Plus size={20} />
          Create Test
        </button>
      </div>

      {loading ? (
        <div className="text-white">Loading tests...</div>
      ) : (
        <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-900/50 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Test Title</th>
                <th className="px-6 py-4">Exam Type</th>
                <th className="px-6 py-4">Preview Gate</th>
                <th className="px-6 py-4">Pipeline Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{t.title || t.name}</td>
                  <td className="px-6 py-4">{t.exam_type || t.test_type || 'IAT'}</td>
                  <td className="px-6 py-4">
                    {t.preview_status === 'valid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={13} /> Validated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertCircle size={13} /> Preview Needed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono uppercase bg-neutral-700 text-neutral-200">
                      {t.status || 'draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <a
                      href={`/preview/${t.id}`}
                      className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold hover:bg-blue-500 hover:text-white transition inline-flex items-center gap-1"
                    >
                      <Eye size={13} /> Preview
                    </a>
                    {t.status !== 'frozen' && (
                      <button
                        onClick={() => handleFreezeTest(t)}
                        className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold hover:bg-amber-400 hover:text-neutral-950 transition inline-flex items-center gap-1"
                      >
                        <Lock size={13} /> Freeze
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTest(t)}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold hover:bg-red-500 hover:text-white transition inline-flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {tests.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center">No tests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create New Test</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Exam Type</label>
                <select required value={examType} onChange={e => handleExamTypeChange(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white">
                  <option value="IAT">IAT</option>
                  <option value="NEST">NEST</option>
                  <option value="CMI">CMI</option>
                  <option value="PYQ">PYQ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Start Date/Time</label>
                <input required type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">End Date/Time</label>
                <input required type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Duration (mins)</label>
                <input required type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Description</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white h-24" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-amber-400 text-neutral-950 font-semibold py-2 rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Test'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
