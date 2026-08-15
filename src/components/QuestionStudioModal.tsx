import { useState, useEffect } from 'react';
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
  { label: 'Fraction', tex: '\\frac{a}{b}' },
  { label: 'Square Root', tex: '\\sqrt{x}' },
  { label: 'Integral', tex: '\\int_{a}^{b} f(x) dx' },
  { label: 'Vector', tex: '\\vec{v}' },
  { label: 'Delta', tex: '\\Delta' },
  { label: 'Theta', tex: '\\theta' },
  { label: 'Lambda', tex: '\\lambda' },
  { label: 'Pi', tex: '\\pi' },
  { label: 'Plus-Minus', tex: '\\pm' },
  { label: 'Infinity', tex: '\\infty' },
  { label: 'Summation', tex: '\\sum_{i=1}^{n}' },
  { label: 'Subscript', tex: 'x_{1}' },
  { label: 'Superscript', tex: 'x^{2}' },
];

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5">
      {/* Main Studio Card with Guaranteed Fit & Scrollable Columns */}
      <div className="bg-[#121215] text-zinc-100 border border-zinc-700/60 rounded-2xl w-full max-w-7xl h-[94vh] max-h-[94vh] shadow-2xl flex flex-col overflow-hidden animate-fade-in font-sans">
        
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

              {/* Quick Math Snippet Bar */}
              <div className="flex flex-wrap gap-1 p-2 bg-[#18181c] border border-zinc-800 rounded-t-xl overflow-x-auto">
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

              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={4}
                placeholder="Type question statement here. Formulas: e.g. What is the value of $\int_{0}^{\pi} \sin(x) dx$?"
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
                        className="flex-1 bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                      />

                      {/* Add Image Button for this Option */}
                      <button
                        type="button"
                        onClick={() => toggleOptionImageInput(idx)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition shrink-0 ${
                          hasImg
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                        }`}
                        title={`Attach diagram image to Option ${label}`}
                      >
                        <Camera size={11} /> {hasImg ? 'Image Added' : '+ Add Image'}
                      </button>

                      {isCorrect && (
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1 shrink-0">
                          <CheckCircle2 size={13} /> Correct Key
                        </span>
                      )}
                    </div>

                    {/* Option Image Link Section */}
                    {isImgInputOpen && (
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase shrink-0 flex items-center gap-1">
                          <Link2 size={11} /> Option {label} Image:
                        </span>
                        <input
                          type="text"
                          value={optionImages[idx] || ''}
                          onChange={(e) => handleOptionImageChange(idx, e.target.value)}
                          placeholder="https://... or Google Drive link for this option diagram"
                          className="flex-1 bg-[#141418] border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                        />
                        {hasImg && (
                          <div className="flex items-center gap-2">
                            <img
                              src={formatImageUrl(optionImages[idx])}
                              alt={`Opt ${label}`}
                              className="h-7 w-12 object-contain rounded bg-white/5 border border-zinc-700"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                            <button
                              type="button"
                              onClick={() => handleOptionImageChange(idx, '')}
                              className="p-1 text-red-400 hover:text-red-300"
                              title="Remove option image"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Solution / Explanation */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Step-by-Step Solution Explanation (Optional)
              </label>
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                rows={3}
                placeholder="Explain the derivation / formula so students can learn from mistakes..."
                className="w-full bg-[#18181c] border border-zinc-800 rounded-xl p-3 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-400 resize-y"
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
    </div>
  );
}
