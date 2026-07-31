import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Tests() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('NEST');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('180');
  const [description, setDescription] = useState('');

  const fetchTests = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tests').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setTests(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleExamTypeChange = (type: string) => {
    setExamType(type);
    if (type === 'CMI') setDuration('210');
    else setDuration('180');
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('tests').insert([
      {
        title,
        exam_type: examType,
        start_date: startDate,
        end_date: endDate,
        duration: parseInt(duration),
        description,
        status: 'Draft',
      }
    ]);
    if (!error) {
      setShowModal(false);
      fetchTests();
      // Reset form
      setTitle(''); setExamType('NEST'); setStartDate(''); setEndDate(''); setDuration('180'); setDescription('');
    } else {
      alert('Error creating test: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Tests Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-400 text-neutral-950 px-4 py-2 rounded-lg font-semibold hover:bg-amber-500 transition-colors"
        >
          <Plus size={20} />
          Create Test
        </button>
      </div>

      {loading ? (
        <div className="text-white">Loading tests...</div>
      ) : (
        <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-900/50 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Test Title</th>
                <th className="px-6 py-4">Exam Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{t.title}</td>
                  <td className="px-6 py-4">{t.exam_type || t.test_type || 'IAT'}</td>
                  <td className="px-6 py-4">{t.duration_minutes || t.duration || 180} mins</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${t.is_published || t.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {t.is_published || t.status === 'Published' ? 'Published' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-3">
                    <a
                      href="/questions"
                      className="px-3 py-1.5 bg-amber-400/10 text-amber-300 border border-amber-400/30 rounded-lg text-xs font-semibold hover:bg-amber-400 hover:text-neutral-950 transition inline-block"
                    >
                      ✏️ Edit Questions
                    </a>
                  </td>
                </tr>
              ))}
              {tests.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center">No tests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create New Test</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Exam Type</label>
                <select required value={examType} onChange={e => handleExamTypeChange(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white">
                  <option value="NEST">NEST</option>
                  <option value="IAT">IAT</option>
                  <option value="CMI">CMI</option>
                  <option value="PYQ">PYQ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Start Date/Time</label>
                <input required type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">End Date/Time</label>
                <input required type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Duration (mins)</label>
                <input required type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Description</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 text-white h-24" />
              </div>
              <button type="submit" className="w-full bg-amber-400 text-neutral-950 font-semibold py-2 rounded-lg hover:bg-amber-500 transition-colors">
                Save Test
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
