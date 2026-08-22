import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Image as ImageIcon, Save, CheckCircle2, AlertCircle,
  Eye, Zap, Camera, Link2, Trash2
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

function formatImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
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

const MATH_SNIPPETS = [
  { label: '√x (Square Root)', tex: '\\sqrt{x}' },
  { label: '√2 (Root 2)', tex: '\\sqrt{2}' },
  { label: 'a/b (Fraction)', tex: '\\frac{a}{b}' },
  { label: 'x² (Power)', tex: 'x^{2}' },
  { label: 'x₁ (Subscript)', tex: 'x_{1}' },
  { label: 'N₂²⁺ (Ion)', tex: 'N_2^{2+}' },
  { label: 'SO₄²⁻ (Ion)', tex: 'SO_4^{2-}' },
  { label: '10⁻⁵ (Exp)', tex: '10^{-5}' },
  { label: '×10⁸ (Sci)', tex: '\\times 10^{8}' },
  { label: '∫ (Integral)', tex: '\\int_{a}^{b} f(x) dx' },
  { label: 'v⃗ (Vector)', tex: '\\vec{v}' },
  { label: '⇌ (Equilibrium)', tex: '\\rightleftharpoons' },
  { label: '→ (Arrow)', tex: '\\rightarrow' },
  { label: 'Δ (Delta)', tex: '\\Delta' },
  { label: 'θ (Theta)', tex: '\\theta' },
  { label: 'λ (Lambda)', tex: '\\lambda' },
  { label: 'π (Pi)', tex: '\\pi' },
  { label: '± (Plus-Minus)', tex: '\\pm' },
  { label: '∞ (Infinity)', tex: '\\infty' },
  { label: '∑ (Sum)', tex: '\\sum_{i=1}^{n}' },
];

