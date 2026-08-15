import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ArrowLeft, User, Clock,
  RotateCcw, Bookmark, ChevronLeft, ChevronRight, X,
  Layers, Eye
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { MathRenderer } from '../components/MathRenderer';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

interface Question {
  id: string;
  question_number: number;
  section: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  image_url?: string;
}

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked_for_review' | 'answered_marked_for_review';

export function PreviewExam() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  // Phase state: 'instructions' | 'exam'
  const [phase, setPhase] = useState<'instructions' | 'exam'>('instructions');

  // Test & questions data
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string>('Physics');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Instructions state
  const [agreed, setAgreed] = useState(false);

  // Exam state
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>({});
  const [showAnswerKeyOverlay, setShowAnswerKeyOverlay] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(180 * 60); // seconds

  // Quality gate submit state
  const [validating, setValidating] = useState(false);
  const [showSubmitSummary, setShowSubmitSummary] = useState(false);
  const [validationPassed, setValidationPassed] = useState(false);

  // Load test data
  useEffect(() => {
    async function loadTestAndQuestions() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/admin/pyq/test/${testId}/questions`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();
        const loadedQs: Question[] = data.questions || [];
        setQuestions(loadedQs);

        // Derive sections
        const secSet = Array.from(new Set(loadedQs.map(q => q.section || 'Physics')));
        const orderedSections = ['Physics', 'Chemistry', 'Mathematics', 'Biology'].filter(s => secSet.includes(s));
        setSections(orderedSections.length > 0 ? orderedSections : (secSet.length > 0 ? secSet : ['Physics']));
        if (orderedSections.length > 0) setActiveSection(orderedSections[0]);

        // Init statuses
        const initStatuses: Record<string, QuestionStatus> = {};
        loadedQs.forEach((q, idx) => {
          initStatuses[q.id] = idx === 0 ? 'not_answered' : 'not_visited';
        });
        setQuestionStatuses(initStatuses);

        const testRes = await fetch(`${API_BASE}/api/public/tests/${testId}`);
        const testData = await testRes.json();
        if (testData.test) {
          setTest(testData.test);
          setTimeRemaining((testData.test.duration_minutes || 180) * 60);
        }
      } catch (err) {
        console.error('Failed to load preview questions:', err);
      } finally {
        setLoading(false);
      }
    }
    if (testId) loadTestAndQuestions();
  }, [testId, token]);

  // Timer countdown in exam phase
  useEffect(() => {
    if (phase !== 'exam') return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Section filtered questions
  const sectionQuestions = questions.filter(q => q.section === activeSection);
  const currentQ = sectionQuestions[currentIdx] || questions[0];

  const handleSelectOption = (optKey: string) => {
    if (!currentQ) return;
    setUserAnswers(prev => ({ ...prev, [currentQ.id]: optKey }));
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    setUserAnswers(prev => {
      const next = { ...prev };
      delete next[currentQ.id];
      return next;
    });
    setQuestionStatuses(prev => ({ ...prev, [currentQ.id]: 'not_answered' }));
  };

  const handleSaveAndNext = () => {
    if (!currentQ) return;
    const hasAns = !!userAnswers[currentQ.id];
    setQuestionStatuses(prev => ({
      ...prev,
      [currentQ.id]: hasAns ? 'answered' : 'not_answered'
    }));

    if (currentIdx < sectionQuestions.length - 1) {
      const nextQ = sectionQuestions[currentIdx + 1];
      if (questionStatuses[nextQ.id] === 'not_visited') {
        setQuestionStatuses(prev => ({ ...prev, [nextQ.id]: 'not_answered' }));
      }
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handleMarkForReviewAndNext = () => {
    if (!currentQ) return;
    const hasAns = !!userAnswers[currentQ.id];
    setQuestionStatuses(prev => ({
      ...prev,
      [currentQ.id]: hasAns ? 'answered_marked_for_review' : 'marked_for_review'
    }));

    if (currentIdx < sectionQuestions.length - 1) {
      const nextQ = sectionQuestions[currentIdx + 1];
      if (questionStatuses[nextQ.id] === 'not_visited') {
        setQuestionStatuses(prev => ({ ...prev, [nextQ.id]: 'not_answered' }));
      }
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handleJumpToQuestion = (qId: string, idxInSection: number) => {
    if (questionStatuses[qId] === 'not_visited') {
      setQuestionStatuses(prev => ({ ...prev, [qId]: 'not_answered' }));
    }
    setCurrentIdx(idxInSection);
  };

  // Stats calculation
  const totalCount = questions.length;
  const answeredCount = Object.values(questionStatuses).filter(s => s === 'answered' || s === 'answered_marked_for_review').length;
  const notAnsweredCount = Object.values(questionStatuses).filter(s => s === 'not_answered').length;
  const markedReviewCount = Object.values(questionStatuses).filter(s => s === 'marked_for_review').length;
  const answeredMarkedCount = Object.values(questionStatuses).filter(s => s === 'answered_marked_for_review').length;
  const notVisitedCount = totalCount - (answeredCount + notAnsweredCount + markedReviewCount);

  // Submit and pass quality gate
  const handlePassQualityGate = async () => {
    setValidating(true);
    try {
      const answersArray = questions.map(q => ({
        question_id: q.id,
        answer: userAnswers[q.id] || ''
      }));

      const res = await fetch(`${API_BASE}/api/admin/preview/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          testId,
          answers: answersArray
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setValidationPassed(true);
        setShowSubmitSummary(false);
      } else {
        alert('Validation error: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error submitting preview validation: ' + err.message);
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-300">Loading Student CBT Environment...</p>
      </div>
    );
  }

  // =========================================================================
  // SUCCESS SCREEN (Quality Gate Passed)
  // =========================================================================
  if (validationPassed) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Quality Gate Passed!</h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Paper <strong>{test?.title || 'IAT 01'}</strong> has been verified in the live CBT simulator and is 100% ready for students.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Questions:</span>
              <span className="font-bold text-white">{questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quality Status:</span>
              <span className="font-bold text-emerald-400">🟢 Validated</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Schedule Window:</span>
              <span className="font-mono text-amber-400">{test?.window_start ? new Date(test.window_start).toLocaleString('en-IN') : 'Scheduled'}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/test-series')}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl transition shadow-lg cursor-pointer"
            >
              ← Return to Paid Test Series
            </button>
            <button
              onClick={() => { setValidationPassed(false); setPhase('exam'); }}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Continue Reviewing Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STEP 1: CANDIDATE INSTRUCTIONS & DECLARATION SCREEN
  // =========================================================================
  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Top Header */}
        <header className="bg-slate-900 border-b border-white/10 px-6 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/test-series')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Exit Preview"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white tracking-tight">{test?.title || 'IAT 01 Mock Paper'}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-400 text-neutral-950 uppercase tracking-wider">
                  Admin Simulator
                </span>
              </div>
              <p className="text-[11px] text-slate-400">IISER Aptitude Test (IAT) Official CBT Instructions</p>
            </div>
          </div>

          {/* Quick Exit / Fast Pass */}
          <button
            onClick={handlePassQualityGate}
            disabled={validating}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 size={15} />
            {validating ? 'Validating...' : 'Fast Pass Quality Gate'}
          </button>
        </header>

        {/* Main Content Layout */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Instructions Body */}
          <div className="lg:col-span-2 space-y-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div>
              <h1 className="text-lg font-black text-amber-400 uppercase tracking-wide border-b border-white/10 pb-3">
                General Instructions for Candidates
              </h1>
              <div className="text-xs text-slate-400 mt-2 flex flex-wrap gap-4">
                <span>⏱️ Duration: <strong>{test?.duration_minutes || 180} Minutes</strong></span>
                <span>📝 Total Questions: <strong>{questions.length || 60} Questions</strong></span>
                <span>🎯 Total Marks: <strong>{questions.length * 4 || 240} Marks</strong></span>
              </div>
            </div>

            {/* Instruction Points */}
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[460px] overflow-y-auto pr-2">
              <p>
                1. The clock will be set at the server. The countdown timer in the top right corner of the screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself.
              </p>

              <div className="space-y-2.5 bg-slate-950/70 p-4 rounded-xl border border-white/5">
                <p className="font-bold text-slate-200">2. The Question Palette displayed on the right side of the screen will show the status of each question using one of the following symbols:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                    <span>You have not visited the question yet.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded bg-red-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                    <span>You have not answered the question.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                    <span>You have answered the question.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
                    <span>You have marked the question for review.</span>
                  </div>
                  <div className="flex items-center gap-2.5 sm:col-span-2">
                    <span className="w-6 h-6 rounded bg-purple-600 border-2 border-emerald-400 text-white flex items-center justify-center font-bold text-[10px] shrink-0">5</span>
                    <span>The question(s) "Answered & Marked for Review" will be considered for evaluation.</span>
                  </div>
                </div>
              </div>

              <p>
                3. <strong>Marking Scheme</strong>: Each question carries <strong>+4 marks</strong> for a correct response, <strong>-1 mark</strong> for an incorrect response, and <strong>0 marks</strong> for unattempted questions.
              </p>

              <p>
                4. To select an answer, click on the button of one of the options. To deselect your chosen answer, click on the <strong>Clear Response</strong> button. To change your chosen answer, click on the button of another option.
              </p>

              <p>
                5. To save your answer, you MUST click on the <strong>Save & Next</strong> button.
              </p>
            </div>

            {/* Declaration Checkbox */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
                />
                <span className="text-xs text-amber-200 font-medium leading-relaxed">
                  I have read and understood all instructions. I confirm that all questions, mathematical symbols, and diagrams are formatted correctly for the examination.
                </span>
              </label>

              <button
                disabled={!agreed}
                onClick={() => setPhase('exam')}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:opacity-95 text-neutral-950 font-black text-sm rounded-xl transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <span>I AM READY TO BEGIN (START CBT SIMULATOR)</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Right Column: Candidate Profile Card */}
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-neutral-950 flex items-center justify-center mx-auto font-black text-2xl shadow-lg border-2 border-white/20">
                <User size={36} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Admin Previewer</h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-400 border border-amber-400/40 uppercase tracking-wider">
                  Admin Simulation
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-white/5 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Roll Number:</span>
                  <span className="font-mono font-bold text-slate-200">ADM-PREVIEW-2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">System ID:</span>
                  <span className="font-mono font-bold text-slate-200">CBT-SIMULATOR-01</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Window:</span>
                  <span className="font-mono font-bold text-amber-400">{test?.window_start ? new Date(test.window_start).toLocaleDateString('en-IN') : 'Scheduled'}</span>
                </div>
              </div>
            </div>

            {/* Test Stats Info */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-xs space-y-3">
              <div className="font-bold text-slate-300 flex items-center gap-2">
                <Layers size={14} className="text-amber-400" />
                <span>Paper Sections</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sections.map(sec => {
                  const count = questions.filter(q => q.section === sec).length;
                  return (
                    <div key={sec} className="p-2.5 rounded-xl bg-slate-950 border border-white/5 text-center">
                      <div className="font-bold text-amber-400">{count} Qs</div>
                      <div className="text-[10px] text-slate-400">{sec}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STEP 2: FULL-FLEDGED STUDENT CBT EXAM ENVIRONMENT
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* NTA / VigyanPrep Official Exam Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <img src="/vigyan-logo-light.png" alt="VigyanPrep" className="h-9 w-auto object-contain" />
          <div className="border-l border-white/15 pl-3">
            <h1 className="text-xs font-black text-white tracking-tight">{test?.title || 'IAT 01 (Official CBT Mock)'}</h1>
            <p className="text-[10px] text-slate-400">CBT Portal Examination Simulator</p>
          </div>
        </div>

        {/* Center Countdown Timer */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-950 border border-amber-400/40 text-amber-400 font-mono text-sm font-black shadow-inner">
          <Clock size={15} />
          <span>{formatTimer(timeRemaining)}</span>
        </div>

        {/* Right Admin Controls & Pass Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAnswerKeyOverlay(!showAnswerKeyOverlay)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              showAnswerKeyOverlay
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle Admin Answer Key overlay on options"
          >
            <Eye size={13} />
            <span>{showAnswerKeyOverlay ? 'Answer Key ON' : 'Answer Key OFF'}</span>
          </button>

          <button
            onClick={() => setShowSubmitSummary(true)}
            className="px-4 py-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition cursor-pointer"
          >
            <CheckCircle2 size={14} />
            <span>Pass Quality Gate</span>
          </button>
        </div>
      </header>

      {/* Section Tabs Header */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-6 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-2">SECTIONS:</span>
          {sections.map(sec => {
            const count = questions.filter(q => q.section === sec).length;
            const isActive = activeSection === sec;
            return (
              <button
                key={sec}
                onClick={() => { setActiveSection(sec); setCurrentIdx(0); }}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-neutral-950 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-white/5'
                }`}
              >
                <span>{sec}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${isActive ? 'bg-black/20 text-black' : 'bg-slate-700 text-slate-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <span>Marks: <strong className="text-emerald-400">+4.00</strong></span>
          <span>Negative: <strong className="text-red-400">-1.00</strong></span>
        </div>
      </div>

      {/* Main CBT Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center: Question Paper Workspace */}
        <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto bg-slate-950">
          {currentQ ? (
            <div className="max-w-4xl w-full mx-auto space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="font-extrabold text-sm text-slate-200">
                  Question No. {currentQ.question_number}
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-white/10">
                  {currentQ.section} Section
                </span>
              </div>

              {/* Question Text */}
              <div className="text-sm text-slate-100 font-medium leading-relaxed bg-slate-900/60 p-5 rounded-2xl border border-white/5 shadow-sm">
                <MathRenderer text={currentQ.question_text} />
                {currentQ.image_url && (
                  <div className="mt-4 text-center">
                    <img
                      src={currentQ.image_url}
                      alt="Question Diagram"
                      className="max-h-72 mx-auto rounded-xl border border-slate-700 shadow-md bg-white/5 p-1"
                    />
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {(currentQ.options || []).map((opt, oIdx) => {
                  const optKey = String.fromCharCode(65 + oIdx);
                  const isSelected = userAnswers[currentQ.id] === optKey;
                  const isCorrect = String(currentQ.correct_answer).trim().toUpperCase() === optKey;

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(optKey)}
                      className={`w-full text-left p-4 rounded-xl border-2 flex items-start gap-3.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400/10 border-amber-400 text-white shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-amber-400 text-neutral-950 font-black' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {optKey}
                      </span>
                      <div className="flex-1 text-sm pt-0.5">
                        <MathRenderer text={opt} />
                      </div>
                      {showAnswerKeyOverlay && isCorrect && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider shrink-0">
                          Correct Key
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500">No questions found in this section.</div>
          )}

          {/* Bottom Controls Bar */}
          <div className="border-t border-slate-800/80 pt-4 mt-6 flex flex-wrap items-center justify-between gap-3 max-w-4xl w-full mx-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearResponse}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Clear Response</span>
              </button>
              <button
                onClick={handleMarkForReviewAndNext}
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Bookmark size={13} />
                <span>Mark for Review & Next</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => prev - 1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <button
                onClick={handleSaveAndNext}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>Save & Next</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Candidate Card & NTA Question Palette */}
        <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col justify-between shrink-0 p-4 space-y-4 overflow-y-auto">
          {/* Candidate Info Profile */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center font-black text-sm">
              <User size={20} />
            </div>
            <div>
              <div className="text-xs font-black text-white">Admin Previewer</div>
              <div className="text-[10px] text-amber-400 font-mono">ADM-PREVIEW-2026</div>
            </div>
          </div>

          {/* Palette Color Legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px]">{answeredCount}</span>
              <span className="text-slate-400">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-red-600 text-white flex items-center justify-center font-bold text-[9px]">{notAnsweredCount}</span>
              <span className="text-slate-400">Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-purple-600 text-white flex items-center justify-center font-bold text-[9px]">{markedReviewCount}</span>
              <span className="text-slate-400">Marked Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-slate-700 text-slate-400 flex items-center justify-center font-bold text-[9px]">{notVisitedCount}</span>
              <span className="text-slate-400">Not Visited</span>
            </div>
          </div>

          {/* Question Grid Numbers */}
          <div className="flex-1 space-y-2">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              {activeSection} Questions ({sectionQuestions.length})
            </div>
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
              {sectionQuestions.map((q, idx) => {
                const status = questionStatuses[q.id] || 'not_visited';
                const isCurrent = currentQ?.id === q.id;

                let bgClass = 'bg-slate-800 text-slate-400 hover:bg-slate-700';
                if (status === 'answered') bgClass = 'bg-emerald-600 text-white font-bold';
                else if (status === 'not_answered') bgClass = 'bg-red-600 text-white font-bold';
                else if (status === 'marked_for_review') bgClass = 'bg-purple-600 text-white font-bold';
                else if (status === 'answered_marked_for_review') bgClass = 'bg-purple-600 border-2 border-emerald-400 text-white font-bold';

                return (
                  <button
                    key={q.id}
                    onClick={() => handleJumpToQuestion(q.id, idx)}
                    className={`h-9 rounded-lg text-xs transition cursor-pointer flex items-center justify-center ${bgClass} ${
                      isCurrent ? 'ring-2 ring-amber-400 shadow-md scale-105' : ''
                    }`}
                  >
                    {q.question_number}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit / Pass Quality Gate Button */}
          <button
            onClick={() => setShowSubmitSummary(true)}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs rounded-xl transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>SUBMIT & PASS QUALITY GATE</span>
          </button>
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* SUBMISSION & QUALITY GATE VERIFICATION MODAL */}
      {/* ========================================================================= */}
      {showSubmitSummary && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span>Exam Review & Quality Gate</span>
              </h3>
              <button onClick={() => setShowSubmitSummary(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                <div className="text-xl font-bold text-white">{totalCount}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Questions</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                <div className="text-xl font-bold text-emerald-400">{answeredCount}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Answered</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                <div className="text-xl font-bold text-red-400">{notAnsweredCount}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Not Answered</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                <div className="text-xl font-bold text-purple-400">{markedReviewCount + answeredMarkedCount}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Marked for Review</div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed text-center">
              Are you sure you want to complete this admin preview test? Passing the quality gate marks this paper as verified and ready for live delivery to students.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitSummary(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Continue Test
              </button>
              <button
                disabled={validating}
                onClick={handlePassQualityGate}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {validating ? 'Verifying...' : '✓ Confirm & Pass Gate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
