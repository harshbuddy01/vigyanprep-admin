import { BarChart3, Trophy, Medal } from 'lucide-react';

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Aarav Sharma', test: 'IAT Full Length Mock 1', score: '228 / 240', percentile: '99.8%' },
  { rank: 2, name: 'Priya Patel', test: 'IAT Full Length Mock 1', score: '220 / 240', percentile: '99.5%' },
  { rank: 3, name: 'Rohan Gupta', test: 'IAT Full Length Mock 1', score: '215 / 240', percentile: '99.1%' },
  { rank: 4, name: 'Ananya Verma', test: 'NEST Full Length Mock 2', score: '172 / 180', percentile: '98.9%' },
  { rank: 5, name: 'Vikram Singh', test: 'NEST Full Length Mock 2', score: '168 / 180', percentile: '98.5%' },
];

export function Performance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="text-amber-400" /> Student Performance & Leaderboard
        </h1>
        <p className="text-sm text-neutral-400 mt-1">Overall ranking, section-wise analysis, and top scorers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-800/50 border border-white/10 p-6 rounded-xl space-y-2">
          <div className="text-xs text-neutral-400 font-semibold uppercase">Average Score</div>
          <div className="text-3xl font-extrabold text-amber-400">164.5 / 240</div>
          <div className="text-xs text-emerald-400">+5.2% compared to last week</div>
        </div>
        <div className="bg-neutral-800/50 border border-white/10 p-6 rounded-xl space-y-2">
          <div className="text-xs text-neutral-400 font-semibold uppercase">Total Attempts</div>
          <div className="text-3xl font-extrabold text-white">1,482</div>
          <div className="text-xs text-neutral-400">Across 45 active tests</div>
        </div>
        <div className="bg-neutral-800/50 border border-white/10 p-6 rounded-xl space-y-2">
          <div className="text-xs text-neutral-400 font-semibold uppercase">Highest Score</div>
          <div className="text-3xl font-extrabold text-emerald-400">228 / 240</div>
          <div className="text-xs text-neutral-400">Aarav Sharma (IAT Mock 1)</div>
        </div>
      </div>

      <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="text-amber-400" size={20} /> Overall Top Scorers
          </h2>
        </div>
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-neutral-900/50 text-xs uppercase text-neutral-400 border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4">Test Series</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Percentile</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_LEADERBOARD.map((item) => (
              <tr key={item.rank} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-6 py-4 font-bold">
                  {item.rank === 1 && <Medal className="text-amber-400 inline mr-1" size={16} />}
                  {item.rank === 2 && <Medal className="text-slate-300 inline mr-1" size={16} />}
                  {item.rank === 3 && <Medal className="text-amber-700 inline mr-1" size={16} />}
                  #{item.rank}
                </td>
                <td className="px-6 py-4 font-semibold text-white">{item.name}</td>
                <td className="px-6 py-4 text-xs text-neutral-400">{item.test}</td>
                <td className="px-6 py-4 font-bold text-amber-400">{item.score}</td>
                <td className="px-6 py-4 text-emerald-400 font-semibold">{item.percentile}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
