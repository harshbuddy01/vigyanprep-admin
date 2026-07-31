import { useState } from 'react';
import { FileUp, CheckCircle, AlertCircle, Send, Sparkles, BookOpen } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.vigyanprep.com';

type ParsedQuestion = {
  tempId: string;
  questionNumber: number;
  section: string;
  type: 'MCQ' | 'MSQ' | 'Numerical';
  text: string;
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

      setParsedQuestions(data.questions || []);
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
            Upload question paper PDFs. The system auto-extracts questions & sections so you can assign answer keys and publish to the live site.
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

      {/* Step 2: Parsed Questions Review & Answer Key Selection */}
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
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition disabled:opacity-50"
            >
              <Send size={16} />
              {isPublishing ? 'Publishing...' : 'Approve & Publish to Main Website'}
            </button>
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
          <div className="space-y-4">
            {filteredQuestions.map((q) => (
              <div key={q.tempId} className="bg-neutral-800/50 border border-white/10 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Question {q.questionNumber} • {q.section}
                  </span>
                  <span className="text-xs text-neutral-400 bg-neutral-900 px-3 py-1 rounded-full border border-white/5">
                    Select Correct Answer Key:
                  </span>
                </div>

                <textarea
                  value={q.text}
                  onChange={(e) => handleTextChange(q.tempId, e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-amber-400"
                  rows={3}
                />

                {/* Option Buttons for Answer Key */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['A', 'B', 'C', 'D'].map((optKey, idx) => (
                    <button
                      key={optKey}
                      onClick={() => handleAnswerChange(q.tempId, optKey)}
                      className={`p-3 rounded-lg border text-left text-xs font-semibold transition ${
                        q.correctAnswer === optKey
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                          : 'bg-neutral-900 border-white/10 text-neutral-400 hover:border-white/30'
                      }`}
                    >
                      <div className="font-bold text-white mb-1">Option ({optKey})</div>
                      <div className="truncate">{q.options[idx] || `Option ${optKey}`}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
