import { useState } from 'react';
import { FileUp, CheckCircle, AlertCircle, Send, Sparkles, BookOpen, Trash2, Image, Plus } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

type ParsedQuestion = {
  tempId: string;
  questionNumber: number;
  section: string;
  type: 'MCQ' | 'MSQ' | 'Numerical';
  text: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: string;
  status: string;
};

export function UploadPDF() {
  const token = useAuthStore((state) => state.token);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [examTitle, setExamTitle] = useState('IISER IAT 2024 Official Paper');
  const [examType, setExamType] = useState('IAT');
  const [year, setYear] = useState('2024');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [activeTab, setActiveTab] = useState<string>('Physics');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadAndParse = async () => {
    if (!file) return;
    setIsUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/admin/pyq/upload-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || data.message || 'Failed to parse PDF');

      // Ensure options are an array of 4 items for each question
      const processed: ParsedQuestion[] = (data.questions || []).map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
        imageUrl: q.imageUrl || q.image_url || ''
      }));

      setParsedQuestions(processed);
    } catch (err: any) {
      setErrorMsg(err.message || 'PDF Parsing failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnswerChange = (tempId: string, answer: string) => {
    setParsedQuestions(prev =>
      prev.map(q => (q.tempId === tempId ? { ...q, correctAnswer: answer } : q))
    );
  };

  const handleTextChange = (tempId: string, text: string) => {
    setParsedQuestions(prev =>
      prev.map(q => (q.tempId === tempId ? { ...q, text } : q))
    );
  };

  const handleSectionChange = (tempId: string, section: string) => {
    setParsedQuestions(prev =>
      prev.map(q => (q.tempId === tempId ? { ...q, section } : q))
    );
  };

  const handleOptionChange = (tempId: string, optionIndex: number, newText: string) => {
    setParsedQuestions(prev =>
      prev.map(q => {
        if (q.tempId !== tempId) return q;
        const newOpts = [...q.options];
        newOpts[optionIndex] = newText;
        return { ...q, options: newOpts };
      })
    );
  };

function formatImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  // Auto-convert Google Drive share links to direct raw image URLs
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  return trimmed;
}

  const handleImageChange = (tempId: string, imageUrl: string) => {
    const directUrl = formatImageUrl(imageUrl);
    setParsedQuestions(prev =>
      prev.map(q => (q.tempId === tempId ? { ...q, imageUrl: directUrl } : q))
    );
  };

  const handleDeleteQuestion = (tempId: string) => {
    setParsedQuestions(prev => prev.filter(q => q.tempId !== tempId));
  };

  const handleAddQuestion = () => {
    const newQ: ParsedQuestion = {
      tempId: `q_custom_${Date.now()}`,
      questionNumber: parsedQuestions.length + 1,
      section: activeTab,
      type: 'MCQ',
      text: 'New Question Text...',
      imageUrl: '',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'A',
      status: 'draft_review'
    };
    setParsedQuestions(prev => [...prev, newQ]);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setErrorMsg(null);
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
          questions: parsedQuestions
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || data.message || 'Publishing failed');

      setPublishSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Publishing failed');
    } finally {
      setIsPublishing(false);
    }
  };

  const sections = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
  const filteredQuestions = parsedQuestions.filter(q => q.section === activeTab || (!sections.includes(q.section) && activeTab === 'Physics'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileUp className="text-amber-400" /> PDF PYQ Auto-Parser & Publisher
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Upload question paper PDFs. Auto-extract, edit questions, options & add diagram images before publishing live.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {publishSuccess && (
        <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-center space-y-3">
          <CheckCircle size={40} className="mx-auto text-emerald-400" />
          <h2 className="text-xl font-bold">PYQ Successfully Published!</h2>
          <p className="text-sm text-neutral-300">
            This PYQ is now live on the main website and available for students to attempt in the exam portal.
          </p>
          <button
            onClick={() => { setPublishSuccess(false); setParsedQuestions([]); setFile(null); }}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition"
          >
            Upload Another PYQ
          </button>
        </div>
      )}

      {/* Step 1: Upload Card */}
      {parsedQuestions.length === 0 && !publishSuccess && (
        <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">Exam Title</label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">Exam Category</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="IAT">IISER IAT</option>
                <option value="NEST">NISER NEST</option>
                <option value="ISI">ISI Entrance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">Year</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="border-2 border-dashed border-white/20 rounded-xl p-10 text-center space-y-4 hover:border-amber-400/50 transition">
            <FileUp size={48} className="mx-auto text-amber-400 opacity-80" />
            <div>
              <p className="text-white font-medium">Click or Drag & Drop PDF Question Paper</p>
              <p className="text-xs text-neutral-400 mt-1">Supports official PDF papers up to 20MB</p>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-400 file:text-neutral-950 hover:file:bg-amber-300 cursor-pointer"
            />
          </div>

          {file && (
            <button
              onClick={handleUploadAndParse}
              disabled={isUploading}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-neutral-950 font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {isUploading ? <Sparkles className="animate-spin" /> : <BookOpen size={18} />}
              {isUploading ? 'Extracting & Parsing Questions...' : 'Auto-Parse PDF Questions'}
            </button>
          )}
        </div>
      )}

      {/* Step 2: Parsed Questions Review, Full Editor & Answer Key Selection */}
      {parsedQuestions.length > 0 && !publishSuccess && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-neutral-800/50 border border-white/10 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Sparkles className="text-amber-400" />
              <div>
                <h2 className="text-lg font-bold text-white">{examTitle}</h2>
                <p className="text-xs text-neutral-400">Extracted {parsedQuestions.length} Questions across 4 sections</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddQuestion}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30 rounded-xl text-sm font-semibold flex items-center gap-1 transition"
              >
                <Plus size={16} /> Add Question
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition disabled:opacity-50"
              >
                <Send size={16} />
                {isPublishing ? 'Publishing...' : 'Approve & Publish to Main Website'}
              </button>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-2 border-b border-white/10 pb-2">
            {sections.map(sec => {
              const count = parsedQuestions.filter(q => q.section === sec || (!sections.includes(q.section) && sec === 'Physics')).length;
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
          <div className="space-y-6">
            {filteredQuestions.map((q) => (
              <div key={q.tempId} className="bg-neutral-800/50 border border-white/10 rounded-xl p-6 space-y-4 hover:border-amber-500/30 transition">

                {/* Question Header & Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Question {q.questionNumber}
                    </span>
                    <select
                      value={q.section}
                      onChange={(e) => handleSectionChange(q.tempId, e.target.value)}
                      className="bg-neutral-900 border border-amber-500/30 text-amber-300 text-xs rounded-md px-2 py-1 focus:outline-none"
                    >
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Biology">Biology</option>
                    </select>
                  </div>

                  {/* Actions: Delete Question */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 bg-neutral-900 px-3 py-1 rounded-full border border-white/5">
                      Correct Key: <strong className="text-amber-400 ml-1">{q.correctAnswer}</strong>
                    </span>
                    <button
                      onClick={() => handleDeleteQuestion(q.tempId)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition"
                      title="Delete Question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Edit Question Text */}
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Question Text</label>
                  <textarea
                    value={q.text}
                    onChange={(e) => handleTextChange(q.tempId, e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-amber-400"
                    rows={3}
                    placeholder="Enter question text..."
                  />
                </div>

                {/* Diagram / Figure Image URL Input */}
                <div className="bg-neutral-900/60 p-3 rounded-lg border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-300 font-semibold">
                    <Image size={14} className="text-amber-400" /> Diagram / Figure Image URL (Optional)
                  </div>
                  <input
                    type="url"
                    value={q.imageUrl || ''}
                    onChange={(e) => handleImageChange(q.tempId, e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-md px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                    placeholder="Paste image URL (e.g. https://domain.com/diagram.png or upload image link)"
                  />
                  {q.imageUrl && formatImageUrl(q.imageUrl) && (
                    <div className="mt-2 p-2 bg-neutral-950 rounded border border-white/10 text-center">
                      <p className="text-[10px] text-neutral-500 mb-1">Image Preview:</p>
                      <img
                        src={formatImageUrl(q.imageUrl)}
                        alt="Question Diagram"
                        className="max-h-40 mx-auto object-contain rounded"
                        onError={(e) => {
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) parent.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Editable Options & Correct Answer Selector */}
                <div className="space-y-2">
                  <label className="block text-xs text-neutral-400 font-semibold">
                    Edit Options & Toggle Correct Answer:
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['A', 'B', 'C', 'D'].map((optKey, idx) => {
                      const isCorrect = q.correctAnswer === optKey;
                      return (
                        <div
                          key={optKey}
                          className={`p-3 rounded-lg border flex items-center gap-3 transition ${
                            isCorrect ? 'bg-amber-400/10 border-amber-400' : 'bg-neutral-900 border-white/10'
                          }`}
                        >
                          <button
                            onClick={() => handleAnswerChange(q.tempId, optKey)}
                            className={`w-7 h-7 rounded-full font-bold text-xs shrink-0 flex items-center justify-center transition ${
                              isCorrect ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                            }`}
                            title="Set as correct answer key"
                          >
                            {optKey}
                          </button>
                          <input
                            type="text"
                            value={q.options[idx] || ''}
                            onChange={(e) => handleOptionChange(q.tempId, idx, e.target.value)}
                            className="flex-1 bg-transparent text-white text-xs focus:outline-none"
                            placeholder={`Option ${optKey} text...`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
