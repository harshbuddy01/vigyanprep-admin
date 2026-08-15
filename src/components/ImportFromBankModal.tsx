import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Layers, AlertCircle, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

interface ImportFromBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
  onSuccess: () => void;
  existingQuestions?: any[];
}

export function ImportFromBankModal({
  isOpen,
  onClose,
  testId,
  onSuccess,
  existingQuestions = []
}: ImportFromBankModalProps) {
  const token = useAuthStore((state) => state.token);

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [activeSection, setActiveSection] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hideAlreadyAdded, setHideAlreadyAdded] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to normalize question text for matching
  const normalize = (text: string) => (text || '').trim().replace(/\s+/g, ' ').toLowerCase();

  // Index existing questions in current paper by ID and normalized text
  const existingMap = useMemo(() => {
    const map = new Map<string, any>();
    (existingQuestions || []).forEach((eq: any) => {
      if (eq.id) map.set(eq.id, eq);
      const norm = normalize(eq.question_text || eq.text);
      if (norm) map.set(norm, eq);
    });
    return map;
  }, [existingQuestions]);

  const getExistingMatch = (q: any) => {
    if (existingMap.has(q.id)) return existingMap.get(q.id);
    const norm = normalize(q.question_text || q.text);
    if (norm && existingMap.has(norm)) return existingMap.get(norm);
    return null;
  };

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
        limit: '100',
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

  const alreadyAddedCount = useMemo(() => {
    return questions.filter(q => !!getExistingMatch(q)).length;
  }, [questions, existingMap]);

  const displayedQuestions = useMemo(() => {
    return questions.filter(q => {
      if (!hideAlreadyAdded) return true;
      return !getExistingMatch(q);
    });
  }, [questions, hideAlreadyAdded, existingMap]);

  const handleToggleSelect = (q: any) => {
    if (getExistingMatch(q)) return; // Locked: already in paper
    setSelectedIds(prev =>
      prev.includes(q.id) ? prev.filter(x => x !== q.id) : [...prev, q.id]
    );
  };

  const handleSelectAllVisible = () => {
    const selectable = displayedQuestions.filter(q => !getExistingMatch(q));
    const selectableIds = selectable.map(q => q.id);
    const allSelected = selectableIds.length > 0 && selectableIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !selectableIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...selectableIds])));
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

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 overflow-hidden">
      <div className="bg-[#121215] text-zinc-100 border border-zinc-700/80 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-fade-in font-sans relative z-10">
        
        {/* Modal Header */}
        <div className="h-16 px-6 border-b border-zinc-800 flex items-center justify-between bg-[#18181c] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Import from Master Question Bank
                {alreadyAddedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold">
                    {alreadyAddedCount} Already in Paper
                  </span>
                )}
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
          <div className="flex items-center justify-between gap-2 overflow-x-auto flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology'].map(sec => (
                <button
                  key={sec}
                  onClick={() => setActiveSection(sec)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                    activeSection === sec
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'bg-[#18181b] text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>

            {/* Smart Toggle: Hide Already Added Questions */}
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-white/10 hover:border-amber-400/40 transition shrink-0">
              <input
                type="checkbox"
                checked={hideAlreadyAdded}
                onChange={(e) => setHideAlreadyAdded(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-amber-400 focus:ring-0 cursor-pointer"
              />
              <span className="font-semibold text-zinc-200">
                Hide questions already in paper
              </span>
            </label>
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
                placeholder="Search keywords in questions..."
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
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 rounded-lg border border-white/10 shrink-0 cursor-pointer"
              >
                Select All
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
          ) : displayedQuestions.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 space-y-2">
              <p className="text-sm font-bold text-white">No available questions found in this category.</p>
              <p className="text-xs text-zinc-400">
                {hideAlreadyAdded && alreadyAddedCount > 0
                  ? `All ${alreadyAddedCount} questions in this category are already added to your test. Uncheck "Hide questions already in paper" to view them.`
                  : 'Try searching other subjects or add new questions to Master Question Bank.'}
              </p>
            </div>
          ) : (
            displayedQuestions.map((q) => {
              const isSelected = selectedIds.includes(q.id);
              const existingMatch = getExistingMatch(q);
              const isAlreadyInPaper = !!existingMatch;
              const qText = q.question_text || q.text || '';

              return (
                <div
                  key={q.id}
                  onClick={() => handleToggleSelect(q)}
                  className={`p-4 rounded-xl border transition flex items-start gap-3.5 ${
                    isAlreadyInPaper
                      ? 'border-emerald-500/40 bg-emerald-950/15 opacity-80 cursor-not-allowed'
                      : isSelected
                      ? 'border-amber-400 bg-amber-400/10 shadow-md shadow-amber-400/5 cursor-pointer'
                      : 'border-white/10 bg-[#151518] hover:border-white/20 cursor-pointer'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                    isAlreadyInPaper
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : isSelected
                      ? 'bg-amber-400 border-amber-400 text-black font-black'
                      : 'border-zinc-600 bg-zinc-800'
                  }`}>
                    {isAlreadyInPaper ? <Lock size={12} /> : isSelected && <Check size={14} />}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap justify-between">
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

                      {isAlreadyInPaper && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Already in Paper {existingMatch.question_number ? `(Q#${existingMatch.question_number})` : ''}
                        </span>
                      )}
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
            Selected: <strong className="text-amber-400 font-extrabold">{selectedIds.length}</strong> questions to add
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedIds.length === 0 || importing}
              className="px-5 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-400/20 flex items-center gap-2 transition cursor-pointer"
            >
              {importing ? 'Importing...' : `Add (${selectedIds.length}) Questions to Test →`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