function autoFormatMathTextClient(raw: string): string {
  if (!raw) return '';
  let str = raw;

  // 1. Unicode superscripts & subscripts
  const superMap: Record<string, string> = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-' };
  const subMap: Record<string, string> = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','₊':'+','₋':'-' };
  str = str.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, (m) => `^{${[...m].map(c => superMap[c] || c).join('')}}`);
  str = str.replace(/[₀₁₂₃₄₅₆₇₈₉₊₋]+/g, (m) => `_{${[...m].map(c => subMap[c] || c).join('')}}`);

  // 2. Square roots & Radicals: √2, root 2, sqrt(2)
  str = str
    .replace(/(?:\\u221A|√)\s*\((.*?)\)/g, ' $\\sqrt{$1}$ ')
    .replace(/(?:\\u221A|√)\s*([a-zA-Z0-9]+)/g, ' $\\sqrt{$1}$ ')
    .replace(/\b(?:sqrt|root)\s*\((.*?)\)/gi, ' $\\sqrt{$1}$ ')
    .replace(/\b(?:sqrt|root)\s*([a-zA-Z0-9]+)\b/gi, ' $\\sqrt{$1}$ ')
    .replace(/[√\u221A]/g, ' \\sqrt ');

  // 3. Chemistry ions (token isolated): NH+ 4 -> $NH_4^+$, BH- 4 -> $BH_4^-$
  str = str.replace(/\b([A-Z][a-z]?H?)\s*([\+\-])\s*(\d+)\b/g, '$$$1_{$3}^{$2}$$');
  str = str.replace(/\b([A-Z][a-z]?H?)\s*(\d+)\s*\^?\s*(\d*)([\+\-])\b/g, '$$$1_{$2}^{$3$4}$$');
  str = str.replace(/\b([A-Z][a-z]?H?)\s*(\d+)([\+\-])\b/g, '$$$1_{$2}^{$3}$$');
  str = str.replace(/\[([A-Za-z0-9\(\)]+)\]\s*(\d+)?([\+\-])/g, '$$[$1]^{$2$3}$$');

  // Common chemical molecules: N2O, NO2, H2O, CO2, SO2, NH3, O3
  const chemTokens = /\b(N2O|NO2|NO3|H2O|CO2|SO2|SO3|SO4|NH3|NH4|BH4|H3O|CH4|C2H6|C6H6|C6H12O6|H2SO4|HNO3|HCl|NaOH|KOH|KMnO4|O3|O2|N2|H2|Cl2|Br2|I2|F2)\b/g;
  str = str.replace(chemTokens, (_m, token) => {
    const sub = token.replace(/([A-Za-z])(\d+)/g, '$1_{$2}');
    return `$${sub}$`;
  });

  // 4. Powers & Scientific: 3 x 10^8, 10^-5
  str = str
    .replace(/(\d+(?:\.\d+)?)\s*[xX\*×]\s*10\s*\^?\s*(-?\d+)/g, ' $$$1 \\times 10^{$2}$$ ')
    .replace(/\b10\s*\^\s*(-?\d+)/g, ' $$10^{$1}$$ ')
    .replace(/\b([a-zA-Z])\s*\^\s*([a-zA-Z0-9\-\+]+)\b/g, '$$$1^{$2}$$')
    .replace(/\b([a-zA-Z])\s*_\s*([a-zA-Z0-9\-\+]+)\b/g, '$$$1_{$2}$$');

  // 5. Fractions: 1/2, a/b
  str = str
    .replace(/\b(\d+)\s*\/\s*(\d+)\b/g, ' $\\frac{$1}{$2}$ ')
    .replace(/\b([a-zA-Z])\s*\/\s*([a-zA-Z0-9]+)\b/g, ' $\\frac{$1}{$2}$ ');

  // 6. Symbols
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
  const [questionText, setQuestionText] = useState('');
  const [qType, setQType] = useState<'MCQ' | 'MSQ' | 'Numerical'>('MCQ');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [optionImages, setOptionImages] = useState<string[]>(['', '', '', '']);
  const [showOptionImage, setShowOptionImage] = useState<Record<number, boolean>>({});
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [imageUrl, setImageUrl] = useState('');
  const [marksPositive, setMarksPositive] = useState(4);
  const [marksNegative, setMarksNegative] = useState(1);
  const [solution, setSolution] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [examType, setExamType] = useState('IAT');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setSection(initialData.section || defaultSection);
      setQuestionText(initialData.question_text || (initialData as any).text || '');
      setQType(initialData.type || 'MCQ');
      
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

      setCorrectAnswer(initialData.correct_answer || 'A');
      setImageUrl(initialData.image_url || '');
      setMarksPositive(initialData.marks_positive ?? 4);
      setMarksNegative(initialData.marks_negative ?? 1);
      setSolution(initialData.solution_explanation || '');
      setTopic(initialData.topic || '');
      setDifficulty(initialData.difficulty || 'Medium');
      setExamType(initialData.exam_type || 'IAT');
    } else {
      setSection(defaultSection);
      setQuestionText('');
      setQType('MCQ');
      setOptions(['', '', '', '']);
      setOptionImages(['', '', '', '']);
      setShowOptionImage({});
      setCorrectAnswer('A');
      setImageUrl('');
      setMarksPositive(4);
      setMarksNegative(1);
      setSolution('');
      setTopic('');
      setDifficulty('Medium');
      setExamType('IAT');
    }
    setErrorMsg(null);
  }, [initialData, defaultSection, isOpen]);

  if (!isOpen) return null;

  const insertSnippet = (snippet: string) => {
    setQuestionText(prev => prev + ` $${snippet}$ `);
  };

  const insertText = (text: string) => {
    setQuestionText(prev => prev + text);
  };

  const insertInlineDiagram = () => {
    const url = prompt('Paste Diagram Image Link (Google Drive link or Direct image URL):');
    if (url && url.trim()) {
      setQuestionText(prev => prev + `\n\n[img:${url.trim()}]\n\n`);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setErrorMsg('Please enter question text.');
      return;
    }

    // Build final combined options
    const finalOptions = options.map((optText, i) => {
      const img = optionImages[i]?.trim();
      const text = optText.trim();
      if (img && text) {
        return `${text} ![Option ${['A', 'B', 'C', 'D'][i]}](${img})`;
      } else if (img) {
        return img;
      }
      return text;
    });

    if (qType === 'MCQ') {
      const hasEmpty = finalOptions.some(opt => !opt.trim());
      if (hasEmpty) {
        setErrorMsg('Please provide text or an image for all 4 options.');
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
        question_text: questionText.trim(),
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 overflow-hidden">
      {/* Main Studio Card with Guaranteed Fit & Scrollable Columns */}
      <div className="bg-[#121215] text-zinc-100 border border-zinc-700/80 rounded-2xl w-full max-w-7xl h-[92vh] max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-fade-in font-sans relative z-10">
        
        {/* Studio Header (Fixed 60px) */}
        <div className="h-16 px-6 border-b border-zinc-800 flex items-center justify-between bg-[#18181c] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center font-bold">
              <Zap size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                  {initialData?.id ? 'Edit Question in Studio' : 'Question Authoring Studio'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/10 border border-amber-400/30 text-amber-400 uppercase tracking-wider">
                  Option Image & Math Enabled
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Live KaTeX math, question diagrams & option image support</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
            title="Close Studio"
          >
            <X size={20} />
          </button>
        </div>

        {/* Studio Split Workspace (min-h-0) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Authoring Form (7 cols) */}
          <div className="lg:col-span-7 h-full min-h-0 overflow-y-auto p-5 sm:p-6 border-r border-zinc-800 space-y-4 bg-[#121215]">
            {errorMsg && (
              <div className="p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400 shrink-0" /> {errorMsg}
              </div>
            )}

            {/* Metadata Bar (Subject, Difficulty, Exam Type, Marks) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#18181c] p-3.5 rounded-xl border border-zinc-800">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Subject</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full bg-[#202024] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-[#202024] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Easy">🟢 Easy</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Hard">🔴 Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Exam Type</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full bg-[#202024] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="IAT">IISER IAT</option>
                  <option value="NEST">NISER NEST</option>
                  <option value="JEE">JEE Main / Adv</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Marks (+ / -)</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    value={marksPositive}
                    onChange={(e) => setMarksPositive(Number(e.target.value))}
                    className="w-1/2 bg-[#202024] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs font-bold text-emerald-400 text-center focus:outline-none focus:border-amber-400"
                    placeholder="+4"
                  />
                  <input
                    type="number"
                    value={marksNegative}
                    onChange={(e) => setMarksNegative(Number(e.target.value))}
                    className="w-1/2 bg-[#202024] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs font-bold text-red-400 text-center focus:outline-none focus:border-amber-400"
                    placeholder="-1"
                  />
                </div>
              </div>
            </div>

            {/* Topic / Subtopic Tag */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Topic / Chapter Tag</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Wave Optics, Thermodynamics, Calculus, Genetics..."
                className="w-full bg-[#18181c] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Question Text Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Question Statement</label>
                <span className="text-[10px] text-amber-400 font-mono">Use $...$ for inline math, $$...$$ for display</span>
              </div>

              {/* Quick Math & Structure Snippet Bar */}
              <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-[#18181c] border border-zinc-800 rounded-t-xl overflow-x-auto">
                <div className="flex flex-wrap gap-1 items-center">
                  <button
                    type="button"
                    onClick={() => insertText('\n\n')}
                    className="px-2 py-1 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold font-mono transition"
                    title="Insert a paragraph gap / blank line"
                  >
                    ¶ Gap
                  </button>
                  <button
                    type="button"
                    onClick={() => insertText('\n\nStatement I: ')}
                    className="px-2 py-1 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border border-blue-500/40 rounded text-[10px] font-bold font-mono transition"
                  >
                    Statement I:
                  </button>
                  <button
                    type="button"
                    onClick={() => insertText('\n\nStatement II: ')}
                    className="px-2 py-1 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border border-blue-500/40 rounded text-[10px] font-bold font-mono transition"
                  >
                    Statement II:
                  </button>
                  <button
                    type="button"
                    onClick={insertInlineDiagram}
                    className="px-2 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold font-mono transition flex items-center gap-1"
                    title="Insert a diagram in the middle of question text"
                  >
                    <ImageIcon size={10} /> + Diagram Here
                  </button>

                  <span className="text-zinc-600 mx-1">|</span>

                  {MATH_SNIPPETS.map(snip => (
                    <button
                      key={snip.label}
                      type="button"
                      onClick={() => insertSnippet(snip.tex)}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-300 rounded text-[10px] font-mono border border-zinc-700 transition"
                    >
                      {snip.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (questionText) setQuestionText(autoFormatMathTextClient(questionText));
                    setOptions(prev => prev.map(o => autoFormatMathTextClient(o)));
                  }}
                  className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded text-[10px] font-bold font-mono transition flex items-center gap-1 shrink-0 ml-auto"
                  title="Auto-detect and wrap formulas, roots, chemical ions, and powers into KaTeX format"
                >
                  <Zap size={11} />
                  ⚡ Auto-Format Math &amp; Chem
                </button>
              </div>

              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={5}
                placeholder="Type question statement here. Press Enter for new lines / paragraphs. Use [img:DRIVE_URL] to place diagram in between paragraphs."
                className="w-full bg-[#151518] border border-zinc-800 border-t-0 rounded-b-xl p-3 text-xs text-white font-mono leading-relaxed placeholder-zinc-600 focus:outline-none focus:border-amber-400 resize-y"
              />
            </div>

            {/* Question Diagram Image URL */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Main Question Diagram (Google Drive / Direct URL)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <ImageIcon size={14} />
                  </span>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://lh3.googleusercontent.com/... or Google Drive share link"
                    className="w-full bg-[#18181c] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="px-3 py-1 bg-red-950/40 text-red-400 border border-red-500/20 text-xs font-bold rounded-xl hover:bg-red-900/40"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Options Builder with Diagram Image Support */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Options (Text &amp; Diagram Images)
                </label>
                <span className="text-[10px] text-emerald-400 font-semibold">Click circle to mark correct key</span>
              </div>

              {['A', 'B', 'C', 'D'].map((label, idx) => {
                const isCorrect = correctAnswer === label;
                const hasImg = !!optionImages[idx];
                const isImgInputOpen = showOptionImage[idx] || hasImg;

                return (
                  <div
                    key={label}
                    className={`p-3 rounded-xl border space-y-2 transition ${
                      isCorrect
                        ? 'border-emerald-500/60 bg-emerald-950/20'
                        : 'border-zinc-800 bg-[#18181c]'
                    }`}
                  >
                    {/* Option Text Input Row */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCorrectAnswer(label)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition ${
                          isCorrect
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                        title={`Mark option ${label} as correct answer`}
                      >
                        {label}
                      </button>

                      <input
                        type="text"
                        value={options[idx] || ''}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${label} text (optional if image used)...`}
                        className="flex-1 bg-[#151518] border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-mono"
                      />

                      {/* Add Image Button for this Option */}
                      <button
                        type="button"
                        onClick={() => toggleOptionImageInput(idx)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
                          hasImg
                            ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                        title={`Attach diagram image to Option ${label}`}
                      >
                        <Camera size={13} /> {hasImg ? 'Edit Img' : '+ Add Image'}
                      </button>
                    </div>

                    {/* Option Image Link Section */}
                    {isImgInputOpen && (
                      <div className="flex items-center gap-2 pl-10 pr-2 pt-1 border-t border-zinc-800/80">
                        <Link2 size={13} className="text-zinc-500 shrink-0" />
                        <input
                          type="text"
                          value={optionImages[idx] || ''}
                          onChange={(e) => handleOptionImageChange(idx, e.target.value)}
                          placeholder="Option diagram URL (Google Drive / Direct link)..."
                          className="flex-1 bg-[#151518] border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                        />
                        {hasImg && (
                          <button
                            type="button"
                            onClick={() => handleOptionImageChange(idx, '')}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Remove image"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Solution / Explanation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  Step-by-Step Solution Explanation (Optional)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSolution(prev => prev + '\n\n')}
                    className="px-2 py-0.5 bg-blue-950/50 hover:bg-blue-900/50 text-blue-300 border border-blue-800/40 rounded text-[10px] font-mono transition"
                    title="Insert line break"
                  >
                    ¶ Line Break
                  </button>
                  <button
                    type="button"
                    onClick={() => setSolution(prev => prev + '\n\n**Step 1:** ')}
                    className="px-2 py-0.5 bg-blue-950/50 hover:bg-blue-900/50 text-blue-300 border border-blue-800/40 rounded text-[10px] font-mono transition"
                  >
                    Step 1
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (solution) setSolution(autoFormatMathTextClient(solution));
                    }}
                    className="px-2 py-0.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded text-[10px] font-bold font-mono transition"
                    title="Auto-detect formulas in explanation"
                  >
                    ⚡ Format Math
                  </button>
                </div>
              </div>
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                rows={4}
                placeholder="Explain the derivation / formula so students can learn from mistakes... Press Enter to create new steps/paragraphs."
                className="w-full bg-[#18181c] border border-zinc-800 rounded-xl p-3 text-xs text-white font-mono leading-relaxed placeholder-zinc-600 focus:outline-none focus:border-amber-400 resize-y"
              />
            </div>
          </div>

          {/* Right Column: Live Student CBT Screen Simulator (5 cols) */}
          <div className="lg:col-span-5 h-full min-h-0 overflow-y-auto p-5 sm:p-6 bg-[#0c0c0e] flex flex-col justify-between border-t lg:border-t-0 border-zinc-800 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={14} /> Student CBT Screen View
                </span>
                <span className="px-2.5 py-0.5 bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-300">
                  +{marksPositive} | -{marksNegative}
                </span>
              </div>

              {/* Rendered Question Body */}
              <div className="p-4 bg-[#141418] border border-zinc-800 rounded-xl text-zinc-100 text-xs sm:text-sm leading-relaxed space-y-3 min-h-[90px]">
                {questionText ? (
                  <MathRenderer text={questionText} />
                ) : (
                  <span className="text-zinc-600 text-xs italic">Question text will render live here with KaTeX math...</span>
                )}

                {imageUrl && (
                  <div className="p-2 bg-white/5 rounded-lg border border-zinc-800 text-center">
                    <img
                      src={formatImageUrl(imageUrl)}
                      alt="Question Diagram"
                      className="max-h-40 mx-auto object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Rendered Options (with diagram images) */}
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map((label, idx) => {
                  const isCorrect = correctAnswer === label;
                  const optText = options[idx];
                  const optImg = optionImages[idx];

                  return (
                    <div
                      key={label}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition ${
                        isCorrect
                          ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200'
                          : 'border-zinc-800/80 bg-[#141418] text-zinc-300'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                        isCorrect ? 'bg-emerald-500 text-black font-extrabold' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {label}
                      </span>
                      <div className="flex-1 font-medium space-y-2">
                        {optText && <MathRenderer text={optText} />}
                        {optImg && (
                          <div className="p-1 bg-white/5 rounded border border-zinc-700/60 inline-block">
                            <img
                              src={formatImageUrl(optImg)}
                              alt={`Option ${label} diagram`}
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
                <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-blue-200 text-xs space-y-1">
                  <p className="font-bold text-blue-400 text-[10px] uppercase tracking-wider">Solution Explanation:</p>
                  <MathRenderer text={solution} />
                </div>
              )}
            </div>

            {/* Live CBT Status Summary */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Section: <strong className="text-zinc-300">{section}</strong></span>
              <span>Diff: <strong className="text-zinc-300">{difficulty}</strong></span>
              <span>Key: <strong className="text-emerald-400 font-bold">{correctAnswer}</strong></span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="h-16 px-6 border-t border-zinc-800 bg-[#18181c] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-400/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Saving Question...' : initialData?.id ? 'Update Question' : 'Save to Question Bank'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
