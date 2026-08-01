import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

export function Calendar() {
  const token = useAuthStore((state) => state.token);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScheduledTests() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/admin/test-series`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();
        if (data.tests) setTests(data.tests);
      } catch (err) {
        console.error('Failed to fetch calendar tests:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchScheduledTests();
  }, [token]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="text-amber-400" /> Test Calendar & Schedule (24-Hour Allen Model)
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Live scheduled exam releases & 24h Allen Model test windows</p>
        </div>
      </div>

      {loading ? (
        <div className="text-white">Loading scheduled tests...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-neutral-800/50 border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-amber-400" /> Live Scheduled Upcoming Tests
            </h2>
            <div className="space-y-3">
              {tests.map((t) => (
                <div key={t.id} className="p-4 bg-neutral-900 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">{t.title}</div>
                    <div className="text-xs text-neutral-400 mt-1 space-x-2">
                      <span>Start: <strong>{formatDate(t.window_start)}</strong></span>
                      <span>•</span>
                      <span>End: <strong>{formatDate(t.window_end)}</strong></span>
                      <span>•</span>
                      <span>⏳ {t.duration_minutes || 180} mins</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-full text-xs font-semibold uppercase">
                    {t.exam_type || 'IAT'}
                  </span>
                </div>
              ))}
              {tests.length === 0 && (
                <div className="p-4 text-center text-neutral-400 text-sm">No tests scheduled in the calendar yet.</div>
              )}
            </div>
          </div>

          <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Schedule Overview</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              All paid test series papers follow the 24-hour Allen window. Students can attempt tests only inside the start and end dates configured in the Test Series management menu.
            </p>
            <a
              href="/test-series"
              className="w-full py-2.5 bg-amber-400 text-neutral-950 font-bold rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-amber-300 transition"
            >
              <Plus size={16} /> Schedule New Test
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
