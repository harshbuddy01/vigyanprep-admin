import React, { useState, useEffect, useRef } from 'react';
import {
  X, Check, Image, AlertCircle, Save, Sparkles,
  ChevronDown, HelpCircle, CheckCircle2, Eye, Plus, Trash2
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

export interface QuestionData {
  id?: string;
  test_id?: string;
  section: string;
  type?: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  marks_positive?: number;
  marks_negative?: number;
  question_number?: number;
  image_url?: string;
  solution_explanation?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  topic?: string;
  exam_type?: string;
}

interface QuestionStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (questionData: QuestionData, isEdit: boolean) => Promise<void>;
  initialData?: QuestionData | null;
  defaultTestId?: string;
  defaultSection?: string;
}

const SECTIONS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

const QUICK_MATH_SYMBOLS = [
  { label: '√x', tex: '\sqrt{x}' },
  { label: 'a/b', tex: '\frac{a}{b}' },
  { label: 'x²', tex: 'x^{2}' },
  { label: 'x₁', tex: 'x_{1}' },
  { label: '10⁻⁵', tex: '10^{-5}' },
  { label: '∫', tex: '\int ' },
  { label: 'v⃗', tex: '\vec{v}' },
  { label: '→', tex: '\rightarrow' },
  { label: '⇌', tex: '\rightleftharpoons' },
  { label: 'Δ', tex: '\Delta' },
  { label: 'θ', tex: '\theta' },
  { label: 'π', tex: '\pi' },
  { label: '±', tex: '\pm' },
  { label: '∞', tex: '\infty' },
  { label: '∑', tex: '\sum_{i=1}^{n}' },
];

type QuestionTemplate = 'standard' | 'multi_statement' | 'statement' | 'assertion_reason' | 'match_column';

function formatImageUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  return trimmed;
}

