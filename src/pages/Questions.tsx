import { useState } from 'react';
import { Plus, Search } from 'lucide-react';

const MOCK_QUESTIONS = [
  { id: 'Q1', section: 'Physics', type: 'MCQ', status: 'Active' },
  { id: 'Q2', section: 'Chemistry', type: 'Numerical', status: 'Draft' },
];

export function Questions() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Question Bank</h1>
        <button className="flex items-center gap-2 bg-amber-400 text-neutral-950 px-4 py-2 rounded-lg font-semibold hover:bg-amber-500 transition-colors">
          <Plus size={20} />
          Add Question
        </button>
      </div>

      <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <select className="bg-neutral-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400">
            <option value="">All Sections</option>
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
            <option value="math">Math</option>
          </select>
        </div>

        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-neutral-900/50 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Section</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_QUESTIONS.map((q) => (
              <tr key={q.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-6 py-4 font-medium text-white">{q.id}</td>
                <td className="px-6 py-4">{q.section}</td>
                <td className="px-6 py-4">{q.type}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${q.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-500/10 text-neutral-400'}`}>
                    {q.status}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button className="text-amber-400 hover:underline">Edit</button>
                  <button className="text-red-400 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
