import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Image as ImageIcon } from 'lucide-react';

export function QuestionChallenges() {
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [acceptModal, setAcceptModal] = useState<any>(null); // holds challenge id
  const [rejectModal, setRejectModal] = useState<any>(null); // holds challenge id

  const [newAnswer, setNewAnswer] = useState('');
  const [reply, setReply] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  useEffect(() => {
    supabase.from('tests').select('id, title').then(({ data }) => {
      if (data) {
        setTests(data);
        if (data.length > 0) setSelectedTestId(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedTestId) return;
    const loadChallenges = async () => {
      setLoading(true);
      try {
        const data = await api.getChallenges(selectedTestId);
        setChallenges(data.data || []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadChallenges();
  }, [selectedTestId]);

  const handleAccept = async () => {
    try {
      await api.acceptChallenge(acceptModal, newAnswer);
      alert('Challenge accepted successfully!');
      setAcceptModal(null);
      setChallenges(challenges.map(c => c.id === acceptModal ? { ...c, status: 'Accepted' } : c));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async () => {
    try {
      await api.rejectChallenge(rejectModal, reply, proofUrl);
      alert('Challenge rejected.');
      setRejectModal(null);
      setChallenges(challenges.map(c => c.id === rejectModal ? { ...c, status: 'Rejected' } : c));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">NTA Question Challenges</h1>
        <select
          value={selectedTestId}
          onChange={(e) => setSelectedTestId(e.target.value)}
          className="bg-neutral-900 border border-white/10 rounded-lg px-4 py-2 text-white"
        >
          <option value="" disabled>Select Test</option>
          {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-white">Loading challenges...</div>
      ) : (
        <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-900/50 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4">Question</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Proof Image</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{c.studentName}</td>
                  <td className="px-6 py-4">{c.rollNo}</td>
                  <td className="px-6 py-4">Q {c.questionNumber}</td>
                  <td className="px-6 py-4 max-w-xs truncate" title={c.reason}>{c.reason}</td>
                  <td className="px-6 py-4">
                    {c.proofImage ? (
                      <a href={c.proofImage} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline flex items-center gap-1">
                        <ImageIcon size={14} /> View
                      </a>
                    ) : 'None'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      c.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400' :
                      c.status === 'Rejected' ? 'bg-red-500/10 text-red-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {c.status === 'Pending' ? '🟡 Pending' : c.status === 'Accepted' ? '🟢 Accepted' : '🔴 Rejected'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    {c.status === 'Pending' && (
                      <>
                        <button onClick={() => setAcceptModal(c.id)} className="text-emerald-400 hover:underline">Accept</button>
                        <button onClick={() => setRejectModal(c.id)} className="text-red-400 hover:underline">Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {challenges.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center">No challenges for this test.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Accept Modal */}
      {acceptModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-4">Accept Challenge</h2>
            <div className="mb-4">
              <label className="block text-sm text-neutral-400 mb-1">Correct Answer</label>
              <input type="text" value={newAnswer} onChange={e => setNewAnswer(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="e.g. A, B, BONUS" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAcceptModal(null)} className="px-4 py-2 rounded text-neutral-400">Cancel</button>
              <button onClick={handleAccept} className="px-4 py-2 bg-emerald-500 text-white rounded font-semibold">Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-4">Reject Challenge</h2>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Explanation</label>
                <textarea value={reply} onChange={e => setReply(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Proof URL (optional)</label>
                <input type="text" value={proofUrl} onChange={e => setProofUrl(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 rounded text-neutral-400">Cancel</button>
              <button onClick={handleReject} className="px-4 py-2 bg-red-500 text-white rounded font-semibold">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
