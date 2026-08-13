import { useState, useEffect } from 'react';
import { FileUp, Trash2, Edit3 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

export function PyqPapers() {
  const token = useAuthStore((state) => state.token);
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPyqs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/pyq/list`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.papers) {
        setPapers(data.papers);
      }
    } catch (err) {
      console.error('Failed to fetch PYQ list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPyqs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this PYQ paper and all its questions?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/pyq/test/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        fetchPyqs();
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">PYQ Papers (Free Product)</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Past Year Papers — Unlimited Free Practice</p>
        </div>
        <a
          href="/paper-builder"
          className="flex items-center gap-2 bg-amber-400 text-neutral-950 px-4 py-2 rounded-lg font-bold hover:bg-amber-500 transition-colors shadow text-xs"
        >
          <FileUp size={18} />
          ⚡ Upload & Build Paper
        </a>
      </div>

      {loading ? (
        <div className="text-slate-600 dark:text-white">Loading PYQ papers...</div>
      ) : (
        <div className="bg-white dark:bg-neutral-800/50 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-700 dark:text-neutral-300">
            <thead className="bg-slate-50 dark:bg-neutral-900/50 text-xs uppercase text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">Exam Type</th>
                <th className="px-6 py-4 font-semibold">Year</th>
                <th className="px-6 py-4 font-semibold">Duration</th>
                <th className="px-6 py-4 font-semibold">Published</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {papers.map((p) => {
                const yearDisplay = p.pyq_year || (p.title && p.title.match(/\d{4}/) ? p.title.match(/\d{4}/)[0] : new Date(p.created_at).getFullYear());
                const isPublished = p.is_published || p.status === 'ongoing' || p.status === 'published';
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{p.title}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-neutral-300">{p.exam_type || 'IAT'}</td>
                    <td className="px-6 py-4 font-bold text-amber-600 dark:text-amber-400">{yearDisplay}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-neutral-400">{p.duration_minutes || 180} mins</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        isPublished
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                      }`}>
                        {isPublished ? '🟢 Published' : '📝 Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-3">
                      <a
                        href={`/paper-builder/${p.id}`}
                        className="px-3 py-1.5 bg-amber-400/20 text-amber-900 dark:text-amber-300 border border-amber-400/40 rounded-lg text-xs font-bold hover:bg-amber-400 hover:text-neutral-950 transition inline-flex items-center gap-1 shadow-sm"
                      >
                        <Edit3 size={13} /> Edit in Paper Builder
                      </a>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-1.5 bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition inline-flex items-center gap-1 shadow-sm"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {papers.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500 dark:text-neutral-400">No PYQ papers found. Upload a PDF to get started!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
