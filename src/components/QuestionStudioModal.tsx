import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Image as ImageIcon, Save, CheckCircle2, AlertCircle,
  Eye, Zap, Camera, Link2, Trash2, Layers, HelpCircle,
  Check, ChevronDown, ChevronUp, Sparkles, BookOpen, Columns
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

function formatImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return 'https://lh3.googleusercontent.com/d/' + driveMatch[1];
  }
  return trimmed;
}

export interface QuestionData {
  id?: string;
  test_id?: string | null;
  section: string;
  question_number?: number;
  question_text: string;
  type?: 'MCQ' | 'MSQ' | 'Numerical';
  options: string[];
  correct_answer: string;
  image_url?: string;
  marks_positive?: number;
  marks_negative?: number;
  solution_explanation?: string;
  topic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  exam_type?: string;
}

interface QuestionStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: QuestionData) => Promise<void>;
  initialData?: QuestionData | null;
  defaultTestId?: string | null;
  defaultSection?: string;
}

const COMPACT_MATH_SNIPPETS = [
  { label: '√x', tex: '\\sqrt{x}' },
  { label: 'a/b', tex: '\\frac{a}{b}' },
  { label: 'x²', tex: 'x^{2}' },
  { label: 'x₁', tex: 'x_{1}' },
  { label: '10⁻⁵', tex: '10^{-5}' },
  { label: '∫', tex: '\\int ' },
  { label: 'v⃗', tex: '\\vec{v}' },
  { label: '→', tex: '\\rightarrow' },
  { label: '⇌', tex: '\\rightleftharpoons' },
  { label: 'Δ', tex: '\\Delta' },
  { label: 'θ', tex: '\\theta' },
  { label: 'π', tex: '\\pi' },
  { label: '±', tex: '\\pm' },
  { label: '∞', tex: '\\infty' },
  { label: '∑', tex: '\\sum_{i=1}^{n}' },
];

type QuestionTemplate = 'standard' | 'statement' | 'assertion_reason' | 'match_column';

