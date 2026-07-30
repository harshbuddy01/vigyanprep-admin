import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_RESULTS = [
  { id: 'R1', student: 'Rahul Kumar', test: 'JEE Main Mock 1', score: 210, percentage: 70, submittedAt: '2023-10-25 14:30' },
  { id: 'R2', student: 'Priya Singh', test: 'NEET Mock 1', score: 620, percentage: 86, submittedAt: '2023-10-26 10:15' },
];

const distributionData = [
  { range: '0-20%', count: 5 },
  { range: '21-40%', count: 15 },
  { range: '41-60%', count: 45 },
  { range: '61-80%', count: 25 },
  { range: '81-100%', count: 10 },
];

export function Results() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Exam Results</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-neutral-800/50 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Score Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="range" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #333' }}
                  itemStyle={{ color: '#fbbf24' }}
                  cursor={{ fill: '#ffffff10' }}
                />
                <Bar dataKey="count" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Performers</h2>
          <div className="space-y-4">
            {MOCK_RESULTS.slice(0,3).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-white/5">
                <div>
                  <div className="font-medium text-white">{r.student}</div>
                  <div className="text-xs text-neutral-400">{r.test}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-400">{r.score}</div>
                  <div className="text-xs text-neutral-400">{r.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden mt-6">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-neutral-900/50 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Test</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Percentage</th>
              <th className="px-6 py-4">Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_RESULTS.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-6 py-4 font-medium text-white">{r.student}</td>
                <td className="px-6 py-4">{r.test}</td>
                <td className="px-6 py-4">{r.score}</td>
                <td className="px-6 py-4">{r.percentage}%</td>
                <td className="px-6 py-4">{r.submittedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
