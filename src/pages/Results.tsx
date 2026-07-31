import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

export function Results() {
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [meritList, setMeritList] = useState<any[]>([]);
  const [isResponsesReleased, setIsResponsesReleased] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('tests').select('id, title').then(({ data }) => {
      if (data) {
        setTests(data);
        if (data.length > 0) setSelectedTestId(data[0].id);
      }
    });
  }, []);

  const handleReleaseResponses = async () => {
    try {
      await api.releaseResponses(selectedTestId);
      setIsResponsesReleased(true);
      setCountdown(24 * 60 * 60); // 24 hours in seconds
      alert('Response sheets released successfully! Countdown started.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePublishMeritList = async () => {
    try {
      await api.publishMeritList(selectedTestId);
      alert('Merit list published successfully!');
      // mock fetch merit list
      setMeritList([
        { rank: 1, name: 'Rahul Kumar', roll: 'VP24001', score: 210, percentile: 99.9 },
        { rank: 2, name: 'Priya Singh', roll: 'VP24002', score: 195, percentile: 98.5 },
      ]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white mb-6">Exam Results & Merit List</h1>
        <select
          value={selectedTestId}
          onChange={(e) => setSelectedTestId(e.target.value)}
          className="bg-neutral-900 border border-white/10 rounded-lg px-4 py-2 text-white"
        >
          <option value="" disabled>Select Test</option>
          {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={handleReleaseResponses}
          disabled={isResponsesReleased}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          {isResponsesReleased ? 'Responses Released' : 'Publish Response Sheets'}
        </button>
        <button 
          onClick={handlePublishMeritList}
          disabled={!isResponsesReleased || (countdown !== null && countdown > 0)}
          className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-neutral-950 px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          Release Final Merit List
        </button>
        {countdown !== null && countdown > 0 && (
          <div className="flex items-center text-amber-400 font-mono">
            {Math.floor(countdown / 3600)}h {Math.floor((countdown % 3600) / 60)}m remaining
          </div>
        )}
      </div>

      {meritList.length > 0 && (
        <div className="bg-neutral-800/50 border border-white/10 rounded-xl overflow-hidden mt-6">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-900/50 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Percentile</th>
              </tr>
            </thead>
            <tbody>
              {meritList.map((m) => (
                <tr key={m.rank} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 font-bold text-amber-400">#{m.rank}</td>
                  <td className="px-6 py-4 font-medium text-white">{m.name}</td>
                  <td className="px-6 py-4">{m.roll}</td>
                  <td className="px-6 py-4 font-semibold text-white">{m.score}</td>
                  <td className="px-6 py-4">{m.percentile}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
