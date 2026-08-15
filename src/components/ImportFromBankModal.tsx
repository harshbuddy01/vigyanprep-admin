import { useState, useEffect } from 'react';
import { X, Search, Check, Layers, AlertCircle, Loader2 } from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

interface ImportFromBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
  onSuccess: () => void;
}

export function ImportFromBankModal({
  isOpen,
  onClose,
  testId,
  onSuccess
}: ImportFromBankModalProps) {
  const token = useAuthStore((state) => state.token);

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [activeSection, setActiveSection] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchBankQuestions();
      setSelectedIds([]);
      setErrorMsg(null);
    }
  }, [isOpen, activeSection, selectedDifficulty]);

  const fetchBankQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        section: activeSection === 'All' ? '' : activeSection,
        difficulty: selectedDifficulty === 'All' ? '' : selectedDifficulty,
        search: searchTerm.trim()
      });

      const res = await fetch(`${API_BASE}/api/admin/questions/bank?${params}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch questions from bank:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map(q => q.id));
    }
  };

  const handleImport = async () => {
    if (selectedIds.length === 0) return;
    setImporting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/questions/bank/import-to-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          test_id: testId,
          question_ids: selectedIds
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import questions');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5">
      <div className="bg-[#121215] text-zinc-100 border border-zinc-700/60 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-fade-in font-sans">
        
        {/* Modal Header */}
        <div className="h-16 px-6 border-b border-zinc-800 flex items-center justify-between bg-[#18181c] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Import from Master Question Bank
              </h2>
              <p className="text-xs text-zinc-400">Select questions from your repository to instantly add to this test</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 bg-[#141418] border-b border-white/10 space-y-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            {['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology'].map(sec => (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  activeSection === sec
                    ? 'bg-amber-400 text-black'
                    : 'bg-[#18181b] text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchBankQuestions()}
                placeholder="Search keywords..."
                className="w-full bg-[#18181b] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-4 flex gap-2">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="flex-1 bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 rounded-lg border border-white/10 shrink-0"
              >
                {selectedIds.length === questions.length && questions.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        {/* Questions Grid / Selection List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 space-y-2">
              <Loader2 size={24} className="animate-spin mx-auto text-amber-400" />
              <p className="text-xs">Loading questions from bank...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <p className="text-sm font-bold text-white">No questions found in this category.</p>
              <p className="text-xs text-zinc-500 mt-1">Try another search or filter.</p>
            </div>
          ) : (
            questions.map((q) => {
              const isSelected = selectedIds.includes(q.id);
              const qText = q.question_text || q.text || '';
              return (
                <div
                  key={q.id}
                  onClick={() => handleToggleSelect(q.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3.5 ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/10 shadow-md shadow-amber-400/5'
                      : 'border-white/10 bg-[#151518] hover:border-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                    isSelected
                      ? 'bg-amber-400 border-amber-400 text-black font-black'
                      : 'border-zinc-600 bg-zinc-800'
                  }`}>
                    {isSelected && <Check size={14} />}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-amber-300">
                        {q.section}
                      </span>
                      {q.topic && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-zinc-400">
                          {q.topic}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500">
                        Diff: {q.difficulty || 'Medium'}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-200 leading-relaxed">
                      <MathRenderer text={qText} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#18181b]/90 flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-400">
            Selected: <strong className="text-amber-400 font-extrabold">{selectedIds.length}</strong> questions
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedIds.length === 0 || importing}
              className="px-5 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-400/20 flex items-center gap-2 transition"
            >
              {importing ? 'Importing...' : `Add (${selectedIds.length}) Questions to Test →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