function autoFormatMathTextClient(raw: string): string {
  if (!raw) return '';
  let str = raw;

  const superMap: Record<string, string> = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-' };
  const subMap: Record<string, string> = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','₊':'+','₋':'-' };
  str = str.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, (m) => '^{' + [...m].map(c => superMap[c] || c).join('') + '}');
  str = str.replace(/[₀₁₂₃₄₅₆₇₈₉₊₋]+/g, (m) => '_{' + [...m].map(c => subMap[c] || c).join('') + '}');

  str = str
    .replace(/(?:\\u221A|√)\s*\((.*?)\)/g, ' $\\sqrt{$1}$ ')
    .replace(/(?:\\u221A|√)\s*([a-zA-Z0-9]+)/g, ' $\\sqrt{$1}$ ')
    .replace(/\b(?:sqrt|root)\s*\((.*?)\)/gi, ' $\\sqrt{$1}$ ')
    .replace(/\b(?:sqrt|root)\s*([a-zA-Z0-9]+)\b/gi, ' $\\sqrt{$1}$ ')
    .replace(/[√\\u221A]/g, ' \\sqrt ');

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
  const [section, setSection] = useState(defaultSection);
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

  const computedQuestionText = React.useMemo(() => {
    if (template === 'statement') {
      const parts: string[] = [];
      if (contextText.trim()) parts.push(contextText.trim());
      if (statement1.trim()) parts.push('Statement I: ' + statement1.trim());
      if (statement2.trim()) parts.push('Statement II: ' + statement2.trim());
      return parts.join('\n\n');
    } else if (template === 'assertion_reason') {
      const parts: string[] = [];
      if (contextText.trim()) parts.push(contextText.trim());
      if (statement1.trim()) parts.push('Assertion (A): ' + statement1.trim());
      if (statement2.trim()) parts.push('Reason (R): ' + statement2.trim());
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
      return parts.join('\n\n');
    }
    return rawQuestionText;
  }, [template, contextText, statement1, statement2, rawQuestionText, col1Name, col2Name, col1Items, col2Items]);

  useEffect(() => {
    if (initialData) {
      setSection(initialData.section || defaultSection);
      setDifficulty(initialData.difficulty || 'Medium');
      setExamType(initialData.exam_type || 'IAT');
      setTopic(initialData.topic || '');
      setQType(initialData.type || 'MCQ');
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

      const rawOpts = Array.isArray(initialData.options) && initialData.options.length === 4
        ? initialData.options
        : ['', '', '', ''];
      
      const parsedTexts: string[] = [];
      const parsedImgs: string[] = [];
      const openImgs: Record<number, boolean> = {};

      rawOpts.forEach((optStr, i) => {
        const strVal = typeof optStr === 'string'
          ? optStr
          : (typeof optStr === 'object' && optStr !== null ? ((optStr as any).text || JSON.stringify(optStr)) : String(optStr || ''));
        const mdImgMatch = strVal.match(/!\[.*?\]\((https?:\/\/.*?)\)/);
        const bareImgMatch = strVal.match(/^(https?:\/\/[^\s]+)$/);
        
        if (mdImgMatch) {
          parsedImgs.push(mdImgMatch[1]);
          parsedTexts.push(strVal.replace(mdImgMatch[0], '').trim());
          openImgs[i] = true;
        } else if (bareImgMatch) {
          parsedImgs.push(bareImgMatch[1]);
          parsedTexts.push('');
          openImgs[i] = true;
        } else {
          parsedImgs.push('');
          parsedTexts.push(strVal);
        }
      });

      setOptions(parsedTexts);
      setOptionImages(parsedImgs);
      setShowOptionImage(openImgs);
    } else {
      setSection(defaultSection);
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
      setCol1Name('Column-I');
      setCol2Name('Column-II');
      setCol1Items(['', '', '', '']);
      setCol2Items(['', '', '', '']);
      setRawQuestionText('');
      setImageUrl('');
      setOptions(['', '', '', '']);
      setOptionImages(['', '', '', '']);
      setShowOptionImage({});
      setCorrectAnswer('A');
      setSolution('');
      setShowSolutionSection(false);
    }
    setErrorMsg(null);
  }, [initialData, defaultSection, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveForm();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, computedQuestionText, options, optionImages, correctAnswer, section, difficulty, examType]);

  if (!isOpen) return null;

  const handleInsertSnippet = (snippet: string) => {
    if (template === 'statement' || template === 'assertion_reason' || template === 'match_column') {
      setContextText(prev => prev + ' $' + snippet + '$ ');
    } else {
      setRawQuestionText(prev => prev + ' $' + snippet + '$ ');
    }
  };

  const handlePreFillStatementOptions = () => {
    if (template === 'assertion_reason') {
      setOptions([
        'Both (A) and (R) are true, and (R) is the correct explanation of (A).',
        'Both (A) and (R) are true, but (R) is NOT the correct explanation of (A).',
        '(A) is true, but (R) is false.',
        '(A) is false, but (R) is true.'
      ]);
    } else if (template === 'match_column') {
      setOptions([
        'A → P, B → Q, C → R, D → S',
        'A → Q, B → P, C → S, D → R',
        'A → R, B → S, C → P, D → Q',
        'A → S, B → R, C → Q, D → P'
      ]);
    } else {
      setOptions([
        'Both Statement I and Statement II are correct.',
        'Both Statement I and Statement II are incorrect.',
        'Statement I is correct but Statement II is incorrect.',
        'Statement I is incorrect but Statement II is correct.'
      ]);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleOptionImageChange = (idx: number, val: string) => {
    const updated = [...optionImages];
    updated[idx] = val;
    setOptionImages(updated);
  };

  const toggleOptionImageInput = (idx: number) => {
    setShowOptionImage(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSaveForm = async () => {
    const finalText = computedQuestionText.trim();
    if (!finalText) {
      setErrorMsg('Please enter question text or table items.');
      return;
    }

    const finalOptions = options.map((optText, i) => {
      const img = optionImages[i]?.trim();
      const text = optText.trim();
      if (img && text) {
        return text + ' ![Option ' + ['A', 'B', 'C', 'D'][i] + '](' + img + ')';
      } else if (img) {
        return img;
      }
      return text;
    });

    if (qType === 'MCQ') {
      const hasEmpty = finalOptions.some(opt => !opt.trim());
      if (hasEmpty) {
        setErrorMsg('Please fill in all 4 options (or attach diagram images).');
        return;
      }
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await onSave({
        id: initialData?.id,
        test_id: initialData?.test_id || defaultTestId || null,
        section,
        question_number: initialData?.question_number,
        question_text: finalText,
        type: qType,
        options: finalOptions,
        correct_answer: correctAnswer,
        image_url: imageUrl.trim() || undefined,
        marks_positive: marksPositive,
        marks_negative: marksNegative,
        solution_explanation: solution.trim() || undefined,
        topic: topic.trim() || undefined,
        difficulty,
        exam_type: examType
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-[1440px] h-[92vh] max-h-[940px] bg-[#0e0f12] border border-zinc-800/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* ================= TOP COMPACT HEADER ================= */}
        <div className="h-14 px-5 border-b border-zinc-800/80 bg-[#14151a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-2">
                {initialData?.id ? 'Edit Question' : 'Question Authoring Studio'}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Production Minimal
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#1c1d24] border border-zinc-800 rounded-lg p-0.5 text-xs font-semibold">
              {(['Physics', 'Chemistry', 'Mathematics', 'Biology'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSection(s)}
                  className={'px-2.5 py-1 rounded-md text-[11px] transition ' + (
                    section === s
                      ? 'bg-amber-400 text-black font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  {s.slice(0, 4)}
                </button>
              ))}
            </div>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="bg-[#1c1d24] border border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="Easy">🟢 Easy</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Hard">🔴 Hard</option>
            </select>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition ml-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ================= MAIN SPLIT CANVAS ================= */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT PANE: Authoring Studio (7 Columns) */}
          <div className="lg:col-span-7 h-full min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#0e0f12] border-r border-zinc-800/80">
            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. QUESTION TEMPLATE SELECTOR */}
            <div className="flex items-center justify-between p-1 bg-[#14151a] border border-zinc-800 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 flex items-center gap-1.5">
                <Layers size={13} className="text-amber-400" /> Format:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { id: 'standard', label: 'Standard MCQ' },
                  { id: 'statement', label: 'Statement I & II' },
                  { id: 'assertion_reason', label: 'Assertion & Reason' },
                  { id: 'match_column', label: 'Match Columns (Matrix)' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id as QuestionTemplate)}
                    className={'px-3 py-1 rounded-lg text-xs font-semibold transition shrink-0 ' + (
                      template === t.id
                        ? 'bg-zinc-800 text-amber-300 font-bold border border-amber-500/30 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. QUESTION STATEMENT CARD */}
            <div className="bg-[#14151a] border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={13} className="text-amber-400" />
                  {template === 'match_column' ? 'Match the Columns Matrix' : template === 'statement' ? 'Context & Statements' : template === 'assertion_reason' ? 'Assertion & Reason' : 'Question Statement'}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (template === 'statement' || template === 'assertion_reason' || template === 'match_column') {
                        setContextText(autoFormatMathTextClient(contextText));
                        setStatement1(autoFormatMathTextClient(statement1));
                        setStatement2(autoFormatMathTextClient(statement2));
                        setCol1Items(prev => prev.map(o => autoFormatMathTextClient(o)));
                        setCol2Items(prev => prev.map(o => autoFormatMathTextClient(o)));
                      } else {
                        setRawQuestionText(autoFormatMathTextClient(rawQuestionText));
                      }
                      setOptions(prev => prev.map(o => autoFormatMathTextClient(o)));
                    }}
                    className="px-2.5 py-0.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-md text-[10px] font-bold font-mono transition flex items-center gap-1"
                    title="Auto-detect & wrap formulas into KaTeX"
                  >
                    <Zap size={11} /> ⚡ Auto-Format Math
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMathBar(!showMathBar)}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-0.5"
                  >
                    Math Keys {showMathBar ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>

              {showMathBar && (
                <div className="flex flex-wrap gap-1 p-1.5 bg-[#1c1d24] border border-zinc-800 rounded-lg">
                  {COMPACT_MATH_SNIPPETS.map(snip => (
                    <button
                      key={snip.label}
                      type="button"
                      onClick={() => handleInsertSnippet(snip.tex)}
                      className="px-2 py-0.5 bg-[#252630] hover:bg-zinc-700 text-zinc-300 hover:text-amber-300 rounded text-[11px] font-mono border border-zinc-700/60 transition"
                    >
                      {snip.label}
                    </button>
                  ))}
                </div>
              )}

              {/* TEMPLATE: STANDARD MCQ */}
              {template === 'standard' && (
                <textarea
                  value={rawQuestionText}
                  onChange={(e) => setRawQuestionText(e.target.value)}
                  rows={4}
                  placeholder="Type question statement here. Press Enter to create natural paragraph breaks. E.g. What is the value of $\\int_{0}^{\\pi} \\sin(x) dx$?"
                  className="w-full bg-[#1b1c22] border border-zinc-800 rounded-lg p-3 text-xs text-white font-mono leading-relaxed placeholder-zinc-600 focus:outline-none focus:border-amber-400 resize-y"
                />
              )}

              {/* TEMPLATE: STATEMENT I & II */}
              {template === 'statement' && (
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 block mb-1">Introductory Setup / Context (Optional):</span>
                    <textarea
                      value={contextText}
                      onChange={(e) => setContextText(e.target.value)}
                      rows={2}
                      placeholder="e.g. Consider a setup on a smooth horizontal floor where three blocks are connected..."
                      className="w-full bg-[#1b1c22] border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono leading-relaxed placeholder-zinc-600 focus:outline-none focus:border-amber-400 resize-y"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 block mb-1">Statement I:</span>
                    <input
                      type="text"
                      value={statement1}
                      onChange={(e) => setStatement1(e.target.value)}
                      placeholder="e.g. If block A is pulled by force F, the acceleration is 4 m/s²."
                      className="w-full bg-[#1b1c22] border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 block mb-1">Statement II:</span>
                    <input
                      type="text"
                      value={statement2}
                      onChange={(e) => setStatement2(e.target.value)}
                      placeholder="e.g. The magnitude of the tension T1 in the string is 16 N."
                      className="w-full bg-[#1b1c22] border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* TEMPLATE: ASSERTION & REASON */}
              {template === 'assertion_reason' && (
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 block mb-1">Context / Background (Optional):</span>
                    <textarea
                      value={contextText}
                      onChange={(e) => setContextText(e.target.value)}
                      rows={2}
                      placeholder="Optional introductory background..."
                      className="w-full bg-[#1b1c22] border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-400 resize-y"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 block mb-1">Assertion (A):</span>
                    <input
                      type="text"
                      value={statement1}
                      onChange={(e) => setStatement1(e.target.value)}
                      placeholder="Type the Assertion statement..."
                      className="w-full bg-[#1b1c22] border border-emerald-500/30 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 block mb-1">Reason (R):</span>
                    <input
                      type="text"
                      value={statement2}
                      onChange={(e) => setStatement2(e.target.value)}
                      placeholder="Type the Reason statement..."
                      className="w-full bg-[#1b1c22] border border-blue-500/30 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              )}

              {/* TEMPLATE: MATCH THE COLUMNS (MATRIX MATCH) */}
              {template === 'match_column' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 block mb-1">Instructions / Setup (e.g. Match Column-I with Column-II):</span>
                    <textarea
                      value={contextText}
                      onChange={(e) => setContextText(e.target.value)}
                      rows={2}
                      placeholder="e.g. Match the physical situations described in Column-I with their properties in Column-II:"
                      className="w-full bg-[#1b1c22] border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono leading-relaxed placeholder-zinc-600 focus:outline-none focus:border-amber-400 resize-y"
                    />
                  </div>

                  {/* Dual Column Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Column I */}
                    <div className="space-y-2 bg-[#171820] border border-zinc-800 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <Columns size={12} className="text-amber-400" />
                        <input
                          type="text"
                          value={col1Name}
                          onChange={(e) => setCol1Name(e.target.value)}
                          placeholder="Column-I"
                          className="bg-transparent border-b border-zinc-700 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-400 py-0.5 w-28"
                        />
                      </div>
                      {['A', 'B', 'C', 'D'].map((lbl, i) => (
                        <div key={lbl} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-zinc-800 text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {lbl}
                          </span>
                          <input
                            type="text"
                            value={col1Items[i]}
                            onChange={(e) => {
                              const updated = [...col1Items];
                              updated[i] = e.target.value;
                              setCol1Items(updated);
                            }}
                            placeholder={'Item (' + lbl + ') description...'}
                            className="flex-1 bg-[#121318] border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Column II */}
                    <div className="space-y-2 bg-[#171820] border border-zinc-800 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <Columns size={12} className="text-blue-400" />
                        <input
                          type="text"
                          value={col2Name}
                          onChange={(e) => setCol2Name(e.target.value)}
                          placeholder="Column-II"
                          className="bg-transparent border-b border-zinc-700 text-xs font-bold text-blue-400 focus:outline-none focus:border-blue-400 py-0.5 w-28"
                        />
                      </div>
                      {['P', 'Q', 'R', 'S'].map((lbl, i) => (
                        <div key={lbl} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-zinc-800 text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {lbl}
                          </span>
                          <input
                            type="text"
                            value={col2Items[i]}
                            onChange={(e) => {
                              const updated = [...col2Items];
                              updated[i] = e.target.value;
                              setCol2Items(updated);
                            }}
                            placeholder={'Item (' + lbl + ') description...'}
                            className="flex-1 bg-[#121318] border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. MAIN DIAGRAM UPLOADER */}
            <div className="bg-[#14151a] border border-zinc-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-amber-400" />
                  Main Question Diagram (Optional)
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Link2 size={13} />
                  </span>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste Google Drive share link or Image URL..."
                    className="w-full bg-[#1b1c22] border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {imageUrl && (
                <div className="p-2 bg-black/40 border border-zinc-800 rounded-lg flex items-center gap-3">
                  <img
                    src={formatImageUrl(imageUrl)}
                    alt="Diagram Thumbnail"
                    className="h-12 w-20 object-contain rounded bg-white/5 border border-zinc-700"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <div className="text-[11px] text-zinc-400 truncate">
                    <span className="text-emerald-400 font-bold block">✓ Diagram Attached</span>
                    Renders centered between question setup and statements
                  </div>
                </div>
              )}
            </div>

            {/* 4. ANSWER OPTIONS */}
            <div className="bg-[#14151a] border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  Answer Options &amp; Correct Key
                </label>
                
                {(template === 'statement' || template === 'assertion_reason' || template === 'match_column') && (
                  <button
                    type="button"
                    onClick={handlePreFillStatementOptions}
                    className="px-2.5 py-0.5 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/40 rounded text-[10px] font-bold transition"
                  >
                    ⚡ Pre-Fill Standard 4 Options
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map((label, idx) => {
                  const isCorrect = correctAnswer === label;
                  const hasImg = !!optionImages[idx];
                  const isImgInputOpen = showOptionImage[idx] || hasImg;

                  return (
                    <div
                      key={label}
                      className={'p-2.5 rounded-xl border transition ' + (
                        isCorrect
                          ? 'border-emerald-500/80 bg-emerald-950/20 shadow-sm shadow-emerald-500/10'
                          : 'border-zinc-800/80 bg-[#1b1c22]'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setCorrectAnswer(label)}
                          className={'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition ' + (
                            isCorrect
                              ? 'bg-emerald-500 text-black font-extrabold shadow-md'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                          )}
                          title={'Click to mark Option ' + label + ' as correct'}
                        >
                          {label}
                        </button>

                        <input
                          type="text"
                          value={options[idx]}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={'Option ' + label + ' text (e.g. A → P, B → Q, C → R, D → S)...'}
                          className="flex-1 bg-transparent border-none text-xs text-white font-mono placeholder-zinc-600 focus:outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => toggleOptionImageInput(idx)}
                          className={'px-2 py-1 rounded-md text-[10px] font-semibold border flex items-center gap-1 transition shrink-0 ' + (
                            hasImg
                              ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                              : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-white'
                          )}
                        >
                          <Camera size={11} /> {hasImg ? 'Img Attached' : '+ Img'}
                        </button>

                        {isCorrect && (
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 shrink-0">
                            Key
                          </span>
                        )}
                      </div>

                      {isImgInputOpen && (
                        <div className="flex items-center gap-2 pl-8 pt-2 mt-2 border-t border-zinc-800">
                          <Link2 size={12} className="text-zinc-500 shrink-0" />
                          <input
                            type="text"
                            value={optionImages[idx]}
                            onChange={(e) => handleOptionImageChange(idx, e.target.value)}
                            placeholder="Paste Google Drive / image link for this option..."
                            className="flex-1 bg-black/40 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-300 font-mono focus:outline-none focus:border-amber-400"
                          />
                          {hasImg && (
                            <button
                              type="button"
                              onClick={() => handleOptionImageChange(idx, '')}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. SOLUTION & DERIVATION */}
            <div className="bg-[#14151a] border border-zinc-800 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSolutionSection(!showSolutionSection)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-800/40 transition"
              >
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle size={13} />
                  Step-by-Step Solution &amp; Explanation (Optional)
                </span>
                <span className="text-xs text-zinc-400">
                  {showSolutionSection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>

              {showSolutionSection && (
                <div className="p-4 pt-0 space-y-2 border-t border-zinc-800/80 mt-1">
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSolution(prev => prev + '\n\n**Step 1:** ')}
                      className="px-2 py-0.5 bg-blue-950/40 text-blue-300 border border-blue-800/40 rounded text-[10px] font-mono"
                    >
                      + Step
                    </button>
                    <button
                      type="button"
                      onClick={() => setSolution(autoFormatMathTextClient(solution))}
                      className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold"
                    >
                      ⚡ Format Math
                    </button>
                  </div>
                  <textarea
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    rows={4}
                    placeholder="Explain the step-by-step mathematical derivation so students learn from their mistakes..."
                    className="w-full bg-[#1b1c22] border border-zinc-800 rounded-lg p-3 text-xs text-white font-mono leading-relaxed placeholder-zinc-600 focus:outline-none focus:border-blue-400 resize-y"
                  />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: Live Student CBT Screen Simulator (5 Columns) */}
          <div className="lg:col-span-5 h-full min-h-0 overflow-y-auto p-4 sm:p-6 bg-[#090a0d] flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={14} /> Live Student CBT View
                </span>
                <span className="px-2 py-0.5 bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-300">
                  +{marksPositive} | -{marksNegative}
                </span>
              </div>

              {/* Rendered Question Card */}
              <div className="p-4 bg-[#121318] border border-zinc-800 rounded-xl text-zinc-100 text-xs sm:text-sm leading-relaxed space-y-3 min-h-[120px]">
                {computedQuestionText ? (
                  <MathRenderer text={computedQuestionText} />
                ) : (
                  <span className="text-zinc-600 text-xs italic">
                    Question text will render live here in real-time KaTeX math...
                  </span>
                )}

                {/* Main Diagram */}
                {imageUrl && (
                  <div className="p-2 bg-white/5 rounded-lg border border-zinc-800 text-center">
                    <img
                      src={formatImageUrl(imageUrl)}
                      alt="Question Diagram"
                      className="max-h-48 mx-auto object-contain rounded"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              {/* Rendered Options */}
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map((label, idx) => {
                  const isCorrect = correctAnswer === label;
                  const optText = options[idx];
                  const optImg = optionImages[idx];

                  return (
                    <div
                      key={label}
                      className={'p-3 rounded-xl border text-xs flex items-start gap-3 transition ' + (
                        isCorrect
                          ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-100 shadow-sm'
                          : 'border-zinc-800 bg-[#121318] text-zinc-300'
                      )}
                    >
                      <span className={'w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ' + (
                        isCorrect ? 'bg-emerald-500 text-black font-extrabold' : 'bg-zinc-800 text-zinc-400'
                      )}>
                        {label}
                      </span>
                      <div className="flex-1 font-medium space-y-2">
                        {optText && <MathRenderer text={optText} />}
                        {optImg && (
                          <div className="p-1 bg-white/5 rounded border border-zinc-700/60 inline-block">
                            <img
                              src={formatImageUrl(optImg)}
                              alt={'Option ' + label + ' diagram'}
                              className="max-h-28 object-contain rounded"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          </div>
                        )}
                        {!optText && !optImg && (
                          <span className="text-zinc-600 italic">Option {label} content</span>
                        )}
                      </div>
                      {isCorrect && (
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0 ml-auto" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rendered Solution */}
              {solution && (
                <div className="p-3.5 bg-blue-950/20 border border-blue-800/30 rounded-xl text-blue-200 text-xs space-y-1">
                  <p className="font-bold text-blue-400 text-[10px] uppercase tracking-wider">Solution Explanation:</p>
                  <MathRenderer text={solution} />
                </div>
              )}
            </div>

            {/* Quality Pre-flight Checklist */}
            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Template: <strong className="text-zinc-300 capitalize">{template.replace('_', ' ')}</strong></span>
              <span>Key: <strong className="text-emerald-400 font-bold">{correctAnswer}</strong></span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check size={12} /> Ready
              </span>
            </div>
          </div>
        </div>

        {/* ================= FOOTER CONTROLS ================= */}
        <div className="h-16 px-6 border-t border-zinc-800/80 bg-[#14151a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 font-mono">
              Cmd + Enter
            </kbd>
            <span>to save question</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveForm}
              disabled={saving}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-400/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? 'Saving...' : initialData?.id ? 'Update Question' : 'Save to Question Bank'}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
