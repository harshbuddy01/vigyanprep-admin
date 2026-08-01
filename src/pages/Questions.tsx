import { useState, useEffect } from 'react';
import { Search, Edit3, Trash2, CheckCircle, Image, AlertCircle, Save, Settings, X, Plus, Eye } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { MathRenderer } from '../components/MathRenderer';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

function formatImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  return trimmed;
}

type QuestionItem = {
  id: string;
  test_id?: string;
  test_series_id?: string;
  section: string;
  question_number: number;
  question_text: string;
  type?: string;
  question_type?: string;
  options: string[];
  correct_answer: string;
  image_url?: string;
};

export function Questions() {
  const token = useAuthStore((state) => state.token);
  const [pyqPapers, setPyqPapers] = useState<any[]>([]);
  const [testSeriesPapers, setTestSeriesPapers] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [activeTab, setActiveTab] = useState('Physics');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit & Delete Test Modal States
  const [showEditTestModal, setShowEditTestModal] = useState(false);
  const [editTestTitle, setEditTestTitle] = useState('');
  const [editExamType, setEditExamType] = useState('IAT');
  const [editDuration, setEditDuration] = useState(180);
  const [deletingTest, setDeletingTest] = useState(false);

  // Read ?testId from URL
  const urlTestId = new URLSearchParams(window.location.search).get('testId');

  // Fetch tests separated by PYQ vs Test Series
  const fetchTests = async () => {
    setLoadingTests(true);
    try {
      const [pyqRes, tsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/pyq/list`, { headers: { Authorization: token ? `Bearer ${token}` : '' } }),
        fetch(`${API_BASE}/api/admin/test-series`, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      ]);

      const pyqData = await pyqRes.json();
      const tsData = await tsRes.json();

      const pyqs = pyqData.papers || [];
      const testSeries = tsData.tests || [];

      setPyqPapers(pyqs);
      setTestSeriesPapers(testSeries);

      const allPapers = [...pyqs, ...testSeries];
      const uniqueMap = new Map();
      allPapers.forEach(p => { if (p && p.id) uniqueMap.set(p.id, p); });

      if (urlTestId && uniqueMap.has(urlTestId)) {
        setSelectedTestId(urlTestId);
      } else if (allPapers.length > 0) {
        setSelectedTestId(allPapers[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load tests:', err);
    } finally {
      setLoadingTests(false);
    }
  };

  // Fetch questions for selected test
  const fetchQuestions = async (testId: string) => {
    if (!testId) return;
    setLoadingQuestions(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/pyq/test/${testId}/questions`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err: any) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    if (selectedTestId) {
      fetchQuestions(selectedTestId);
      const all = [...pyqPapers, ...testSeriesPapers];
      const currentTest = all.find(t => t.id === selectedTestId);
      if (currentTest) {
        setEditTestTitle(currentTest.title || currentTest.name || '');
        setEditExamType(currentTest.exam_type || currentTest.test_type || 'IAT');
        setEditDuration(currentTest.duration_minutes || 180);
      }
    }
  }, [selectedTestId, pyqPapers, testSeriesPapers]);

  const handleFieldChange = (id: string, field: string, value: any) => {
    setQuestions(prev =>
      prev.map(q => {
        if (q.id !== id) return q;
        if (field === 'image_url') {
          return { ...q, image_url: formatImageUrl(value) };
        }
        return { ...q, [field]: value };
      })
    );
  };

  const handleOptionChange = (id: string, optIdx: number, value: string) => {
    setQuestions(prev =>
      prev.map(q => {
        if (q.id !== id) return q;
        const newOpts = [...(q.options || [])];
        newOpts[optIdx] = value;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleAddQuestionToPaper = async () => {
    if (!selectedTestId) {
      alert('Please select a test paper first.');
      return;
    }

    try {
      const nextNum = questions.length + 1;
      const newQ = {
        test_id: selectedTestId,
        section: activeTab,
        question_number: nextNum,
        question_text: `New ${activeTab} Question ${nextNum}... (e.g. $E=mc^2$)`,
        type: 'MCQ',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: 'A',
        image_url: null
      };

      const response = await fetch(`${API_BASE}/api/admin/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(newQ)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Question ${nextNum} added to paper!` });
        fetchQuestions(selectedTestId);
      } else {
        const tempObj: QuestionItem = {
          id: `temp_${Date.now()}`,
          test_id: selectedTestId,
          section: activeTab,
          question_number: nextNum,
          question_text: `New ${activeTab} Question ${nextNum}... (e.g. $E=mc^2$)`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correct_answer: 'A'
        };
        setQuestions(prev => [...prev, tempObj]);
        setEditingQId(tempObj.id);
      }
    } catch (err: any) {
      alert('Failed to add question');
    }
  };

  const handleSaveQuestion = async (q: QuestionItem) => {
    setSavingId(q.id);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/api/admin/pyq/question/${q.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          section: q.section,
          image_url: q.image_url
        })
      });

      if (!response.ok) throw new Error('Failed to update question');
      setMessage({ type: 'success', text: `Question ${q.question_number} updated successfully` });
      setEditingQId(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error saving question' });
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteQuestion = async (id: string, qNum: number) => {
    if (!window.confirm(`Are you sure you want to delete Question ${qNum}?`)) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/pyq/question/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!response.ok) throw new Error('Failed to delete question');
      setQuestions(prev => prev.filter(q => q.id !== id));
      setMessage({ type: 'success', text: `Question ${qNum} deleted successfully` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error deleting question' });
    }
  };

  const handleUpdateTest = async () => {
    if (!selectedTestId || !editTestTitle.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/pyq/test/${selectedTestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          title: editTestTitle,
          examType: editExamType,
          durationMinutes: editDuration
        })
      });
      if (!response.ok) throw new Error('Failed to update test details');
      setMessage({ type: 'success', text: 'Test paper details updated successfully!' });
      setShowEditTestModal(false);
      fetchTests();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating test' });
    }
  };

  const handleDeleteTest = async () => {
    const all = [...pyqPapers, ...testSeriesPapers];
    const currentTest = all.find(t => t.id === selectedTestId);
    if (!currentTest) return;
    if (!window.confirm(`⚠️ Are you sure you want to DELETE "${currentTest.title || currentTest.name}"?\n\nThis will remove the test paper and all its questions permanently.`)) {
      return;
    }
    setDeletingTest(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/pyq/test/${selectedTestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!response.ok) throw new Error('Failed to delete test paper');
      setMessage({ type: 'success', text: 'Test paper deleted from database and website.' });
      setSelectedTestId('');
      fetchTests();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error deleting test' });
    } finally {
      setDeletingTest(false);
    }
  };

  const sections = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

  const matchSection = (qSection: string | undefined, targetSection: string) => {
    if (!qSection) return targetSection === 'Physics';
    const qNorm = qSection.trim().toLowerCase();
    const targetNorm = targetSection.toLowerCase();
    const validNorms = sections.map(s => s.toLowerCase());
    if (qNorm === targetNorm) return true;
    if (!validNorms.includes(qNorm) && targetNorm === 'physics') return true;
    return false;
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSection = matchSection(q.section, activeTab);
    const matchesSearch = (q.question_text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (q.options || []).some(opt => (opt || '').toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSection && matchesSearch;
  });

  const allCombined = [...pyqPapers, ...testSeriesPapers];
  const selectedTestObj = allCombined.find(t => t.id === selectedTestId);

  return (
    <div className="space-y-6">
      {/* Top Banner & Selector */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-amber-500/20 rounded-2xl p-6 shadow-sm dark:shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-gray-800 pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Edit3 size={24} /> Test Paper Question Builder & Bank Manager
            </h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">LaTeX Math & Science rendering enabled ($...$ or \frac, \sqrt, \int). Add, edit, or upload diagram images.</p>
          </div>

          {/* Test Selector Dropdown with Grouping */}
          <div className="flex items-center gap-3">
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="bg-slate-50 dark:bg-black border border-slate-200 dark:border-amber-500/30 text-slate-900 dark:text-amber-100 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-amber-500 min-w-[280px]"
            >
              {loadingTests ? (
                <option>Loading Test Papers...</option>
              ) : pyqPapers.length === 0 && testSeriesPapers.length === 0 ? (
                <option>No Test Papers Found</option>
              ) : (
                <>
                  {pyqPapers.length > 0 && (
                    <optgroup label="─── 📚 FREE PYQ PAPERS ───">
                      {pyqPapers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title || t.name} ({t.exam_type || 'PYQ'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {testSeriesPapers.length > 0 && (
                    <optgroup label="─── 🎯 PAID TEST SERIES PAPERS ───">
                      {testSeriesPapers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title || t.name} ({t.exam_type || 'Test Series'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </>
              )}
            </select>

            <button
              onClick={handleAddQuestionToPaper}
              className="px-3.5 py-2.5 bg-amber-400 text-neutral-950 text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-amber-300 transition shadow"
            >
              <Plus size={16} /> Add Question
            </button>

            <button
              onClick={() => setShowEditTestModal(true)}
              disabled={!selectedTestId}
              className="px-3 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              title="Edit Test Paper Name & Category"
            >
              <Settings size={16} /> Edit Title
            </button>

            <button
              onClick={handleDeleteTest}
              disabled={!selectedTestId || deletingTest}
              className="px-3 py-2.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              title="Delete Entire Test Paper"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {message && (
          <div className={`p-4 rounded-xl text-sm flex items-center justify-between gap-2 mb-6 ${
            message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={16} /></button>
          </div>
        )}

        {/* Section Tabs & Search Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-2">
            {sections.map((sec) => {
              const count = questions.filter(q => matchSection(q.section, sec)).length;
              return (
                <button
                  key={sec}
                  onClick={() => setActiveTab(sec)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === sec
                      ? 'bg-amber-400 text-neutral-950 shadow-md'
                      : 'bg-slate-100 dark:bg-black/50 text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800 hover:border-amber-400/40'
                  }`}
                >
                  {sec} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by question keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-gray-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Questions List Editor */}
      <div className="space-y-6">
        {loadingQuestions ? (
          <div className="text-center py-16 bg-white dark:bg-[#121212] border border-slate-200 dark:border-gray-800 rounded-2xl">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 dark:text-gray-400">Loading Question Paper...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#121212] border border-slate-200 dark:border-gray-800 rounded-2xl text-slate-600 dark:text-gray-400 space-y-3 shadow-sm">
            <p className="text-sm">No questions found in <strong>{activeTab}</strong> for this paper.</p>
            <button
              onClick={handleAddQuestionToPaper}
              className="px-4 py-2 bg-amber-400 text-neutral-950 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 hover:bg-amber-300 transition shadow"
            >
              <Plus size={16} /> Add First Question in {activeTab}
            </button>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isEditing = editingQId === q.id;
            return (
              <div
                key={q.id}
                className={`bg-white dark:bg-[#121212] border rounded-2xl p-6 transition-all shadow-sm ${
                  isEditing ? 'border-amber-400/80 shadow-md' : 'border-slate-200 dark:border-gray-800/80 hover:border-slate-300 dark:hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800/60 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-900 dark:text-amber-400 font-bold text-xs flex items-center justify-center">
                      Q{q.question_number}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      {q.section} • {q.type || 'MCQ'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <button
                        onClick={() => handleSaveQuestion(q)}
                        disabled={savingId === q.id}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition"
                      >
                        <Save size={14} /> {savingId === q.id ? 'Saving...' : 'Save Changes'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingQId(q.id)}
                        className="px-3.5 py-1.5 bg-amber-400/15 hover:bg-amber-400/25 text-amber-900 dark:text-amber-300 font-bold text-xs rounded-lg flex items-center gap-1.5 border border-amber-400/30 transition"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteQuestion(q.id, q.question_number)}
                      className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-700 dark:text-red-400 font-bold text-xs rounded-lg flex items-center gap-1 border border-red-500/30 transition"
                      title="Delete Question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">Question Text & Formula Input</label>
                    <textarea
                      value={q.question_text}
                      onChange={(e) => handleFieldChange(q.id, 'question_text', e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-black/80 border border-slate-200 dark:border-gray-800 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 leading-relaxed font-sans"
                    />

                    {/* LIVE KATEX FORMULA PREVIEW */}
                    <div className="mt-2.5 p-3.5 bg-slate-100 dark:bg-black/60 border border-amber-500/30 rounded-xl text-xs text-slate-900 dark:text-amber-100">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                        <Eye size={13} /> Live Rendered Math Preview:
                      </div>
                      <MathRenderer text={q.question_text} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                      <Image size={14} className="text-amber-500 dark:text-amber-400" /> Diagram / Image URL (Google Drive Links Auto-Convert)
                    </label>
                    <input
                      type="text"
                      placeholder="https://drive.google.com/file/d/1ABC.../view"
                      value={q.image_url || ''}
                      onChange={(e) => handleFieldChange(q.id, 'image_url', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-black/80 border border-slate-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-amber-200 placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-amber-400 font-mono"
                    />

                    {q.image_url && (
                      <div className="mt-3 p-3 bg-slate-100 dark:bg-black border border-slate-200 dark:border-gray-800 rounded-xl text-center">
                        <img
                          src={q.image_url}
                          alt="Diagram Preview"
                          className="max-h-48 mx-auto object-contain rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">Options & Answer Key</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                        const isCorrectKey = q.correct_answer === letter;
                        const optVal = q.options ? q.options[optIdx] : '';
                        return (
                          <div
                            key={letter}
                            className={`flex flex-col gap-1.5 p-3 rounded-xl border transition ${
                              isCorrectKey
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-white'
                                : 'bg-slate-50 dark:bg-black/60 border-slate-200 dark:border-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleFieldChange(q.id, 'correct_answer', letter)}
                                className={`w-7 h-7 rounded-lg font-bold text-xs shrink-0 flex items-center justify-center transition ${
                                  isCorrectKey ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-gray-700'
                                }`}
                                title={`Set Option ${letter} as Correct Key`}
                              >
                                {letter}
                              </button>
                              <input
                                type="text"
                                value={optVal || ''}
                                onChange={(e) => handleOptionChange(q.id, optIdx, e.target.value)}
                                className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none"
                              />
                            </div>
                            {optVal && (
                              <div className="text-[11px] text-slate-700 dark:text-amber-200 pl-9 font-medium">
                                <MathRenderer text={optVal} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Test Details Modal */}
      {showEditTestModal && selectedTestObj && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-gold-400 flex items-center gap-2">
                <Settings size={20} /> Edit Test Paper Details
              </h3>
              <button onClick={() => setShowEditTestModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-gray-400 font-bold uppercase mb-1">Test Title</label>
                <input
                  type="text"
                  value={editTestTitle}
                  onChange={(e) => setEditTestTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-gray-400 font-bold uppercase mb-1">Exam Category</label>
                <select
                  value={editExamType}
                  onChange={(e) => setEditExamType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="IAT">IISER IAT</option>
                  <option value="NEST">NISER NEST</option>
                  <option value="CMI">CMI / ISI</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-gray-400 font-bold uppercase mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  value={editDuration}
                  onChange={(e) => setEditDuration(parseInt(e.target.value) || 180)}
                  className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowEditTestModal(false)}
                className="py-2.5 bg-slate-200 dark:bg-gray-800 hover:bg-slate-300 dark:hover:bg-gray-700 text-slate-800 dark:text-gray-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTest}
                className="py-2.5 bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
