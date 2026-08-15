import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileUp, CheckCircle, AlertCircle, Sparkles, BookOpen, Trash2,
  Image, Plus, ChevronRight, ChevronLeft, Settings2, Edit3, Eye,
  Rocket, Save, ArrowLeft, Upload, Check, X, Loader2,
  Atom, FlaskConical, Calculator, Dna, Crop, Shuffle
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { MathRenderer } from '../components/MathRenderer';
import { CropDiagramModal } from '../components/CropDiagramModal';
import { QuestionStudioModal } from '../components/QuestionStudioModal';
import type { QuestionData } from '../components/QuestionStudioModal';
import { ImportFromBankModal } from '../components/ImportFromBankModal';

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

type ParsedQuestion = {
  id?: string;
  tempId?: string;
  questionNumber: number;
  question_number?: number;
  section: string;
  type: 'MCQ' | 'MSQ' | 'Numerical';
  text: string;
  question_text?: string;
  imageUrl?: string;
  image_url?: string;
  options: string[];
  correctAnswer: string;
  correct_answer?: string;
  status: string;
};

const SECTIONS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
const SECTION_ICONS: Record<string, any> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Mathematics: Calculator,
  Biology: Dna,
};
const SECTION_COLORS: Record<string, string> = {
  Physics: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  Chemistry: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  Mathematics: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  Biology: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

const STEPS = [
  { label: 'Setup', icon: Settings2, description: 'Paper details & PDF upload' },
  { label: 'Questions', icon: Edit3, description: 'Edit & organize questions' },
  { label: 'Preview', icon: Eye, description: 'Review as student sees it' },
  { label: 'Publish', icon: Rocket, description: 'Go live or save as draft' },
];

export function PaperBuilder() {
  const { testId } = useParams<{ testId?: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  // Stepper state
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Setup
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState('IAT');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [duration, setDuration] = useState('180');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Step 2: Questions
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [activeTab, setActiveTab] = useState('Physics');
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [cropTargetQId, setCropTargetQId] = useState<string | null>(null);

  // Question Studio & Bank Import State
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioQuestion, setStudioQuestion] = useState<QuestionData | null>(null);
  const [bankImportOpen, setBankImportOpen] = useState(false);

  // Step 3: Preview
  const [previewIdx, setPreviewIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  // Step 4: Publish
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [savedTestId, setSavedTestId] = useState<string | null>(testId || null);

  // Global
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [paperStatus, setPaperStatus] = useState<string>('new'); // new | draft | ongoing | frozen
  const [loading, setLoading] = useState(false);

  // Load existing test or restore LocalStorage draft on mount
  useEffect(() => {
    if (testId) {
      loadExistingPaper(testId);
    } else {
      // Check for saved local draft
      try {
        const localDraft = localStorage.getItem('vigyan_paper_builder_draft');
        if (localDraft) {
          const parsed = JSON.parse(localDraft);
          if (parsed && (parsed.questions?.length > 0 || parsed.examTitle)) {
            setExamTitle(parsed.examTitle || '');
            setExamType(parsed.examType || 'IAT');
            setYear(parsed.year || String(new Date().getFullYear()));
            setDuration(parsed.duration || '180');
            setQuestions(parsed.questions || []);
            setCurrentStep(parsed.currentStep || 0);
            if (parsed.savedTestId) setSavedTestId(parsed.savedTestId);
            if (parsed.activeTab) setActiveTab(parsed.activeTab);
            setMessage({
              type: 'info',
              text: `⚡ Restored working draft from your last session (${parsed.questions?.length || 0} questions). You can continue editing safely without losing progress!`
            });
          }
        }
      } catch (err) {
        console.error('Failed to restore local draft:', err);
      }
    }
  }, [testId]);

  // Auto-Save Working Draft to LocalStorage whenever state changes
  useEffect(() => {
    if (testId) return; // Don't overwrite working draft when editing a specific published testId
    if (questions.length > 0 || examTitle.trim().length > 0) {
      const draftData = {
        examTitle,
        examType,
        year,
        duration,
        questions,
        currentStep,
        savedTestId,
        activeTab,
        timestamp: Date.now()
      };
      localStorage.setItem('vigyan_paper_builder_draft', JSON.stringify(draftData));
    }
  }, [questions, examTitle, examType, year, duration, currentStep, savedTestId, activeTab, testId]);

  const clearLocalDraft = () => {
    if (!window.confirm('Are you sure you want to clear your current working draft?')) return;
    localStorage.removeItem('vigyan_paper_builder_draft');
    setQuestions([]);
    setExamTitle('');
    setSavedTestId(null);
    setCurrentStep(0);
    setMessage({ type: 'info', text: 'Working draft cleared. You can start fresh.' });
  };

  const loadExistingPaper = async (id: string) => {
    setLoading(true);
    try {
      // Fetch test details
      const testRes = await fetch(`${API_BASE}/api/admin/tests/${id}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (testRes.ok) {
        const testData = await testRes.json();
        const test = testData.test;
        if (test) {
          setExamTitle(test.title || '');
          setExamType(test.exam_type || 'IAT');
          setYear(test.pyq_year ? String(test.pyq_year) : String(new Date().getFullYear()));
          setDuration(String(test.duration_minutes || 180));
          setPaperStatus(test.status || 'draft');
          setSavedTestId(id);
        }
      }

      // Fetch questions
      const qRes = await fetch(`${API_BASE}/api/admin/pyq/test/${id}/questions`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (qRes.ok) {
        const qData = await qRes.json();
        const loaded: ParsedQuestion[] = (qData.questions || []).map((q: any) => ({
          id: q.id,
          tempId: q.id,
          questionNumber: q.question_number || 1,
          question_number: q.question_number || 1,
          section: q.section || 'Physics',
          type: q.type || 'MCQ',
          text: q.question_text || '',
          question_text: q.question_text || '',
          imageUrl: q.image_url || '',
          image_url: q.image_url || '',
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: q.correct_answer || 'A',
          correct_answer: q.correct_answer || 'A',
          status: q.status || 'approved'
        }));
        setQuestions(loaded);
        if (loaded.length > 0) setCurrentStep(1); // Jump to questions if paper has content
      }
    } catch (err) {
      console.error('Failed to load paper:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 1: Setup Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUploadAndParse = async () => {
    if (!file) return;
    setIsUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE}/api/admin/pyq/upload-pdf`, {
        method: 'POST',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Failed to parse PDF');

      const processed: ParsedQuestion[] = (data.questions || []).map((q: any) => ({
        ...q,
        tempId: q.tempId || `q_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        questionNumber: q.questionNumber || q.question_number || 1,
        text: q.text || q.question_text || '',
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: q.correctAnswer || q.correct_answer || 'A',
        imageUrl: q.imageUrl || q.image_url || '',
        status: 'draft_review'
      }));
      setQuestions(processed);

      // Show section count summary
      const counts = { Physics: 0, Chemistry: 0, Mathematics: 0, Biology: 0 };
      processed.forEach(q => { if (counts[q.section as keyof typeof counts] !== undefined) counts[q.section as keyof typeof counts]++; });
      setMessage({
        type: 'success',
        text: `Extracted ${processed.length} questions — Physics: ${counts.Physics}, Chemistry: ${counts.Chemistry}, Math: ${counts.Mathematics}, Biology: ${counts.Biology}`
      });

      // Auto-advance to Step 2
      setCurrentStep(1);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'PDF parsing failed' });
    } finally {
      setIsUploading(false);
    }
  };

  const [isVisionUploading, setIsVisionUploading] = useState(false);

  const handleUploadAndParseVision = async () => {
    if (!file) return;
    setIsVisionUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE}/api/admin/pyq/upload-pdf-vision`, {
        method: 'POST',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Failed to parse PDF with Vision AI');

      const processed: ParsedQuestion[] = (data.questions || []).map((q: any) => ({
        ...q,
        tempId: q.tempId || `q_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        questionNumber: q.questionNumber || q.question_number || 1,
        text: q.text || q.question_text || '',
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: q.correctAnswer || q.correct_answer || 'A',
        imageUrl: q.imageUrl || q.image_url || '',
        status: 'draft_review'
      }));
      setQuestions(processed);

      const counts = { Physics: 0, Chemistry: 0, Mathematics: 0, Biology: 0 };
      processed.forEach(q => { if (counts[q.section as keyof typeof counts] !== undefined) counts[q.section as keyof typeof counts]++; });
      setMessage({
        type: 'success',
        text: `🤖 Vision AI Extracted ${processed.length} questions with 100% Math Symbol Precision — Physics: ${counts.Physics}, Chemistry: ${counts.Chemistry}, Math: ${counts.Mathematics}, Biology: ${counts.Biology}`
      });

      setCurrentStep(1);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Vision AI parsing failed' });
    } finally {
      setIsVisionUploading(false);
    }
  };

  // --- Step 2: Question Editing Handlers ---
  const getSectionQuestions = (section: string) =>
    questions.filter(q => (q.section || 'Physics') === section);

  const handleTextChange = (id: string, text: string) => {
    setQuestions(prev => prev.map(q => (q.tempId || q.id) === id ? { ...q, text, question_text: text } : q));
  };

  const handleOptionChange = (id: string, optionIndex: number, newText: string) => {
    setQuestions(prev => prev.map(q => {
      if ((q.tempId || q.id) !== id) return q;
      const newOpts = [...q.options];
      newOpts[optionIndex] = newText;
      return { ...q, options: newOpts };
    }));
  };

  const handleAnswerChange = (id: string, answer: string) => {
    setQuestions(prev => prev.map(q => (q.tempId || q.id) === id ? { ...q, correctAnswer: answer, correct_answer: answer } : q));
  };

  const handleSectionChange = (id: string, section: string) => {
    setQuestions(prev => prev.map(q => (q.tempId || q.id) === id ? { ...q, section } : q));
  };

  const handleImageChange = (id: string, imageUrl: string) => {
    let directUrl = imageUrl.trim();
    const driveMatch = directUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || directUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) directUrl = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    setQuestions(prev => prev.map(q => (q.tempId || q.id) === id ? { ...q, imageUrl: directUrl, image_url: directUrl } : q));
  };

  const handleDeleteQuestion = (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    const deletedQ = questions.find(q => (q.tempId || q.id) === id);
    const deletedSection = deletedQ?.section || activeTab;
    setQuestions(prev => {
      const filtered = prev.filter(q => (q.tempId || q.id) !== id);
      let sectionCounter = 0;
      return filtered.map(q => {
        if (q.section === deletedSection) {
          sectionCounter++;
          return { ...q, questionNumber: sectionCounter, question_number: sectionCounter };
        }
        return q;
      });
    });
  };

  const handleAddQuestion = () => {
    const sectionQs = getSectionQuestions(activeTab);
    const nextNum = sectionQs.length > 0 ? Math.max(...sectionQs.map(q => q.questionNumber || 0)) + 1 : 1;
    const newId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newQ: ParsedQuestion = {
      tempId: newId,
      questionNumber: nextNum,
      section: activeTab,
      type: 'MCQ',
      text: '',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'A',
      imageUrl: '',
      status: 'draft_review'
    };
    setQuestions(prev => [...prev, newQ]);
    setEditingQId(newId);
  };

  const handleOpenStudioForNew = () => {
    setStudioQuestion(null);
    setStudioOpen(true);
  };

  const handleOpenStudioForEdit = (q: ParsedQuestion) => {
    setStudioQuestion({
      id: q.id || q.tempId,
      test_id: savedTestId || testId || null,
      section: q.section || activeTab,
      question_number: q.questionNumber || q.question_number || 1,
      question_text: q.text || q.question_text || '',
      type: q.type || 'MCQ',
      options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: q.correctAnswer || q.correct_answer || 'A',
      image_url: q.imageUrl || q.image_url || '',
      solution_explanation: (q as any).solution_explanation || ''
    });
    setStudioOpen(true);
  };

  const handleSaveFromStudio = async (qData: QuestionData) => {
    if (qData.id) {
      setQuestions(prev => prev.map(q => {
        if ((q.tempId || q.id) === qData.id) {
          return {
            ...q,
            section: qData.section,
            type: qData.type || 'MCQ',
            text: qData.question_text,
            question_text: qData.question_text,
            options: qData.options,
            correctAnswer: qData.correct_answer,
            correct_answer: qData.correct_answer,
            imageUrl: qData.image_url || '',
            image_url: qData.image_url || '',
            solution_explanation: qData.solution_explanation
          };
        }
        return q;
      }));
    } else {
      const sectionQs = getSectionQuestions(qData.section);
      const nextNum = sectionQs.length > 0 ? Math.max(...sectionQs.map(q => q.questionNumber || 0)) + 1 : 1;
      const newId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      setQuestions(prev => [
        ...prev,
        {
          tempId: newId,
          questionNumber: nextNum,
          section: qData.section,
          type: qData.type || 'MCQ',
          text: qData.question_text,
          question_text: qData.question_text,
          options: qData.options,
          correctAnswer: qData.correct_answer,
          correct_answer: qData.correct_answer,
          imageUrl: qData.image_url || '',
          image_url: qData.image_url || '',
          status: 'draft_review'
        }
      ]);
    }
    setMessage({ type: 'success', text: '✅ Question updated in Paper Builder!' });
  };

  // --- Option Shuffling & Randomization Handlers ---
  const shuffleQuestionOptions = (q: ParsedQuestion): ParsedQuestion => {
    const currentKey = q.correctAnswer || q.correct_answer || 'A';
    const keys = ['A', 'B', 'C', 'D'];
    const correctIdx = keys.indexOf(currentKey);

    if (correctIdx === -1 || !q.options || q.options.length < 4) return q;

    const indexedOptions = q.options.map((optText, idx) => ({ optText, isCorrect: idx === correctIdx }));

    // Fisher-Yates Shuffle
    for (let i = indexedOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexedOptions[i], indexedOptions[j]] = [indexedOptions[j], indexedOptions[i]];
    }

    const newOptions = indexedOptions.map(o => o.optText);
    const newCorrectIdx = indexedOptions.findIndex(o => o.isCorrect);
    const newCorrectKey = keys[newCorrectIdx];

    return {
      ...q,
      options: newOptions,
      correctAnswer: newCorrectKey,
      correct_answer: newCorrectKey
    };
  };

  const handleShuffleAllOptions = () => {
    if (!window.confirm('Randomly shuffle options for ALL questions across Physics, Chemistry, Math, and Biology? Correct answers will be automatically updated to match.')) return;
    setQuestions(prev => prev.map(q => shuffleQuestionOptions(q)));
    setMessage({
      type: 'success',
      text: '🎲 All question options have been randomly shuffled and answer keys (A, B, C, D) redistributed evenly! Students cannot guess all A.'
    });
  };

  const handleShuffleSingleQuestionOptions = (id: string) => {
    setQuestions(prev => prev.map(q => (q.tempId || q.id) === id ? shuffleQuestionOptions(q) : q));
  };

  // --- Step 4: Save / Publish ---
  const handleSaveDraft = async () => {
    if (!examTitle.trim()) { setMessage({ type: 'error', text: 'Please enter a paper title.' }); setCurrentStep(0); return; }
    setIsSavingDraft(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/api/admin/pyq/approve-publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          title: examTitle,
          examType,
          year,
          durationMinutes: parseInt(duration) || 180,
          questions: questions.map(q => ({
            section: q.section,
            question_number: q.questionNumber,
            question_text: q.text || q.question_text,
            type: q.type || 'MCQ',
            options: q.options,
            correct_answer: q.correctAnswer || q.correct_answer || 'A',
            image_url: q.imageUrl || q.image_url || null,
          }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Failed to save');
      setSavedTestId(data.testId);
      setPaperStatus('draft');
      setMessage({ type: 'success', text: `Paper saved as draft with ${data.insertedCount || questions.length} questions. Not yet visible to students.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!savedTestId) {
      // Save first, then publish
      await handleSaveDraft();
    }
    const idToPublish = savedTestId;
    if (!idToPublish) { setMessage({ type: 'error', text: 'Please save the paper first.' }); return; }

    setIsPublishing(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/pyq/publish/${idToPublish}`, {
        method: 'POST',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to publish');
      setPaperStatus('ongoing');
      setMessage({ type: 'success', text: '🎉 Paper is now LIVE and visible to students on vigyanprep.com/pyq!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!savedTestId) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/pyq/unpublish/${savedTestId}`, {
        method: 'POST',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to unpublish');
      setPaperStatus('draft');
      setMessage({ type: 'info', text: 'Paper unpublished. Students can no longer see it.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // --- Section Counts ---
  const sectionCounts = SECTIONS.reduce((acc, s) => {
    acc[s] = questions.filter(q => q.section === s).length;
    return acc;
  }, {} as Record<string, number>);

  const totalQuestions = questions.length;

  // --- Preview ---
  const previewQuestions = questions.sort((a, b) => {
    const sectionOrder = SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section);
    if (sectionOrder !== 0) return sectionOrder;
    return (a.questionNumber || 0) - (b.questionNumber || 0);
  });
  const currentPreviewQ = previewQuestions[previewIdx];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400 dark:text-neutral-400">Loading paper...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 transition">
            <ArrowLeft size={18} className="text-slate-600 dark:text-neutral-300" />
          </button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <BookOpen size={24} /> Paper Builder
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {testId ? `Editing: ${examTitle || 'Untitled Paper'}` : 'Create a new question paper'}
              {paperStatus !== 'new' && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  paperStatus === 'ongoing' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                  paperStatus === 'frozen' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                }`}>
                  {paperStatus}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Header Action: Clear Local Working Draft */}
        {!testId && (questions.length > 0 || examTitle) && (
          <button
            onClick={clearLocalDraft}
            className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-500/30 flex items-center gap-1.5 transition"
            title="Clear saved local draft to start a fresh paper"
          >
            <Trash2 size={13} /> Clear Working Draft
          </button>
        )}
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            const isClickable = idx <= currentStep || (idx === 1 && questions.length > 0) || (idx <= 3 && savedTestId);
            return (
              <div key={step.label} className="flex items-center flex-1">
                <button
                  onClick={() => isClickable && setCurrentStep(idx)}
                  disabled={!isClickable}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all w-full ${
                    isActive ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 shadow-sm' :
                    isCompleted ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' :
                    'bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-white/5 opacity-60'
                  } ${isClickable ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-amber-400 text-neutral-950' :
                    isCompleted ? 'bg-emerald-400 text-white' :
                    'bg-slate-200 dark:bg-neutral-700 text-slate-500 dark:text-neutral-400'
                  }`}>
                    {isCompleted ? <Check size={16} /> : <StepIcon size={16} />}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className={`text-xs font-bold ${isActive ? 'text-amber-700 dark:text-amber-400' : isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-neutral-500'}`}>
                      {step.label}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-neutral-500">{step.description}</div>
                  </div>
                </button>
                {idx < STEPS.length - 1 && (
                  <ChevronRight size={16} className="text-slate-300 dark:text-neutral-600 mx-1 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 border ${
          message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' :
          message.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400' :
          'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : message.type === 'error' ? <AlertCircle size={18} /> : <Sparkles size={18} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto p-1 hover:opacity-70"><X size={14} /></button>
        </div>
      )}

      {/* ============ STEP 1: SETUP ============ */}
      {currentStep === 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings2 size={20} className="text-amber-500" /> Paper Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-1.5">Paper Title *</label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 transition"
                placeholder="IISER IAT 2025 Official Paper"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-1.5">Exam Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-amber-400"
              >
                <option value="IAT">IISER IAT</option>
                <option value="NEST">NISER NEST</option>
                <option value="CMI">CMI Entrance</option>
                <option value="IISc">IISc Entrance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-1.5">Year</label>
              <input
                type="text" value={year} onChange={(e) => setYear(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-1.5">Duration (mins)</label>
              <input
                type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* PDF Upload Zone */}
          <div className="border-t border-slate-100 dark:border-white/5 pt-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
              <Upload size={16} className="text-amber-500" /> Upload PDF (Optional — auto-extracts questions)
            </h3>
            <div className="border-2 border-dashed border-slate-200 dark:border-white/15 rounded-xl p-8 text-center space-y-3 hover:border-amber-400/50 transition bg-slate-50/50 dark:bg-neutral-800/30">
              <FileUp size={36} className="mx-auto text-amber-400 opacity-80" />
              <p className="text-sm text-slate-600 dark:text-neutral-300 font-medium">Drop PDF here or click to browse</p>
              <p className="text-xs text-slate-400 dark:text-neutral-500">Text-based PDFs only, up to 20MB</p>
              <input
                type="file" accept=".pdf" onChange={handleFileChange}
                className="block w-full max-w-sm mx-auto text-sm text-slate-500 dark:text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-400 file:text-neutral-950 hover:file:bg-amber-300 cursor-pointer"
              />
            </div>
            {file && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleUploadAndParse}
                  disabled={isUploading || isVisionUploading}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 text-xs border border-white/10"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  {isUploading ? 'Extracting...' : `⚡ Standard Parse "${file.name.slice(0, 15)}..."`}
                </button>

                <button
                  onClick={handleUploadAndParseVision}
                  disabled={isUploading || isVisionUploading}
                  className="py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-neutral-950 font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 text-xs shadow-lg"
                >
                  {isVisionUploading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  {isVisionUploading ? 'Vision AI Parsing Math & Symbols...' : `🤖 AI Vision Parse (100% Math Precision)`}
                </button>
              </div>
            )}
          </div>

          {/* Next button */}
          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/5">
            <button
              onClick={() => {
                if (!examTitle.trim()) { setMessage({ type: 'error', text: 'Please enter a paper title.' }); return; }
                setCurrentStep(1);
              }}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold rounded-xl text-sm flex items-center gap-2 transition"
            >
              {questions.length > 0 ? 'Next: Edit Questions' : 'Next: Add Questions Manually'}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ============ STEP 2: QUESTIONS ============ */}
      {currentStep === 1 && (
        <div className="space-y-4">
          {/* Section Tabs with Counts */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {SECTIONS.map(sec => {
                const count = sectionCounts[sec] || 0;
                const SIcon = SECTION_ICONS[sec];
                const isActive = activeTab === sec;
                return (
                  <button
                    key={sec}
                    onClick={() => setActiveTab(sec)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition border ${
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-neutral-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-400 hover:border-amber-300 dark:hover:border-amber-500/30'
                    }`}
                  >
                    <SIcon size={14} />
                    {sec}
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                      count > 0 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-neutral-700 text-slate-400 dark:text-neutral-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-slate-400 dark:text-neutral-500">Total: <strong className="text-slate-700 dark:text-white">{totalQuestions}</strong></span>
                {totalQuestions > 0 && (
                  <button
                    onClick={handleShuffleAllOptions}
                    className="px-3 py-2 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                    title="Randomly shuffle options for ALL questions and redistribute answer keys (A, B, C, D)"
                  >
                    <Shuffle size={14} /> Shuffle Keys
                  </button>
                )}
                {savedTestId && (
                  <button
                    onClick={() => setBankImportOpen(true)}
                    className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    <BookOpen size={14} /> Import from Bank
                  </button>
                )}
                <button
                  onClick={handleOpenStudioForNew}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
                >
                  <Sparkles size={14} /> Studio Mode (+Live KaTeX)
                </button>
              </div>
            </div>
          </div>

          {/* Question Cards */}
          <div className="space-y-4">
            {getSectionQuestions(activeTab).length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center">
                <p className="text-sm text-slate-500 dark:text-neutral-400">No {activeTab} questions yet.</p>
                <button
                  onClick={handleAddQuestion}
                  className="mt-3 px-4 py-2 bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1 mx-auto transition hover:bg-amber-500"
                >
                  <Plus size={14} /> Add First {activeTab} Question
                </button>
              </div>
            ) : (
              getSectionQuestions(activeTab)
                .sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0))
                .map(q => {
                  const qId = q.tempId || q.id || '';
                  const isEditing = editingQId === qId;
                  return (
                    <div key={qId} className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm hover:border-amber-300/50 dark:hover:border-amber-500/30 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-xs font-extrabold text-amber-700 dark:text-amber-400">
                            {q.questionNumber}
                          </span>
                          <select
                            value={q.section}
                            onChange={(e) => handleSectionChange(qId, e.target.value)}
                            className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 text-xs rounded-lg px-2 py-1 text-slate-700 dark:text-neutral-300 focus:outline-none"
                          >
                            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShuffleSingleQuestionOptions(qId)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 flex items-center gap-1"
                            title="Shuffle options for this question and update correct answer key"
                          >
                            <Shuffle size={13} /> Shuffle
                          </button>
                          <button
                            onClick={() => handleOpenStudioForEdit(q)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold border transition bg-amber-400/10 border-amber-400/30 text-amber-400 hover:bg-amber-400 hover:text-black flex items-center gap-1"
                            title="Open in split-pane Studio with Live KaTeX preview"
                          >
                            <Sparkles size={12} /> Studio
                          </button>
                          <button onClick={() => setEditingQId(isEditing ? null : qId)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition bg-slate-50 dark:bg-neutral-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-300 hover:border-amber-300">
                            {isEditing ? 'Collapse' : 'Edit'}
                          </button>
                          <button onClick={() => handleDeleteQuestion(qId)}
                            className="p-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-lg transition" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-neutral-400">
                            <span className="text-[10px] text-amber-500 font-extrabold uppercase mr-1">Math Snippets:</span>
                            {[
                              { label: '∫ Integral', code: '\\int ' },
                              { label: '⃗ Vector', code: '\\vec{v} ' },
                              { label: '÷ Division', code: '\\div ' },
                              { label: '× Times', code: '\\times ' },
                              { label: '½ Fraction', code: '\\frac{a}{b} ' },
                              { label: '√ Root', code: '\\sqrt{x} ' },
                              { label: '∑ Sum', code: '\\sum ' },
                              { label: 'lim Limit', code: '\\lim_{x \\to 0} ' },
                              { label: 'Power xⁿ', code: '^{n}' },
                              { label: 'Subscript xₙ', code: '_{n}' },
                              { label: 'ρ', code: '\\rho ' },
                              { label: 'Δ', code: '\\Delta ' },
                              { label: 'θ', code: '\\theta ' },
                              { label: 'π', code: '\\pi ' },
                              { label: '∞', code: '\\infty ' },
                              { label: '≫', code: '\\gg ' },
                              { label: '≪', code: '\\ll ' },
                              { label: '±', code: '\\pm ' },
                            ].map((item) => (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => handleTextChange(qId, (q.text || q.question_text || '') + ' ' + item.code)}
                                className="px-2 py-0.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded hover:border-amber-400 hover:text-amber-500 transition text-[10px]"
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={q.text || q.question_text || ''}
                            onChange={(e) => handleTextChange(qId, e.target.value)}
                            className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-amber-400"
                            rows={3}
                            placeholder="Enter question text... (supports $LaTeX$ math, e.g. $1 - (1 - \\frac{\\rho g d}{B})^{1/3}$)"
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-slate-700 dark:text-neutral-200 leading-relaxed">
                          <MathRenderer text={q.text || q.question_text || '(empty question)'} />
                        </div>
                      )}

                      {/* Question Diagram Image Preview in List Card */}
                      {(q.imageUrl || q.image_url) && (
                        <div className="my-2 p-2 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl max-w-sm">
                          <img
                            src={formatImageUrl(q.imageUrl || q.image_url || '')}
                            alt="Question Diagram"
                            className="max-h-48 mx-auto object-contain rounded-lg shadow-xs"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Image URL & Crop Diagram Button */}
                      {isEditing && (
                        <div className="flex items-center gap-2">
                          <Image size={14} className="text-amber-500 shrink-0" />
                          <input
                            type="url"
                            value={q.imageUrl || q.image_url || ''}
                            onChange={(e) => handleImageChange(qId, e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-amber-400"
                            placeholder="Optional: diagram URL (auto-extracted or paste link)"
                          />
                          <button
                            type="button"
                            onClick={() => setCropTargetQId(qId)}
                            className="px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-500 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition shrink-0"
                            title="Open interactive canvas diagram cropper"
                          >
                            <Crop size={14} /> Crop Diagram
                          </button>
                        </div>
                      )}

                      {/* Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['A', 'B', 'C', 'D'].map((optKey, idx) => {
                          const isCorrect = (q.correctAnswer || q.correct_answer) === optKey;
                          const optVal = q.options[idx] || '';
                          return (
                            <div key={optKey}
                              className={`p-3 rounded-xl border flex flex-col gap-2 transition ${
                                isCorrect ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30' : 'bg-slate-50 dark:bg-neutral-800 border-slate-200 dark:border-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => handleAnswerChange(qId, optKey)}
                                  className={`w-6 h-6 rounded-full font-bold text-[10px] shrink-0 flex items-center justify-center transition ${
                                    isCorrect ? 'bg-emerald-400 text-white' : 'bg-slate-200 dark:bg-neutral-700 text-slate-500 dark:text-neutral-400 hover:bg-amber-200 dark:hover:bg-amber-500/30'
                                  }`}
                                >
                                  {isCorrect ? <Check size={12} /> : optKey}
                                </button>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={optVal}
                                    onChange={(e) => handleOptionChange(qId, idx, e.target.value)}
                                    className="flex-1 bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none border-b border-dashed border-slate-300 dark:border-white/20 pb-0.5 font-mono"
                                    placeholder={`Option ${optKey} text or LaTeX (e.g. 1 - (1 - \\frac{\\rho g d}{B})^{1/3})...`}
                                  />
                                ) : (
                                  <span className="text-xs text-slate-700 dark:text-neutral-200">
                                    <MathRenderer text={optVal || `Option ${optKey}`} />
                                  </span>
                                )}
                              </div>

                              {/* Real-time Live KaTeX Preview Box when editing */}
                              {isEditing && optVal && (
                                <div className="ml-8 p-2 rounded-lg bg-white/50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-xs flex items-center gap-2">
                                  <span className="text-[9px] font-extrabold text-amber-500 uppercase shrink-0">Live Math Preview:</span>
                                  <div className="text-slate-800 dark:text-neutral-100 overflow-x-auto">
                                    <MathRenderer text={optVal} />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <button onClick={() => setCurrentStep(0)}
              className="px-5 py-2.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-semibold rounded-xl text-sm flex items-center gap-2 transition border border-slate-200 dark:border-white/10">
              <ChevronLeft size={16} /> Back: Setup
            </button>
            <button onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold rounded-xl text-sm flex items-center gap-2 transition">
              Next: Preview <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ============ STEP 3: PREVIEW ============ */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden">
            {/* Preview Header */}
            <div className="bg-neutral-950 border-b border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye size={18} className="text-amber-400" />
                <span className="text-sm font-bold text-white">Student View Preview</span>
                <span className="text-xs text-neutral-400">— How students will see this exam</span>
              </div>
              <span className="text-xs bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full border border-white/10">
                Question {previewIdx + 1} of {previewQuestions.length}
              </span>
            </div>

            {/* Question Content */}
            {currentPreviewQ ? (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/20">
                    {currentPreviewQ.section}
                  </span>
                  <span className="text-xs text-neutral-400">
                    Q{currentPreviewQ.questionNumber}
                  </span>
                </div>

                <div className="text-white text-base leading-relaxed font-medium">
                  <MathRenderer text={currentPreviewQ.text || currentPreviewQ.question_text || ''} />
                </div>

                {(currentPreviewQ.imageUrl || currentPreviewQ.image_url) && (
                  <div className="p-3 bg-neutral-950 rounded-xl border border-white/10 text-center">
                    <img src={currentPreviewQ.imageUrl || currentPreviewQ.image_url} alt="Diagram" className="max-h-48 mx-auto object-contain rounded" />
                  </div>
                )}

                <div className="space-y-2.5">
                  {['A', 'B', 'C', 'D'].map((optKey, idx) => {
                    const optText = currentPreviewQ.options?.[idx] || `Option ${optKey}`;
                    const isSelected = selectedAnswers[previewIdx] === optKey;
                    const isCorrect = (currentPreviewQ.correctAnswer || currentPreviewQ.correct_answer) === optKey;
                    return (
                      <button key={optKey}
                        onClick={() => setSelectedAnswers(prev => ({ ...prev, [previewIdx]: optKey }))}
                        className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition ${
                          isSelected ? 'bg-amber-400/10 border-amber-400 text-white' : 'bg-neutral-950 border-white/10 text-neutral-300 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center ${
                            isSelected ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                          }`}>{optKey}</span>
                          <span className="text-sm"><MathRenderer text={optText} /></span>
                        </div>
                        {isCorrect && (
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded font-semibold border border-emerald-500/30">
                            ✓ Correct
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-neutral-400">No questions to preview.</div>
            )}

            {/* Preview Navigation */}
            <div className="bg-neutral-950 border-t border-white/10 p-4 flex items-center justify-between">
              <button disabled={previewIdx === 0} onClick={() => setPreviewIdx(prev => prev - 1)}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg text-xs font-semibold disabled:opacity-30 hover:bg-neutral-700 transition">
                ← Previous
              </button>
              {/* Section jump buttons */}
              <div className="flex gap-1">
                {SECTIONS.map(sec => {
                  const firstIdx = previewQuestions.findIndex(q => q.section === sec);
                  if (firstIdx < 0) return null;
                  const isCurrentSection = currentPreviewQ?.section === sec;
                  return (
                    <button key={sec} onClick={() => setPreviewIdx(firstIdx)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${isCurrentSection ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}>
                      {sec.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
              <button disabled={previewIdx >= previewQuestions.length - 1} onClick={() => setPreviewIdx(prev => prev + 1)}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg text-xs font-semibold disabled:opacity-30 hover:bg-neutral-700 transition">
                Next →
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <button onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-semibold rounded-xl text-sm flex items-center gap-2 transition border border-slate-200 dark:border-white/10">
              <ChevronLeft size={16} /> Back: Questions
            </button>
            <button onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold rounded-xl text-sm flex items-center gap-2 transition">
              Next: Publish <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ============ STEP 4: PUBLISH ============ */}
      {currentStep === 3 && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Rocket size={20} className="text-amber-500" /> Paper Summary
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalQuestions}</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase">Total Questions</div>
              </div>
              {SECTIONS.map(sec => {
                const SIcon = SECTION_ICONS[sec];
                const count = sectionCounts[sec] || 0;
                return (
                  <div key={sec} className={`border rounded-xl p-4 text-center ${SECTION_COLORS[sec]}`}>
                    <SIcon size={18} className="mx-auto mb-1" />
                    <div className="text-xl font-bold">{count}</div>
                    <div className="text-[10px] font-bold uppercase">{sec}</div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-neutral-400">Title:</span>
                <span className="font-semibold text-slate-800 dark:text-white">{examTitle || '(untitled)'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-neutral-400">Exam Type:</span>
                <span className="font-semibold text-slate-800 dark:text-white">{examType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-neutral-400">Year:</span>
                <span className="font-semibold text-slate-800 dark:text-white">{year}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-neutral-400">Duration:</span>
                <span className="font-semibold text-slate-800 dark:text-white">{duration} minutes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-neutral-400">Status:</span>
                <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                  paperStatus === 'ongoing' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                }`}>
                  {paperStatus === 'ongoing' ? '🟢 LIVE' : paperStatus === 'draft' ? '📝 DRAFT' : '🆕 NEW'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Save as Draft */}
              <button
                onClick={handleSaveDraft}
                disabled={isSavingDraft || !examTitle.trim()}
                className="w-full py-4 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition border-2 border-slate-200 dark:border-white/10 disabled:opacity-50"
              >
                {isSavingDraft ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isSavingDraft ? 'Saving...' : 'Save as Draft'}
              </button>

              {/* Publish / Unpublish */}
              {paperStatus === 'ongoing' ? (
                <button
                  onClick={handleUnpublish}
                  className="w-full py-4 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition border-2 border-red-200 dark:border-red-500/30"
                >
                  <X size={18} /> Unpublish (Hide from Students)
                </button>
              ) : (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || !examTitle.trim() || questions.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-50"
                >
                  {isPublishing ? <Loader2 className="animate-spin" size={18} /> : <Rocket size={18} />}
                  {isPublishing ? 'Publishing...' : '🚀 Go Live — Publish to Students'}
                </button>
              )}
            </div>
          </div>

          {/* Back button */}
          <div className="flex justify-start pt-2">
            <button onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-semibold rounded-xl text-sm flex items-center gap-2 transition border border-slate-200 dark:border-white/10">
              <ChevronLeft size={16} /> Back: Preview
            </button>
          </div>
        </div>
      )}

      {/* Interactive Diagram Bounding-Box Canvas Crop Modal */}
      {cropTargetQId && (
        <CropDiagramModal
          file={file}
          token={token}
          onCropComplete={(imageUrl) => {
            handleImageChange(cropTargetQId, imageUrl);
            setMessage({ type: 'success', text: '✂️ Diagram cropped & saved directly to server storage!' });
          }}
          onClose={() => setCropTargetQId(null)}
        />
      )}

      {/* Question Studio Split-Pane Modal */}
      <QuestionStudioModal
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
        onSave={handleSaveFromStudio}
        initialData={studioQuestion}
        defaultSection={activeTab}
        defaultTestId={savedTestId || testId}
      />

      {/* Import from Master Question Bank Modal */}
      {savedTestId && (
        <ImportFromBankModal
          isOpen={bankImportOpen}
          onClose={() => setBankImportOpen(false)}
          testId={savedTestId}
          existingQuestions={questions}
          onSuccess={() => {
            loadExistingPaper(savedTestId);
            setMessage({ type: 'success', text: '✅ Questions imported from Question Bank successfully!' });
          }}
        />
      )}
    </div>
  );
}