function autoFormatMathTextClient(raw: string): string {
  if (!raw) return '';
  let str = raw;

  const superMap: Record<string, string> = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-' };
  const subMap: Record<string, string> = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','₊':'+','₋':'-' };
  str = str.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, (m) => '^{' + [...m].map(c => superMap[c] || c).join('') + '}');
  str = str.replace(/[₀₁₂₃₄₅₆₇₈₉₊₋]+/g, (m) => '_{' + [...m].map(c => subMap[c] || c).join('') + '}');

  str = str
    .replace(/(?:\u221A|√)\s*\((.*?)\)/g, ' $\\sqrt{$1}$ ')
    .replace(/(?:\u221A|√)\s*([a-zA-Z0-9]+)/g, ' $\\sqrt{$1}$ ')
    .replace(/\b(?:sqrt|root)\s*\((.*?)\)/gi, ' $\\sqrt{$1}$ ')
    .replace(/\b(?:sqrt|root)\s*([a-zA-Z0-9]+)\b/gi, ' $\\sqrt{$1}$ ')
    .replace(/[√\u221A]/g, ' \\sqrt ');

  const chemTokens = /\b(N2O|NO2|NO3|H2O|CO2|SO2|SO3|SO4|NH3|NH4|BH4|H3O|CH4|C2H6|C6H6|C6H12O6|H2SO4|HNO3|HCl|NaOH|KOH|KMnO4|O3|O2|N2|H2|Cl2|Br2|I2|F2)\b/g;
  str = str.replace(chemTokens, (_m, token) => {
    const sub = token.replace(/([A-Za-z])(\d+)/g, '$1_{$2}');
    return '$' + sub + '$';
  });

  str = str
    .replace(/(\d+(?:\.\d+)?)\s*[xX\*×]\s*10\s*\^?\s*(-?\d+)/g, ' $$$1 \\times 10^{$2}$$ ')
    .replace(/\b10\s*\^\s*(-?\d+)/g, ' $$10^{$1}$$ ')
    .replace(/\b([a-zA-Z])\s*\^\s*([a-zA-Z0-9\-\+]+)\b/g, '$$$1^{$2}$$')
    .replace(/\b([a-zA-Z])\s*_\s*([a-zA-Z0-9\-\+]+)\b/g, '$$$1_{$2}$$');

  str = str
    .replace(/\b(\d+)\s*\/\s*(\d+)\b/g, ' $\\frac{$1}{$2}$ ')
    .replace(/\b([a-zA-Z])\s*\/\s*([a-zA-Z0-9]+)\b/g, ' $\\frac{$1}{$2}$ ');

  str = str
    .replace(/[\u00F7]/g, ' \\div ')
    .replace(/[\u00D7\u2A2F]/g, ' \\times ')
    .replace(/[\u2264]/g, ' \\le ')
    .replace(/[\u2265]/g, ' \\ge ')
    .replace(/[\u2260]/g, ' \\neq ')
    .replace(/[\u00B1]/g, ' $\\pm$ ')
    .replace(/[\u2192\u27F6]/g, ' $\\rightarrow$ ')
    .replace(/[\u21CC\u21C4]/g, ' $\\rightleftharpoons$ ');

  str = str.replace(/\${2,}/g, '$').replace(/\$\$/g, '$ $');
  return str.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export function QuestionStudioModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultTestId,
  defaultSection = 'Physics'
}: QuestionStudioModalProps) {
  // Persist subject across questions in localStorage
  const savedSection = typeof window !== 'undefined' ? localStorage.getItem('vigyan_last_section') : null;
  const initialSection = savedSection || defaultSection || 'Physics';

  const [section, setSection] = useState(initialSection);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [examType, setExamType] = useState('IAT');
  const [topic, setTopic] = useState('');
  const [qType, setQType] = useState<'MCQ' | 'MSQ' | 'Numerical'>('MCQ');
  const [marksPositive, setMarksPositive] = useState(4);
  const [marksNegative, setMarksNegative] = useState(1);

  const [template, setTemplate] = useState<QuestionTemplate>('standard');

  const [contextText, setContextText] = useState('');
  const [statement1, setStatement1] = useState('');
  const [statement2, setStatement2] = useState('');
  const [multiStatements, setMultiStatements] = useState<string[]>(['', '', '']);
  const [followUpText, setFollowUpText] = useState('');
  const [rawQuestionText, setRawQuestionText] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Match the Column State
  const [col1Name, setCol1Name] = useState('Column-I');
  const [col2Name, setCol2Name] = useState('Column-II');
  const [col1Items, setCol1Items] = useState<string[]>(['', '', '', '']);
  const [col2Items, setCol2Items] = useState<string[]>(['', '', '', '']);

  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [optionImages, setOptionImages] = useState<string[]>(['', '', '', '']);
  const [showOptionImage, setShowOptionImage] = useState<Record<number, boolean>>({});
  const [correctAnswer, setCorrectAnswer] = useState('A');

  const [solution, setSolution] = useState('');
  const [showSolutionSection, setShowSolutionSection] = useState(false);
  const [showMathBar, setShowMathBar] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeInputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  const handleSectionSelect = (s: string) => {
    setSection(s);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vigyan_last_section', s);
    }
  };

  const computedQuestionText = React.useMemo(() => {
    if (template === 'multi_statement') {
      const parts: string[] = [];
      if (contextText.trim()) parts.push(contextText.trim());
      multiStatements.forEach((st, idx) => {
        const cleanSt = st.replace(/^[0-9ivxIVX]+[\.\)]\s*/i, '').trim();
        if (cleanSt) {
          parts.push(`${idx + 1}. ${cleanSt}`);
        }
      });
      if (followUpText.trim()) parts.push(followUpText.trim());
      return parts.join('\n\n');
    } else if (template === 'statement') {
      const parts: string[] = [];
      if (contextText.trim()) parts.push(contextText.trim());
      if (statement1.trim()) parts.push('Statement I: ' + statement1.trim());
      if (statement2.trim()) parts.push('Statement II: ' + statement2.trim());
      if (followUpText.trim()) parts.push(followUpText.trim());
      return parts.join('\n\n');
    } else if (template === 'assertion_reason') {
      const parts: string[] = [];
      if (contextText.trim()) parts.push(contextText.trim());
      if (statement1.trim()) parts.push('Assertion (A): ' + statement1.trim());
      if (statement2.trim()) parts.push('Reason (R): ' + statement2.trim());
      if (followUpText.trim()) parts.push(followUpText.trim());
      return parts.join('\n\n');
    } else if (template === 'match_column') {
      const parts: string[] = [];
      if (contextText.trim()) parts.push(contextText.trim());
      const colLabels1 = ['(A)', '(B)', '(C)', '(D)'];
      const colLabels2 = ['(P)', '(Q)', '(R)', '(S)'];
      const tableLines = [
        '| ' + (col1Name.trim() || 'Column-I') + ' | ' + (col2Name.trim() || 'Column-II') + ' |',
        '| :--- | :--- |',
      ];
      for (let i = 0; i < 4; i++) {
        const item1 = (col1Items[i] || '').replace(/^(\([A-D]\)|[A-D]\))\s*/i, '').trim();
        const item2 = (col2Items[i] || '').replace(/^(\([P-S]\)|[P-S]\))\s*/i, '').trim();
        if (item1 || item2) {
          tableLines.push('| ' + colLabels1[i] + ' ' + item1 + ' | ' + colLabels2[i] + ' ' + item2 + ' |');
        }
      }
      if (tableLines.length > 2) {
        parts.push(tableLines.join('\n'));
      }
      if (followUpText.trim()) parts.push(followUpText.trim());
      return parts.join('\n\n');
    }
    
    // Standard template
    const parts: string[] = [];
    if (rawQuestionText.trim()) parts.push(rawQuestionText.trim());
    if (followUpText.trim()) parts.push(followUpText.trim());
    return parts.join('\n\n');
  }, [template, contextText, statement1, statement2, multiStatements, followUpText, rawQuestionText, col1Name, col2Name, col1Items, col2Items]);

  useEffect(() => {
    if (initialData) {
      setSection(initialData.section || initialSection);
      setDifficulty(initialData.difficulty || 'Medium');
      setExamType(initialData.exam_type || 'IAT');
      setTopic(initialData.topic || '');
      setQType((initialData.type as any) || 'MCQ');
      setMarksPositive(initialData.marks_positive ?? 4);
      setMarksNegative(initialData.marks_negative ?? 1);
      setImageUrl(initialData.image_url || '');
      setCorrectAnswer(initialData.correct_answer || 'A');
      setSolution(initialData.solution_explanation || '');
      if (initialData.solution_explanation) setShowSolutionSection(true);

      const qText = initialData.question_text || (initialData as any).text || '';
      setRawQuestionText(qText);

      // Detect table / Match the Columns
      if (/\|[\s\-:\|]+\|/g.test(qText) && (/Column/i.test(qText) || /List/i.test(qText))) {
        setTemplate('match_column');
        const lines = qText.split('\n');
        const tableLines = lines.filter((l: string) => l.trim().startsWith('|'));
        const intro = lines.filter((l: string) => !l.trim().startsWith('|')).join('\n').trim();
        setContextText(intro);

        if (tableLines.length >= 3) {
          const header = tableLines[0].split('|').slice(1, -1).map((c: string) => c.trim());
          setCol1Name(header[0] || 'Column-I');
          setCol2Name(header[1] || 'Column-II');

          const dataLines = tableLines.filter((l: string, idx: number) => idx > 0 && !/^\|[\s\-:\|]+\|$/.test(l.trim()));
          const newCol1 = ['', '', '', ''];
          const newCol2 = ['', '', '', ''];

          dataLines.slice(0, 4).forEach((rowLine: string, rIdx: number) => {
            const cells = rowLine.split('|').slice(1, -1).map((c: string) => c.trim());
            newCol1[rIdx] = (cells[0] || '').replace(/^\*\*\([A-D]\)\*\*\s*/, '').trim();
            newCol2[rIdx] = (cells[1] || '').replace(/^\*\*\([P-S]\)\*\*\s*/, '').trim();
          });
          setCol1Items(newCol1);
          setCol2Items(newCol2);
        }
      } else if (/Statement I:/i.test(qText) && /Statement II:/i.test(qText)) {
        setTemplate('statement');
        const st1Match = qText.match(/Statement I:\s*([\s\S]*?)(?=Statement II:|$)/i);
        const st2Match = qText.match(/Statement II:\s*([\s\S]*)$/i);
        const intro = qText.split(/Statement I:/i)[0].trim();
        setContextText(intro);
        setStatement1(st1Match ? st1Match[1].trim() : '');
        setStatement2(st2Match ? st2Match[1].trim() : '');
      } else if (/Assertion \(A\):/i.test(qText)) {
        setTemplate('assertion_reason');
        const aMatch = qText.match(/Assertion \(A\):\s*([\s\S]*?)(?=Reason \(R\):|$)/i);
        const rMatch = qText.match(/Reason \(R\):\s*([\s\S]*)$/i);
        const intro = qText.split(/Assertion \(A\):/i)[0].trim();
        setContextText(intro);
        setStatement1(aMatch ? aMatch[1].trim() : '');
        setStatement2(rMatch ? rMatch[1].trim() : '');
      } else {
        setTemplate('standard');
      }

      if (initialData.options && Array.isArray(initialData.options)) {
        const newOpts = ['', '', '', ''];
        const newOptImgs = ['', '', '', ''];
        const newShowOptImg: Record<number, boolean> = {};

        initialData.options.forEach((opt: string, i: number) => {
          if (i < 4) {
            if (/^https?:\/\//i.test(opt.trim())) {
              newOptImgs[i] = opt.trim();
              newShowOptImg[i] = true;
            } else {
              newOpts[i] = opt;
            }
          }
        });
        setOptions(newOpts);
        setOptionImages(newOptImgs);
        setShowOptionImage(newShowOptImg);
      }
    } else {
      // Reset for New Question but keep remembered section
      setSection(savedSection || defaultSection || 'Physics');
      setDifficulty('Medium');
      setExamType('IAT');
      setTopic('');
      setQType('MCQ');
      setMarksPositive(4);
      setMarksNegative(1);
      setTemplate('standard');
      setContextText('');
      setStatement1('');
      setStatement2('');
      setMultiStatements(['', '', '']);
      setFollowUpText('');
      setRawQuestionText('');
      setImageUrl('');
      setCol1Name('Column-I');
      setCol2Name('Column-II');
      setCol1Items(['', '', '', '']);
      setCol2Items(['', '', '', '']);
      setOptions(['', '', '', '']);
      setOptionImages(['', '', '', '']);
      setShowOptionImage({});
      setCorrectAnswer('A');
      setSolution('');
      setShowSolutionSection(false);
      setErrorMsg(null);
    }
  }, [initialData, defaultSection, isOpen]);

  // Insert math symbol at cursor
  const insertMath = (tex: string) => {
    const el = activeInputRef.current;
    if (!el) {
      if (template === 'standard') {
        setRawQuestionText(prev => prev + ' $' + tex + '$ ');
      } else if (template === 'multi_statement') {
        setFollowUpText(prev => prev + ' $' + tex + '$ ');
      } else {
        setStatement1(prev => prev + ' $' + tex + '$ ');
      }
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const val = el.value || '';
    const insertion = `$${tex}$`;
    const newVal = val.substring(0, start) + insertion + val.substring(end);
    
    // Update appropriate state
    if (el.dataset.field === 'raw') setRawQuestionText(newVal);
    else if (el.dataset.field === 'context') setContextText(newVal);
    else if (el.dataset.field === 'st1') setStatement1(newVal);
    else if (el.dataset.field === 'st2') setStatement2(newVal);
    else if (el.dataset.field === 'followup') setFollowUpText(newVal);
    else if (el.dataset.field === 'solution') setSolution(newVal);
    else if (el.dataset.field?.startsWith('opt_')) {
      const idx = parseInt(el.dataset.field.split('_')[1], 10);
      setOptions(prev => {
        const copy = [...prev];
        copy[idx] = newVal;
        return copy;
      });
    }

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 50);
  };

  const handlePreFillMultiStatementOptions = () => {
    setOptions([
      '1 and 2 only',
      '2 and 3 only',
      '1 and 3 only',
      '1, 2 and 3'
    ]);
  };

  const handlePreFillStatementOptions = () => {
    setOptions([
      'Both Statement I and Statement II are correct',
      'Both Statement I and Statement II are incorrect',
      'Statement I is correct but Statement II is incorrect',
      'Statement I is incorrect but Statement II is correct'
    ]);
  };

  const handlePreFillAssertionOptions = () => {
    setOptions([
      'Both (A) and (R) are true and (R) is the correct explanation of (A)',
      'Both (A) and (R) are true but (R) is NOT the correct explanation of (A)',
      '(A) is true but (R) is false',
      '(A) is false but (R) is true'
    ]);
  };

  const handlePreFillMatchOptions = () => {
    setOptions([
      'A → P,  B → Q,  C → R,  D → S',
      'A → Q,  B → P,  C → S,  D → R',
      'A → R,  B → S,  C → P,  D → Q',
      'A → S,  B → R,  C → Q,  D → P'
    ]);
  };

  const handleSave = async () => {
    const finalQText = computedQuestionText.trim();
    if (!finalQText) {
      setErrorMsg('Please enter question text or statements before saving.');
      return;
    }

    const finalOptions = options.map((opt, i) => {
      if (showOptionImage[i] && optionImages[i]?.trim()) {
        return optionImages[i].trim();
      }
      return opt.trim();
    });

    const hasFilledOptions = finalOptions.some(o => o.length > 0);
    if (!hasFilledOptions && qType !== 'Numerical') {
      setErrorMsg('Please provide at least one answer option.');
      return;
    }

    setErrorMsg(null);
    setSaving(true);

    try {
      await onSave({
        id: initialData?.id,
        test_id: initialData?.test_id || defaultTestId,
        section,
        difficulty,
        exam_type: examType,
        topic: topic.trim(),
        type: qType,
        marks_positive: marksPositive,
        marks_negative: marksNegative,
        question_text: finalQText,
        options: finalOptions,
        correct_answer: correctAnswer,
        image_url: imageUrl.trim() || undefined,
        solution_explanation: solution.trim() || undefined
      } as QuestionData, !!initialData?.id);

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut Cmd/Ctrl + Enter to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, computedQuestionText, options, optionImages, showOptionImage, correctAnswer, section, difficulty, examType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans text-zinc-100">
      <div className="bg-[#121216] border border-zinc-800 rounded-2xl w-full max-w-7xl h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* TOP BAR: Header, Subject, Meta & Close */}
        <div className="px-5 py-3.5 bg-[#17181f] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Question Authoring Studio
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Production Minimal
                </span>
              </h2>
            </div>
          </div>

          {/* Quick Meta Selectors */}
          <div className="flex items-center gap-2">
            {/* Subject Selector (Preserved in memory) */}
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
              {SECTIONS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handleSectionSelect(sec)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                    section === sec
                      ? 'bg-amber-400 text-black shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {sec.slice(0, 4)}
                </button>
              ))}
            </div>

            {/* Difficulty */}
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
            >
              <option value="Easy">🟢 Easy</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Hard">🔴 Hard</option>
            </select>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition ml-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* WORKSPACE: Left = Authoring Form (55%), Right = Live Student CBT View (45%) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT: Authoring Inputs (7 Cols) */}
          <div className="lg:col-span-7 border-r border-zinc-800/80 flex flex-col h-full overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#14151b]">
            
            {/* Template Selector Bar */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <HelpCircle size={13} className="text-amber-400" /> Structure:
              </span>
              <div className="flex flex-wrap gap-1 bg-zinc-900/90 border border-zinc-800/80 p-1 rounded-xl">
                {[
                  { id: 'standard', label: 'Standard MCQ' },
                  { id: 'multi_statement', label: 'Numbered (1,2,3)' },
                  { id: 'statement', label: 'Statement I & II' },
                  { id: 'assertion_reason', label: 'Assertion & Reason' },
                  { id: 'match_column', label: 'Match Columns' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      template === t.id
                        ? 'bg-amber-400 text-black shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Collapsible Math Toolbar */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-2 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider px-1">
                <span className="flex items-center gap-1 text-amber-400">
                  <Sparkles size={11} /> 1-Click Formula Insert
                </span>
                <button
                  type="button"
                  onClick={() => setShowMathBar(prev => !prev)}
                  className="text-zinc-500 hover:text-zinc-300 text-[10px] flex items-center gap-1"
                >
                  {showMathBar ? 'Hide Math Bar' : 'Show Math Bar'} <ChevronDown size={11} className={showMathBar ? 'rotate-180 transition' : 'transition'} />
                </button>
              </div>

              {showMathBar && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {QUICK_MATH_SYMBOLS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => insertMath(s.tex)}
                      className="px-2 py-1 bg-zinc-800 hover:bg-amber-400 hover:text-black border border-zinc-700/80 rounded-lg text-xs font-mono font-bold text-zinc-200 transition"
                      title={s.tex}
                    >
                      {s.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      if (template === 'standard') setRawQuestionText(prev => autoFormatMathTextClient(prev));
                      else if (template === 'multi_statement') {
                        setContextText(prev => autoFormatMathTextClient(prev));
                        setMultiStatements(prev => prev.map(st => autoFormatMathTextClient(st)));
                        setFollowUpText(prev => autoFormatMathTextClient(prev));
                      } else {
                        setContextText(prev => autoFormatMathTextClient(prev));
                        setStatement1(prev => autoFormatMathTextClient(prev));
                        setStatement2(prev => autoFormatMathTextClient(prev));
                        setFollowUpText(prev => autoFormatMathTextClient(prev));
                      }
                    }}
                    className="px-2 py-1 bg-amber-400/15 hover:bg-amber-400 hover:text-black text-amber-300 border border-amber-400/30 rounded-lg text-xs font-bold transition ml-auto flex items-center gap-1"
                    title="Auto-detect clean LaTeX exponents, fractions and chemical formulas"
                  >
                    ⚡ Auto-Format Math
                  </button>
                </div>
              )}
            </div>

            {/* DYNAMIC TEMPLATE INPUTS */}

            {/* TEMPLATE 1: STANDARD MCQ (Intro + Diagram + Follow-up) */}
            {template === 'standard' && (
              <div className="space-y-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Question Text / Introductory Statement
                  </label>
                </div>
                <textarea
                  data-field="raw"
                  ref={el => { if (el) activeInputRef.current = el; }}
                  value={rawQuestionText}
                  onChange={(e) => setRawQuestionText(e.target.value)}
                  placeholder="Type or paste question statement... (supports $LaTeX$ math e.g. $\frac{1}{2}mv^2$ and numbered lists)"
                  rows={4}
                  className="w-full bg-[#0d0e12] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 font-mono leading-relaxed focus:outline-none focus:border-amber-400 transition"
                />

                {/* Follow-up question prompt (Below diagram/statements) */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1 block">
                    Follow-Up Prompt / Question Line (Optional — placed below intro/diagram):
                  </label>
                  <input
                    type="text"
                    data-field="followup"
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    placeholder="e.g. Determine the elongation in the spring x and acceleration a₁..."
                    className="w-full bg-[#0d0e12] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>
            )}

            {/* TEMPLATE 2: NUMBERED STATEMENTS (1, 2, 3...) */}
            {template === 'multi_statement' && (
              <div className="space-y-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Introductory Context / Setup
                  </label>
                </div>
                <input
                  type="text"
                  data-field="context"
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="e.g. Consider the following statements regarding electrophoretic separation:"
                  className="w-full bg-[#0d0e12] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                />

                {/* Numbered statements list */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Numbered Statements (1, 2, 3...)
                    </label>
                    <button
                      type="button"
                      onClick={() => setMultiStatements(prev => [...prev, ''])}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Statement
                    </button>
                  </div>

                  {multiStatements.map((st, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2">
                      <span className="w-6 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                        {sIdx + 1}
                      </span>
                      <textarea
                        value={st}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMultiStatements(prev => {
                            const copy = [...prev];
                            copy[sIdx] = val;
                            return copy;
                          });
                        }}
                        placeholder={`Statement ${sIdx + 1} description...`}
                        rows={2}
                        className="flex-1 bg-[#0d0e12] border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 font-mono leading-relaxed focus:outline-none focus:border-amber-400"
                      />
                      {multiStatements.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setMultiStatements(prev => prev.filter((_, idx) => idx !== sIdx))}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition"
                          title="Remove statement"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Question Line */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 mb-1 block">
                    Concluding Question:
                  </label>
                  <input
                    type="text"
                    data-field="followup"
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    placeholder="e.g. Which of the statements given above is/are correct?"
                    className="w-full bg-[#0d0e12] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>
            )}

            {/* TEMPLATE 3: STATEMENT I & II */}
            {template === 'statement' && (
              <div className="space-y-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5">
                <input
                  type="text"
                  data-field="context"
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Optional context (e.g. In light of the given statements, choose the correct answer):"
                  className="w-full bg-[#0d0e12] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                />
                <div>
                  <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Statement I:
                  </label>
                  <textarea
                    data-field="st1"
                    value={statement1}
                    onChange={(e) => setStatement1(e.target.value)}
                    placeholder="Enter Statement I text..."
                    rows={2}
                    className="w-full bg-[#0d0e12] border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 font-mono leading-relaxed focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Statement II:
                  </label>
                  <textarea
                    data-field="st2"
                    value={statement2}
                    onChange={(e) => setStatement2(e.target.value)}
                    placeholder="Enter Statement II text..."
                    rows={2}
                    className="w-full bg-[#0d0e12] border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 font-mono leading-relaxed focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            )}

            {/* TEMPLATE 4: ASSERTION & REASON */}
            {template === 'assertion_reason' && (
              <div className="space-y-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5">
                <input
                  type="text"
                  data-field="context"
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Optional context setup:"
                  className="w-full bg-[#0d0e12] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                />
                <div>
                  <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Assertion (A):
                  </label>
                  <textarea
                    data-field="st1"
                    value={statement1}
                    onChange={(e) => setStatement1(e.target.value)}
                    placeholder="Enter Assertion (A) statement..."
                    rows={2}
                    className="w-full bg-[#0d0e12] border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 font-mono leading-relaxed focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Reason (R):
                  </label>
                  <textarea
                    data-field="st2"
                    value={statement2}
                    onChange={(e) => setStatement2(e.target.value)}
                    placeholder="Enter Reason (R) statement..."
                    rows={2}
                    className="w-full bg-[#0d0e12] border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 font-mono leading-relaxed focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            )}

            {/* TEMPLATE 5: MATCH THE COLUMNS */}
            {template === 'match_column' && (
              <div className="space-y-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5">
                <input
                  type="text"
                  data-field="context"
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Instructions (e.g. Match Column-I with Column-II):"
                  className="w-full bg-[#0d0e12] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                />
                <div className="grid grid-cols-2 gap-3">
                  {/* Column 1 */}
                  <div className="space-y-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                    <input
                      type="text"
                      value={col1Name}
                      onChange={(e) => setCol1Name(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-amber-400 border-b border-zinc-800 pb-1 focus:outline-none"
                    />
                    {['A', 'B', 'C', 'D'].map((label, idx) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className="w-5 h-6 rounded bg-amber-500/20 text-amber-300 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                          {label}
                        </span>
                        <input
                          type="text"
                          value={col1Items[idx]}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCol1Items(prev => {
                              const copy = [...prev];
                              copy[idx] = val;
                              return copy;
                            });
                          }}
                          placeholder={`Item (${label}) description...`}
                          className="w-full bg-[#0d0e12] border border-zinc-800/80 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                    <input
                      type="text"
                      value={col2Name}
                      onChange={(e) => setCol2Name(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-blue-400 border-b border-zinc-800 pb-1 focus:outline-none"
                    />
                    {['P', 'Q', 'R', 'S'].map((label, idx) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className="w-5 h-6 rounded bg-blue-500/20 text-blue-300 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                          {label}
                        </span>
                        <input
                          type="text"
                          value={col2Items[idx]}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCol2Items(prev => {
                              const copy = [...prev];
                              copy[idx] = val;
                              return copy;
                            });
                          }}
                          placeholder={`Item (${label}) description...`}
                          className="w-full bg-[#0d0e12] border border-zinc-800/80 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-blue-400 font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DIAGRAM IMAGE URL */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Image size={13} /> Main Question Diagram (Optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste Google Drive share link or direct Image URL..."
                className="w-full bg-[#0d0e12] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 font-mono"
              />
              {imageUrl && formatImageUrl(imageUrl) && (
                <div className="p-2 bg-black/40 rounded-xl border border-zinc-800 text-center">
                  <img
                    src={formatImageUrl(imageUrl)}
                    alt="Diagram Preview"
                    className="max-h-36 mx-auto object-contain rounded"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            {/* ANSWER OPTIONS & 1-CLICK PRE-FILL */}
            <div className="space-y-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Answer Options & Correct Key
                </label>
                
                {/* 1-Click Pre-Fill Button */}
                {template === 'multi_statement' ? (
                  <button
                    type="button"
                    onClick={handlePreFillMultiStatementOptions}
                    className="px-2.5 py-1 bg-amber-400/10 hover:bg-amber-400 hover:text-black text-amber-400 border border-amber-400/30 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                  >
                    ⚡ Pre-Fill Standard 4 Options
                  </button>
                ) : template === 'statement' ? (
                  <button
                    type="button"
                    onClick={handlePreFillStatementOptions}
                    className="px-2.5 py-1 bg-amber-400/10 hover:bg-amber-400 hover:text-black text-amber-400 border border-amber-400/30 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                  >
                    ⚡ Pre-Fill Standard 4 Options
                  </button>
                ) : template === 'assertion_reason' ? (
                  <button
                    type="button"
                    onClick={handlePreFillAssertionOptions}
                    className="px-2.5 py-1 bg-amber-400/10 hover:bg-amber-400 hover:text-black text-amber-400 border border-amber-400/30 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                  >
                    ⚡ Pre-Fill Standard 4 Options
                  </button>
                ) : template === 'match_column' ? (
                  <button
                    type="button"
                    onClick={handlePreFillMatchOptions}
                    className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                  >
                    ⚡ Pre-Fill Match Options
                  </button>
                ) : null}
              </div>

              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map((optKey, idx) => {
                  const isCorrect = correctAnswer === optKey;
                  const isImgMode = showOptionImage[idx];

                  return (
                    <div
                      key={optKey}
                      className={`p-2.5 rounded-xl border transition ${
                        isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs'
                          : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {/* 1-Click Key Button */}
                        <button
                          type="button"
                          onClick={() => setCorrectAnswer(optKey)}
                          className={`w-7 h-7 rounded-full text-xs font-bold shrink-0 flex items-center justify-center transition cursor-pointer ${
                            isCorrect
                              ? 'bg-emerald-400 text-black shadow-md'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                          }`}
                          title={`Click to set Option ${optKey} as Correct Answer`}
                        >
                          {optKey}
                        </button>

                        {/* Text / Image input */}
                        {isImgMode ? (
                          <input
                            type="url"
                            value={optionImages[idx]}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOptionImages(prev => {
                                const copy = [...prev];
                                copy[idx] = val;
                                return copy;
                              });
                            }}
                            placeholder={`Option ${optKey} diagram URL...`}
                            className="flex-1 bg-[#0d0e12] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 font-mono"
                          />
                        ) : (
                          <input
                            type="text"
                            data-field={`opt_${idx}`}
                            value={options[idx]}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOptions(prev => {
                                const copy = [...prev];
                                copy[idx] = val;
                                return copy;
                              });
                            }}
                            placeholder={`Option ${optKey} text (supports $LaTeX$)...`}
                            className="flex-1 bg-[#0d0e12] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 font-mono"
                          />
                        )}

                        {/* Image toggle */}
                        <button
                          type="button"
                          onClick={() => setShowOptionImage(prev => ({ ...prev, [idx]: !prev[idx] }))}
                          className={`p-1.5 rounded-lg border text-[10px] font-bold transition flex items-center gap-1 ${
                            isImgMode
                              ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                              : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                          }`}
                          title="Toggle Image Mode"
                        >
                          <Image size={12} /> {isImgMode ? 'Text' : '+ Img'}
                        </button>

                        {/* Correct Key indicator */}
                        {isCorrect && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-400/30">
                            KEY
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SOLUTION & EXPLANATION (Optional) */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3 space-y-2">
              <button
                type="button"
                onClick={() => setShowSolutionSection(prev => !prev)}
                className="w-full flex items-center justify-between text-xs font-bold text-zinc-400 hover:text-white"
              >
                <span>+ Master Solution & Explanation (Optional)</span>
                <ChevronDown size={14} className={showSolutionSection ? 'rotate-180 transition' : 'transition'} />
              </button>

              {showSolutionSection && (
                <textarea
                  data-field="solution"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="Provide step-by-step solution derivation (supports KaTeX $math$)..."
                  rows={3}
                  className="w-full bg-[#0d0e12] border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 font-mono leading-relaxed focus:outline-none focus:border-amber-400"
                />
              )}
            </div>

          </div>

          {/* RIGHT: Live Student CBT View (5 Cols) */}
          <div className="lg:col-span-5 bg-[#0e0f13] flex flex-col h-full overflow-y-auto p-4 sm:p-5 border-t lg:border-t-0 border-zinc-800">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Eye size={14} /> Live Student CBT View
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md text-zinc-400">
                <span>+4</span>
                <span>|</span>
                <span className="text-red-400">-1</span>
              </div>
            </div>

            {/* Rendered Student Question Card */}
            <div className="flex-1 py-4 space-y-4">
              
              {/* Question Text with Math & Statement formatting */}
              <div className="text-sm text-zinc-100 font-medium leading-relaxed">
                {computedQuestionText ? (
                  <MathRenderer text={computedQuestionText} />
                ) : (
                  <span className="text-zinc-600 italic">Start typing question text to preview live rendering...</span>
                )}
              </div>

              {/* Main Diagram */}
              {imageUrl && formatImageUrl(imageUrl) && (
                <div className="my-3 p-2 bg-black/40 rounded-xl border border-zinc-800 text-center">
                  <img
                    src={formatImageUrl(imageUrl)}
                    alt="Diagram"
                    className="max-h-52 mx-auto object-contain rounded-lg shadow"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Rendered Options */}
              <div className="space-y-2.5 pt-2">
                {['A', 'B', 'C', 'D'].map((optKey, idx) => {
                  const isCorrect = correctAnswer === optKey;
                  const isImg = showOptionImage[idx];
                  const optVal = isImg ? optionImages[idx] : options[idx];

                  return (
                    <div
                      key={optKey}
                      className={`p-3 rounded-xl border flex items-center justify-between transition ${
                        isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-100'
                          : 'bg-[#13141a] border-zinc-800/90 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`w-6 h-6 rounded-full text-xs font-bold shrink-0 flex items-center justify-center ${
                          isCorrect
                            ? 'bg-emerald-400 text-black font-black'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {optKey}
                        </span>

                        <div className="text-xs leading-relaxed flex-1 min-w-0">
                          {isImg && optVal ? (
                            <img
                              src={formatImageUrl(optVal)}
                              alt={`Option ${optKey}`}
                              className="max-h-24 object-contain rounded border border-zinc-700 bg-black/30 p-1"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : optVal ? (
                            <MathRenderer text={optVal} />
                          ) : (
                            <span className="text-zinc-600 italic">Option {optKey} content</span>
                          )}
                        </div>
                      </div>

                      {isCorrect && (
                        <span className="text-emerald-400 ml-2 shrink-0">
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Solution Preview */}
              {solution && (
                <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Solution Explanation:</div>
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    <MathRenderer text={solution} />
                  </div>
                </div>
              )}
            </div>

            {/* Student Preview Footer Metadata */}
            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>Template: <strong className="text-zinc-300">{template}</strong></span>
              <span>Key: <strong className="text-emerald-400">{correctAnswer}</strong></span>
              <span>Subject: <strong className="text-amber-400">{section}</strong></span>
            </div>
          </div>

        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="px-5 py-3 bg-[#17181f] border-t border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {errorMsg && (
              <div className="text-xs text-red-400 flex items-center gap-1.5 font-medium">
                <AlertCircle size={14} className="shrink-0" /> {errorMsg}
              </div>
            )}
            {!errorMsg && (
              <div className="text-[11px] text-zinc-500 hidden sm:block">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 font-mono">Cmd + Enter</kbd> to save question
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-neutral-950 font-black rounded-xl text-xs shadow-lg flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save size={14} /> Save to Question Bank
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
