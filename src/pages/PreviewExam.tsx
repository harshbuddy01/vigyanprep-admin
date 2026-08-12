import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
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

export function PreviewExam() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [validatedSuccess, setValidatedSuccess] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    async function loadTestAndQuestions() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/admin/pyq/test/${testId}/questions`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        const data = await res.json();
        setQuestions(data.questions || []);

        const testRes = await fetch(`${API_BASE}/api/public/tests/${testId}`);
        const testData = await testRes.json();
        setTest(testData.test || { id: testId, title: 'Test Series Paper' });
      } catch (err) {
        console.error('Failed to load preview questions:', err);
      } finally {
        setLoading(false);
      }
    }
    if (testId) loadTestAndQuestions();
  }, [testId, token]);

  const handleSelectAnswer = (qNum: number, optKey: string) => {
    setSelectedAnswers(prev => ({ ...prev, [qNum]: optKey }));
  };

  const handleValidatePreview = async () => {
    setValidating(true);
    try {
      const answersArray = questions.map(q => ({
        question_id: q.id,
        answer: selectedAnswers[q.question_number] || ''
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
        setValidatedSuccess(true);
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
    return <div className="p-8 text-white">Loading admin preview test paper...</div>;
  }

  const currentQ = questions[currentIdx];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/test-series')}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
              Admin Preview Quality Gate
            </span>
            <h1 className="text-xl font-bold text-white">{test?.title || 'Preview Test Paper'}</h1>
          </div>
        </div>

        <button
          onClick={handleValidatePreview}
          disabled={validating || validatedSuccess}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-lg ${
            validatedSuccess
              ? 'bg-emerald-500 text-white'
              : 'bg-gradient-to-r from-amber-400 to-orange-500 text-neutral-950 hover:opacity-90'
          }`}
        >
          {validatedSuccess ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
          {validatedSuccess ? 'Preview Gate Passed & Validated!' : validating ? 'Validating...' : 'Complete Preview & Pass Quality Gate'}
        </button>
      </div>

      {validatedSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={18} /> Admin Preview Run completed successfully! `preview_status` is now set to <strong>VALID</strong>.
          </div>
          <button
            onClick={() => navigate('/test-series')}
            className="px-4 py-1.5 bg-emerald-500 text-white font-bold rounded-lg text-xs hover:bg-emerald-600 transition"
          >
            Return & Freeze Test
          </button>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="p-8 bg-neutral-900 border border-white/10 rounded-xl text-center text-neutral-400">
          No questions added to this test paper yet. Click <strong>"Questions"</strong> on the Test Series page to add questions & options.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-neutral-900 border border-white/10 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-sm font-bold text-amber-400">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 border border-white/5">
                Section: {currentQ?.section || 'General'}
              </span>
            </div>

            <div className="text-white text-base leading-relaxed font-medium">
              <MathRenderer text={currentQ?.question_text || ''} />
            </div>

            {currentQ?.image_url && (
              <div className="p-3 bg-neutral-950 rounded-xl border border-white/10 text-center">
                <img src={currentQ.image_url} alt="Question Diagram" className="max-h-64 mx-auto object-contain rounded" />
              </div>
            )}

            <div className="space-y-3 pt-2">
              {['A', 'B', 'C', 'D'].map((optKey, idx) => {
                const optText = currentQ?.options?.[idx] || `Option ${optKey}`;
                const isSelected = selectedAnswers[currentQ?.question_number] === optKey;
                const isCorrect = currentQ?.correct_answer === optKey;

                return (
                  <button
                    key={optKey}
                    onClick={() => handleSelectAnswer(currentQ.question_number, optKey)}
                    className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-amber-400/10 border-amber-400 text-white'
                        : 'bg-neutral-950 border-white/10 text-neutral-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center ${
                        isSelected ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {optKey}
                      </span>
                      <span className="text-sm"><MathRenderer text={optText} /></span>
                    </div>
                    {isCorrect && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded font-semibold border border-emerald-500/30">
                        Answer Key: {optKey}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-4 border-t border-white/10">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                className="px-4 py-2 bg-neutral-800 text-white rounded-lg text-sm disabled:opacity-40"
              >
                Previous Question
              </button>
              <button
                disabled={currentIdx === questions.length - 1}
                onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-4 py-2 bg-amber-400 text-neutral-950 font-bold rounded-lg text-sm disabled:opacity-40"
              >
                Next Question
              </button>
            </div>
          </div>

          <div className="bg-neutral-900 border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
              Question Palette
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isSelected = selectedAnswers[q.question_number];
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-9 h-9 rounded-lg font-bold text-xs flex items-center justify-center transition ${
                      isCurrent
                        ? 'ring-2 ring-amber-400 bg-neutral-800 text-amber-300'
                        : isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-neutral-950 text-neutral-400 border border-white/10 hover:border-amber-400/50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
