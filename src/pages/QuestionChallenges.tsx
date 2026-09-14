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

  const [processing, setProcessing] = useState(false);

  const handleAccept = async () => {
    if (!acceptModal) return;
    if (!newAnswer.trim()) {
      alert('Please provide the new official answer key (e.g. B, A,C, or BONUS)');
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/challenges/accept/${acceptModal}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ newAnswer: newAnswer.trim().toUpperCase() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Challenge accepted successfully!\n\nAnswer key updated to "${data.newAnswer || newAnswer}". Scores and percentiles recalculated for all students.`);
        setAcceptModal(null);
        setNewAnswer('');
        loadChallenges(selectedTestId);
      } else {
        alert(data.error || 'Failed to accept challenge');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/challenges/reject/${rejectModal}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ reply, proofUrl, admin_reply: reply, admin_proof_url: proofUrl })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Challenge rejected.');
        setRejectModal(null);
        setReply('');
        setProofUrl('');
        loadChallenges(selectedTestId);
      } else {
        alert(data.error || 'Failed to reject challenge');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const selectedAcceptChallenge = challenges.find(c => c.id === acceptModal);
  const selectedRejectChallenge = challenges.find(c => c.id === rejectModal);

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
          <p className="text-xs text-zinc-400 mt-1">Review student-submitted answer key challenges, rectify keys, and automatically recalculate test scores</p>
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
              {challenges.map((c) => {
                const statusLower = (c.status || '').toLowerCase();
                const isPending = statusLower === 'pending';
                const isAccepted = statusLower === 'accepted';
                const isRejected = statusLower === 'rejected';

                return (
                  <tr key={c.id} className="hover:bg-zinc-800/30 transition">
                    <td className="px-5 py-4 font-bold text-white">
                      {c.studentName || c.student_name || c.students?.full_name || 'Student'}
                    </td>
                    <td className="px-5 py-4 text-zinc-400 font-mono text-[11px]">
                      <div>{c.rollNo || c.roll_number || '—'}</div>
                      <div className="text-[10px] text-zinc-500">{c.studentEmail || c.student_email || c.students?.email || ''}</div>
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-amber-400">
                      <div>Q {c.questionNumber || c.question_number || (c.question_id ? c.question_id.slice(0, 8) : '—')}</div>
                      {c.current_correct_answer && (
                        <div className="text-[10px] font-normal text-zinc-500">Key: {c.current_correct_answer}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-sm text-zinc-300" title={c.reason || c.description}>
                      <div className="line-clamp-2">{c.reason || c.description}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {(c.proofImage || c.proofUrl || c.proof_image_url) ? (
                        <a
                          href={c.proofImage || c.proofUrl || c.proof_image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1"
                        >
                          <ImageIcon size={13} /> View
                        </a>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                        isAccepted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        isRejected ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {isAccepted ? '🟢 Accepted' : isRejected ? '🔴 Rejected' : '🟡 Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setAcceptModal(c.id);
                              setNewAnswer(c.current_correct_answer || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500 hover:text-black transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              setRejectModal(c.id);
                              setReply('');
                              setProofUrl('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold hover:bg-red-500 hover:text-white transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-xs font-semibold">
                          {isAccepted ? `Key: ${c.new_answer || c.current_correct_answer || 'Updated'}` : 'Resolved'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
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
            
            {selectedAcceptChallenge && (
              <div className="bg-[#18181c] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 space-y-1.5">
                <div className="flex justify-between font-bold text-white">
                  <span className="text-amber-400">Question #{selectedAcceptChallenge.question_number || selectedAcceptChallenge.questionNumber || '—'}</span>
                  <span>Current Key: <span className="text-emerald-400">{selectedAcceptChallenge.current_correct_answer || '—'}</span></span>
                </div>
                {selectedAcceptChallenge.question_text && (
                  <p className="text-[11px] text-zinc-400 line-clamp-3 italic">
                    "{selectedAcceptChallenge.question_text}"
                  </p>
                )}
                <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
                  <span className="font-semibold text-zinc-300">Student Claim:</span> {selectedAcceptChallenge.reason}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">New Official Correct Answer Key</label>
              <input
                type="text"
                value={newAnswer}
                onChange={e => setNewAnswer(e.target.value)}
                className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white uppercase font-bold focus:outline-none focus:border-amber-400"
                placeholder="e.g. B, A,C or BONUS"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Tip: Enter <code className="text-amber-400">BONUS</code> if the question has an error and all candidates should be awarded full marks, or separate options with a comma (e.g. <code className="text-amber-400">A,C</code>).
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                disabled={processing}
                onClick={() => setAcceptModal(null)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                disabled={processing}
                onClick={handleAccept}
                className="px-5 py-2 bg-emerald-500 text-black text-xs font-extrabold rounded-xl shadow hover:bg-emerald-400 transition disabled:opacity-50"
              >
                {processing ? 'Recalculating Scores...' : 'Accept & Recalculate Scores'}
              </button>
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

            {selectedRejectChallenge && (
              <div className="bg-[#18181c] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 space-y-1">
                <span className="font-bold text-amber-400">Question #{selectedRejectChallenge.question_number || '—'}</span>
                <p className="text-[11px] text-zinc-400">{selectedRejectChallenge.reason}</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Explanation / Academic Rebuttal</label>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  rows={3}
                  className="w-full bg-[#18181c] border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                  placeholder="Explain why the current key is scientifically / conceptually correct..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Proof / Reference URL (optional)</label>
                <input
                  type="text"
                  value={proofUrl}
                  onChange={e => setProofUrl(e.target.value)}
                  className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                  placeholder="Link to standard textbook reference or NCERT derivation..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                disabled={processing}
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                disabled={processing}
                onClick={handleReject}
                className="px-5 py-2 bg-red-500 text-white text-xs font-extrabold rounded-xl shadow hover:bg-red-400 transition disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Reject Challenge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
