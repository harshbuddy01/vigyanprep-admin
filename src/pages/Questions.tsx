import { useState, useEffect } from 'react';
import { Search, Edit3, Trash2, CheckCircle, Image, Sparkles, AlertCircle, Save } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

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
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [activeTab, setActiveTab] = useState('Physics');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch all published tests
  const fetchTests = async () => {
    setLoadingTests(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/pyq/list`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await response.json();
      if (data.tests && data.tests.length > 0) {
        setTests(data.tests);
        setSelectedTestId(data.tests[0].id);
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
    }
  }, [selectedTestId]);

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

  const handleOptionChange = (id: string, idx: number, val: string) => {
    setQuestions(prev =>
      prev.map(q => {
        if (q.id !== id) return q;
        const newOpts = [...(q.options || ['', '', '', ''])];
        newOpts[idx] = val;
        return { ...q, options: newOpts };
      })
    );
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
          section: q.section,
          options: q.options,
          correct_answer: q.correct_answer,
          image_url: q.image_url
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Failed to save question');

      setMessage({ type: 'success', text: `Question ${q.question_number} updated successfully!` });
      setEditingQId(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save' });
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteQuestion = async (qId: string, qNum: number) => {
    if (!confirm(`Are you sure you want to delete Question ${qNum}?`)) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/pyq/question/${qId}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (!response.ok) throw new Error('Failed to delete question');

      setQuestions(prev => prev.filter(q => q.id !== qId));
      setMessage({ type: 'success', text: `Question ${qNum} deleted.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete' });
    }
  };

  const sections = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
  const filteredQuestions = questions.filter(q => {
    const matchesSection = q.section === activeTab || (!sections.includes(q.section) && activeTab === 'Physics');
    const matchesSearch = !searchTerm || (q.question_text || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSection && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Edit3 className="text-amber-400" /> Published Question Bank & Editor
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Select a test paper to view, edit question text, modify answer keys, or add diagram images.
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Test Selector & Search */}
      <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2">
          <label className="block text-xs font-semibold text-neutral-400 mb-1">Select Test Paper</label>
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            disabled={loadingTests}
            className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400"
          >
            {loadingTests ? (
              <option>Loading tests...</option>
            ) : tests.length === 0 ? (
              <option value="">No tests found</option>
            ) : (
              tests.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.exam_type || t.test_type || 'IAT'})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="w-full md:w-1/2 relative">
          <label className="block text-xs font-semibold text-neutral-400 mb-1">Search Questions</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Search by question keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {sections.map(sec => {
          const count = questions.filter(q => q.section === sec || (!sections.includes(q.section) && sec === 'Physics')).length;
          return (
            <button
              key={sec}
              onClick={() => setActiveTab(sec)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === sec
                  ? 'bg-amber-400 text-neutral-950'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {sec} ({count})
            </button>
          );
        })}
      </div>

      {/* Questions List */}
      {loadingQuestions ? (
        <div className="text-center py-12 text-neutral-400 animate-pulse flex items-center justify-center gap-2">
          <Sparkles className="animate-spin text-amber-400" /> Loading Questions...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 bg-neutral-800/30 rounded-xl border border-white/5">
          No questions found in {activeTab} for this test paper.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredQuestions.map((q) => {
            const isEditing = editingQId === q.id;
            return (
              <div key={q.id} className="bg-neutral-800/50 border border-white/10 rounded-xl p-6 space-y-4 hover:border-amber-500/30 transition">
                {/* Header Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Question {q.question_number}
                    </span>
                    {isEditing ? (
                      <select
                        value={q.section}
                        onChange={(e) => handleFieldChange(q.id, 'section', e.target.value)}
                        className="bg-neutral-900 border border-amber-500/30 text-amber-300 text-xs rounded px-2 py-1 focus:outline-none"
                      >
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Biology">Biology</option>
                      </select>
                    ) : (
                      <span className="text-xs bg-neutral-900 text-amber-300 px-2 py-1 rounded border border-amber-500/20">
                        {q.section}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400 bg-neutral-900 px-3 py-1 rounded-full border border-white/5">
                      Key: <strong className="text-amber-400 ml-1">{q.correct_answer}</strong>
                    </span>

                    {isEditing ? (
                      <button
                        onClick={() => handleSaveQuestion(q)}
                        disabled={savingId === q.id}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition"
                      >
                        <Save size={14} /> {savingId === q.id ? 'Saving...' : 'Save'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingQId(q.id)}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-700 text-amber-300 border border-white/10 text-xs rounded-lg flex items-center gap-1 transition"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteQuestion(q.id, q.question_number)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition"
                      title="Delete Question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                {isEditing ? (
                  <textarea
                    value={q.question_text}
                    onChange={(e) => handleFieldChange(q.id, 'question_text', e.target.value)}
                    className="w-full bg-neutral-900 border border-amber-400/50 rounded-lg p-3 text-white text-sm focus:outline-none"
                    rows={3}
                  />
                ) : (
                  <div className="bg-neutral-900/60 p-4 rounded-lg border border-white/5 text-sm text-neutral-200 leading-relaxed">
                    {q.question_text}
                  </div>
                )}

                {/* Diagram / Figure Image URL */}
                {isEditing ? (
                  <div className="bg-neutral-900/60 p-3 rounded-lg border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-neutral-300 font-semibold">
                      <Image size={14} className="text-amber-400" /> Diagram / Figure Image URL (Optional)
                    </div>
                    <input
                      type="url"
                      value={q.image_url || ''}
                      onChange={(e) => handleFieldChange(q.id, 'image_url', e.target.value)}
                      className="w-full bg-neutral-950 border border-white/10 rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                      placeholder="Paste image URL (Google Drive links auto-converted)"
                    />
                    {q.image_url && (
                      <div className="mt-2 p-2 bg-neutral-950 rounded border border-white/10 text-center">
                        <img src={q.image_url} alt="Diagram Preview" className="max-h-40 mx-auto object-contain rounded" />
                      </div>
                    )}
                  </div>
                ) : q.image_url ? (
                  <div className="p-3 bg-neutral-950 rounded-lg border border-white/10 text-center">
                    <img src={q.image_url} alt="Diagram" className="max-h-48 mx-auto object-contain rounded" />
                  </div>
                ) : null}

                {/* Options & Answer Key */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['A', 'B', 'C', 'D'].map((optKey, idx) => {
                    const isCorrect = q.correct_answer === optKey;
                    const optText = (q.options && q.options[idx]) || '';
                    return (
                      <div
                        key={optKey}
                        className={`p-3 rounded-lg border flex items-center gap-3 transition ${
                          isCorrect ? 'bg-amber-400/10 border-amber-400' : 'bg-neutral-900 border-white/10'
                        }`}
                      >
                        <button
                          disabled={!isEditing}
                          onClick={() => handleFieldChange(q.id, 'correct_answer', optKey)}
                          className={`w-7 h-7 rounded-full font-bold text-xs shrink-0 flex items-center justify-center transition ${
                            isCorrect ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {optKey}
                        </button>
                        {isEditing ? (
                          <input
                            type="text"
                            value={optText}
                            onChange={(e) => handleOptionChange(q.id, idx, e.target.value)}
                            className="flex-1 bg-transparent text-white text-xs focus:outline-none"
                            placeholder={`Option ${optKey}...`}
                          />
                        ) : (
                          <span className={`text-xs ${isCorrect ? 'text-amber-200 font-semibold' : 'text-neutral-300'}`}>
                            {optText || `Option ${optKey}`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
