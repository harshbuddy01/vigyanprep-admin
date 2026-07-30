import { Plus } from 'lucide-react';

const MOCK_TESTS = [
  { id: 'T1', name: 'JEE Main Mock 1', type: 'Full Test', date: '2023-10-01', status: 'Published', questions: 90 },
  { id: 'T2', name: 'Physics Chapter 1', type: 'Chapter Test', date: '2023-10-05', status: 'Draft', questions: 30 },
];

export function Tests() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Tests Management</h1>
        <button className="flex items-center gap-2 bg-amber-400 text-neutral-950 px-4 py-2 rounded-lg font-semibold hover:bg-amber-500 transition-colors">
          <Plus size={20} />
          Create Test
        </button>
      </div>

      <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-neutral-900/50 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Test Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Questions</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_TESTS.map((t) => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-6 py-4 font-medium text-white">{t.name}</td>
                <td className="px-6 py-4">{t.type}</td>
                <td className="px-6 py-4">{t.date}</td>
                <td className="px-6 py-4">{t.questions}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${t.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-500/10 text-neutral-400'}`}>
                    {t.status}
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
