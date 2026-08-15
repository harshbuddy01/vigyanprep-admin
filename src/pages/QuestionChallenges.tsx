import { useState, useEffect } from 'react';
import { Image as ImageIcon, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

export function QuestionChallenges() {
  const token = useAuthStore((state) => state.token);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [acceptModal, setAcceptModal] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);

  const [newAnswer, setNewAnswer] = useState('');
  const [reply, setReply] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  const fetchTests = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/test-series`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.tests) {
        setTests(data.tests);
        if (data.tests.length > 0 && !selectedTestId) {
          setSelectedTestId(data.tests[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tests:', err);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const loadChallenges = async (testId: string) => {
    if (!testId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/challenges/test/${testId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || data.data || []);
      } else {
        setChallenges([]);
      }
    } catch (err) {
      console.error(err);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTestId) {
      loadChallenges(selectedTestId);
    }
  }, [selectedTestId]);

  const handleAccept = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/challenges/accept/${acceptModal}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ newAnswer })
      });
      if (res.ok) {
        alert('Challenge accepted successfully!');
        setAcceptModal(null);
        loadChallenges(selectedTestId);
      } else {
        alert('Failed to accept challenge');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/challenges/reject/${rejectModal}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ reply, proofUrl })
      });
      if (res.ok) {
        alert('Challenge rejected.');
        setRejectModal(null);
        loadChallenges(selectedTestId);
      } else {
        alert('Failed to reject challenge');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-zinc-100 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Question Reports &amp; Challenges</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/10 border border-amber-400/30 text-amber-400 uppercase tracking-wider">
              NTA Challenge System
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Review student-submitted answer key challenges and rectify keys</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="bg-[#18181c] border border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400 min-w-[240px]"
          >
            {tests.length === 0 ? (
              <option value="">No tests found</option>
            ) : (
              tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title || t.name} ({t.exam_type || 'IAT'})
                </option>
              ))
            )}
          </select>

          <button
            onClick={() => { fetchTests(); if (selectedTestId) loadChallenges(selectedTestId); }}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
            title="Refresh List"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-zinc-500 bg-[#121215] border border-white/10 rounded-2xl">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-zinc-400">Loading student reports...</p>
        </div>
      ) : (
        <div className="bg-[#121215] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-[#18181c] text-[10px] uppercase tracking-wider text-zinc-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5 font-bold">Student Name</th>
                <th className="px-5 py-3.5 font-bold">Roll / Email</th>
                <th className="px-4 py-3.5 font-bold text-center">Question</th>
                <th className="px-6 py-3.5 font-bold">Reason / Grievance</th>
                <th className="px-4 py-3.5 font-bold text-center">Proof</th>
                <th className="px-4 py-3.5 font-bold text-center">Status</th>
                <th className="px-5 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {challenges.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-800/30 transition">
                  <td className="px-5 py-4 font-bold text-white">{c.studentName || c.students?.full_name || 'Student'}</td>
                  <td className="px-5 py-4 text-zinc-400 font-mono text-[11px]">{c.rollNo || c.students?.email || '—'}</td>
                  <td className="px-4 py-4 text-center font-bold text-amber-400">Q {c.questionNumber || c.question_number || c.question_id}</td>
                  <td className="px-6 py-4 max-w-sm truncate text-zinc-300" title={c.reason || c.description}>
                    {c.reason || c.description}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {(c.proofImage || c.proof_url) ? (
                      <a href={c.proofImage || c.proof_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 font-bold flex items-center justify-center gap-1">
                        <ImageIcon size={13} /> View
                      </a>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      c.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      c.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {c.status === 'Pending' ? '🟡 Pending' : c.status === 'Accepted' ? '🟢 Accepted' : '🔴 Rejected'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    {c.status === 'Pending' ? (
                      <>
                        <button onClick={() => setAcceptModal(c.id)} className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500 hover:text-black transition">
                          Accept
                        </button>
                        <button onClick={() => setRejectModal(c.id)} className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold hover:bg-red-500 hover:text-white transition">
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-zinc-600 text-xs">Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
              {challenges.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-zinc-500">
                    <AlertTriangle size={32} className="mx-auto mb-2 text-zinc-600" />
                    <p className="text-xs font-bold text-zinc-400">No question challenges filed for this test paper.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Accept Modal */}
      {acceptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#121215] border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" /> Accept Question Challenge
            </h2>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">New Official Correct Answer</label>
              <input
                type="text"
                value={newAnswer}
                onChange={e => setNewAnswer(e.target.value)}
                className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white uppercase font-bold focus:outline-none focus:border-amber-400"
                placeholder="e.g. A, B, C, D or BONUS"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setAcceptModal(null)} className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl">Cancel</button>
              <button onClick={handleAccept} className="px-5 py-2 bg-emerald-500 text-black text-xs font-extrabold rounded-xl shadow">Accept &amp; Update Key</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#121215] border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle size={18} className="text-red-400" /> Reject Question Challenge
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Explanation / Rebuttal</label>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  rows={3}
                  className="w-full bg-[#18181c] border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                  placeholder="Explain why the current key is mathematically / conceptually correct..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Proof URL (optional)</label>
                <input
                  type="text"
                  value={proofUrl}
                  onChange={e => setProofUrl(e.target.value)}
                  className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                  placeholder="Link to textbook derivation or reference..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl">Cancel</button>
              <button onClick={handleReject} className="px-5 py-2 bg-red-500 text-white text-xs font-extrabold rounded-xl shadow">Reject Challenge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
