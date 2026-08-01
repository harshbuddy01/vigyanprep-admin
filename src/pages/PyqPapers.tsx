import { useState, useEffect } from 'react';
import { FileUp, Trash2 } from 'lucide-react';
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
          <h1 className="text-2xl font-bold text-white">PYQ Papers (Free Product)</h1>
          <p className="text-sm text-neutral-400">Past Year Papers — Unlimited Free Practice</p>
        </div>
        <a
          href="/pyq/upload"
          className="flex items-center gap-2 bg-amber-400 text-neutral-950 px-4 py-2 rounded-lg font-semibold hover:bg-amber-500 transition-colors"
        >
          <FileUp size={20} />
          Upload PYQ PDF
        </a>
      </div>

      {loading ? (
        <div className="text-white">Loading PYQ papers...</div>
      ) : (
        <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-900/50 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Exam Type</th>
                <th className="px-6 py-4">Year</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Published</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {papers.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{p.title}</td>
                  <td className="px-6 py-4">{p.exam_type || 'IAT'}</td>
                  <td className="px-6 py-4">{p.pyq_year || new Date(p.created_at).getFullYear()}</td>
                  <td className="px-6 py-4">{p.duration_minutes || 180} mins</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 font-semibold">
                      Published
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-3">
                    <a
                      href={`/questions?testId=${p.id}`}
                      className="px-3 py-1.5 bg-amber-400/10 text-amber-300 border border-amber-400/30 rounded-lg text-xs font-semibold hover:bg-amber-400 hover:text-neutral-950 transition inline-block"
                    >
                      ✏️ Edit Questions
                    </a>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold hover:bg-red-500 hover:text-white transition inline-flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {papers.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center">No PYQ papers found. Upload a PDF to get started!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
