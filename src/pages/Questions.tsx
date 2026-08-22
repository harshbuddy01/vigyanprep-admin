import { useState, useEffect } from 'react';
import {
  Search, Plus, Trash2, Edit3, CheckCircle2,
  BookOpen, Layers, Atom, FlaskConical, Calculator, Dna,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { MathRenderer } from '../components/MathRenderer';
import { QuestionStudioModal } from '../components/QuestionStudioModal';
import type { QuestionData } from '../components/QuestionStudioModal';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

function formatImageUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('/uploads/')) {
    const apiBase = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';
    return `${apiBase.replace(/\/+$/, '')}${trimmed}`;
  }
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  return trimmed;
}

const SUBJECT_ICONS: Record<string, any> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Mathematics: Calculator,
  Biology: Dna,
  All: Layers
};

export function Questions() {
  const token = useAuthStore((state) => state.token);

  const [questions, setQuestions] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    Physics: number;
    Chemistry: number;
    Mathematics: number;
    Biology: number;
    easy: number;
    medium: number;
    hard: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedExamType, setSelectedExamType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Studio Modal State
  const [studioOpen, setStudioOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(null);

  // Notification message
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/questions/bank/stats`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '24',
        section: activeSection === 'All' ? '' : activeSection,
        difficulty: selectedDifficulty === 'All' ? '' : selectedDifficulty,
        exam_type: selectedExamType === 'All' ? '' : selectedExamType,
        search: searchTerm.trim()
      });

      const res = await fetch(`${API_BASE}/api/admin/questions/bank?${params}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();

      if (data.success) {
        setQuestions(data.questions || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (err: any) {
      console.error('Failed to fetch question bank:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [activeSection, selectedDifficulty, selectedExamType, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions();
  };

  const handleSaveQuestion = async (qData: QuestionData) => {
    const isEdit = !!qData.id;
    const url = isEdit
      ? `${API_BASE}/api/admin/questions/bank/${qData.id}`
      : `${API_BASE}/api/admin/questions/bank`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(qData)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to save question');
    }

    setMessage({
      type: 'success',
      text: isEdit ? '✅ Question updated in database!' : '✅ Question added to Master Question Bank!'
    });
    fetchQuestions();
    fetchStats();
    setTimeout(() => setMessage(null), 4000);
  };

  const handleDeleteQuestion = async (q: any) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to PERMANENTLY delete this question from the database?\n\nSubject: ${q.section}\nText: "${(q.question_text || q.text || '').substring(0, 60)}..."\n\nThis cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/questions/bank/${q.id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: '🗑️ Question permanently deleted from database.' });
        fetchQuestions();
        fetchStats();
        setTimeout(() => setMessage(null), 4000);
      } else {
        alert('Failed to delete question: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error deleting question: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-zinc-100 font-sans">
      
      {/* Top Banner & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Master Question Bank
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/10 border border-amber-400/30 text-amber-400 uppercase tracking-wider">
              Unacademy Grade
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Central repository for all test questions • Live KaTeX rendering • 1-Click Database Deletion
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingQuestion(null);
              setStudioOpen(true);
            }}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-400/20 flex items-center gap-2 transition"
          >
            <Plus size={16} /> Add Question to Bank
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
          message.type === 'success'
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
            : 'bg-red-950/40 text-red-300 border-red-500/30'
        }`}>
          <CheckCircle2 size={16} /> {message.text}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-[#121215] border border-white/10 rounded-2xl">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total in Bank</p>
          <p className="text-2xl font-black text-white mt-1">{stats?.total ?? '—'}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">All Subjects</p>
        </div>

        <div className="p-4 bg-[#121215] border border-blue-500/20 rounded-2xl">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Physics</p>
            <Atom size={14} className="text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-300 mt-1">{stats?.Physics ?? '0'}</p>
          <p className="text-[10px] text-blue-400/70 mt-0.5">Questions</p>
        </div>

        <div className="p-4 bg-[#121215] border border-emerald-500/20 rounded-2xl">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Chemistry</p>
            <FlaskConical size={14} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-1">{stats?.Chemistry ?? '0'}</p>
          <p className="text-[10px] text-emerald-400/70 mt-0.5">Questions</p>
        </div>

        <div className="p-4 bg-[#121215] border border-purple-500/20 rounded-2xl">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Mathematics</p>
            <Calculator size={14} className="text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-300 mt-1">{stats?.Mathematics ?? '0'}</p>
          <p className="text-[10px] text-purple-400/70 mt-0.5">Questions</p>
        </div>

        <div className="p-4 bg-[#121215] border border-amber-500/20 rounded-2xl">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Biology</p>
            <Dna size={14} className="text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-1">{stats?.Biology ?? '0'}</p>
          <p className="text-[10px] text-amber-400/70 mt-0.5">Questions</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-[#121215] border border-white/10 rounded-2xl space-y-4 shadow-sm">
        
        {/* Subject Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology'].map(sec => {
            const Icon = SUBJECT_ICONS[sec] || Layers;
            const isActive = activeSection === sec;
            return (
              <button
                key={sec}
                onClick={() => {
                  setActiveSection(sec);
                  if (sec !== 'All') {
                    localStorage.setItem('vigyan_last_section', sec);
                  }
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                    : 'bg-[#18181b] text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
                }`}
              >
                <Icon size={14} />
                {sec}
              </button>
            );
          })}
        </div>

        {/* Search & Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <form onSubmit={handleSearchSubmit} className="sm:col-span-6 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Search size={15} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search question text or formulas (e.g. \int, Optics, Newton, DNA)..."
              className="w-full bg-[#18181b] border border-white/10 rounded-xl pl-10 pr-20 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[11px] rounded-lg transition"
            >
              Search
            </button>
          </form>

          <div className="sm:col-span-3">
            <select
              value={selectedDifficulty}
              onChange={(e) => {
                setSelectedDifficulty(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">🟢 Easy</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Hard">🔴 Hard</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedExamType}
              onChange={(e) => {
                setSelectedExamType(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Exam Types</option>
              <option value="IAT">IISER IAT</option>
              <option value="NEST">NISER NEST</option>
              <option value="JEE">JEE Main / Adv</option>
              <option value="General">General Practice</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions Listing */}
      {loading ? (
        <div className="p-16 text-center text-zinc-500 space-y-3 bg-[#121215] border border-white/10 rounded-2xl">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-zinc-400">Loading master question bank...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="p-16 text-center text-zinc-500 space-y-3 bg-[#121215] border border-white/10 rounded-2xl">
          <BookOpen size={40} className="mx-auto text-zinc-600" />
          <p className="text-sm font-bold text-white">No questions found in this filter.</p>
          <p className="text-xs text-zinc-500">Try changing your search keywords or add a new question to the bank.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>Showing <strong>{questions.length}</strong> of <strong>{totalCount}</strong> questions in bank</span>
            <span>Page {page} of {totalPages}</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {questions.map((q, idx) => {
              const qText = q.question_text || q.text || 'Question Statement';
              const opts = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'];
              const correctKey = q.correct_answer || 'A';
              const subject = q.section || 'Physics';

              return (
                <div
                  key={q.id || idx}
                  className="p-5 bg-[#121215] hover:bg-[#15151a] border border-white/10 hover:border-white/20 rounded-2xl transition space-y-4 shadow-sm"
                >
                  {/* Card Top Metadata & Action Controls */}
                  <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-400/10 border border-amber-400/30 text-amber-400">
                        {subject}
                      </span>
                      {q.topic && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 text-zinc-300 border border-white/5">
                          {q.topic}
                        </span>
                      )}
                      {/* PYQ Symbol / Test Series Badge */}
                      {q.is_pyq ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center gap-1">
                          <BookOpen size={11} className="text-purple-300" />
                          📜 PYQ {q.pyq_year || 'Official'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center gap-1">
                          <Layers size={11} className="text-blue-400" />
                          ⚡ Test Series / Bank
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        q.difficulty === 'Easy'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : q.difficulty === 'Hard'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {q.difficulty || 'Medium'}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        +{q.marks_positive ?? 4} / -{q.marks_negative ?? 1}
                      </span>
                      {q.test_title && (
                        <span className="text-[10px] text-zinc-400 font-medium px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 max-w-xs truncate" title={q.test_title}>
                          📁 {q.test_title}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons: Edit in Studio & Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingQuestion(q);
                          setStudioOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Edit3 size={13} /> Edit
                      </button>

                      <button
                        onClick={() => handleDeleteQuestion(q)}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        title="Delete permanently from database"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Question Text with KaTeX Rendering */}
                  <div className="text-zinc-100 text-sm leading-relaxed">
                    <MathRenderer text={qText} />
                  </div>

                  {/* Question Diagram (if any) */}
                  {q.image_url && formatImageUrl(q.image_url) && (
                    <div className="p-2 bg-white/5 border border-white/10 rounded-xl max-w-sm">
                      <img
                        src={formatImageUrl(q.image_url)}
                        alt="Question Diagram"
                        className="max-h-48 object-contain rounded"
                        onError={(e) => {
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) parent.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {opts.map((opt: string, oi: number) => {
                      const label = ['A', 'B', 'C', 'D'][oi] || String(oi + 1);
                      const isCorrect = correctKey === label;
                      return (
                        <div
                          key={oi}
                          className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                            isCorrect
                              ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-200'
                              : 'border-white/5 bg-[#18181b]/50 text-zinc-300'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                            isCorrect ? 'bg-emerald-500 text-black font-extrabold' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {label}
                          </span>
                          <div className="flex-1 font-medium">
                            <MathRenderer text={opt} />
                          </div>
                          {isCorrect && (
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0 ml-auto" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Solution Explanation Preview (if available) */}
                  {q.solution_explanation && (
                    <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-xs text-blue-200 space-y-1">
                      <span className="font-bold text-blue-400 text-[10px] uppercase tracking-wider">Solution:</span>
                      <MathRenderer text={q.solution_explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 bg-[#121215] border border-white/10 hover:bg-zinc-800 disabled:opacity-30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <ChevronLeft size={15} /> Previous Page
              </button>

              <span className="text-xs font-medium text-zinc-400">
                Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-4 py-2 bg-[#121215] border border-white/10 hover:bg-zinc-800 disabled:opacity-30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                Next Page <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Studio Modal */}
      <QuestionStudioModal
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
        onSave={handleSaveQuestion}
        initialData={editingQuestion}
        defaultSection={activeSection !== 'All' ? activeSection : (localStorage.getItem('vigyan_last_section') || 'Physics')}
      />
    </div>
  );
}
