import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export function LiveInvigilation() {
  const [activeStudents, setActiveStudents] = useState<any[]>([]);
  
  const fetchActive = async () => {
    const { data } = await supabase.from('test_attempts').select('*, students(name, roll)').eq('status', 'in_progress');
    if (data) {
      setActiveStudents(data.map(d => ({
        id: d.id,
        name: d.students?.name,
        roll: d.students?.roll,
        timeRemaining: formatTime(Math.max(0, d.time_remaining || 0)),
        answersCount: d.answers_count || 0,
        warningCount: d.warning_count || 0,
        status: d.warning_count > 2 ? '🔴 Auto-submitted' : d.warning_count > 0 ? '🟡 1-2 Warnings' : '🟢 Active'
      })));
    }
  };

  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Live Invigilation</h1>
      
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-neutral-800 p-4 rounded-xl border border-white/10">
          <div className="text-sm text-neutral-400">Total Attempts</div>
          <div className="text-xl font-bold text-white">{activeStudents.length}</div>
        </div>
        <div className="bg-neutral-800 p-4 rounded-xl border border-white/10">
          <div className="text-sm text-neutral-400 text-emerald-400">Active</div>
          <div className="text-xl font-bold text-emerald-400">{activeStudents.filter(s => s.status === '🟢 Active').length}</div>
        </div>
        <div className="bg-neutral-800 p-4 rounded-xl border border-white/10">
          <div className="text-sm text-neutral-400 text-yellow-400">Warnings</div>
          <div className="text-xl font-bold text-yellow-400">{activeStudents.filter(s => s.status.includes('Warnings')).length}</div>
        </div>
        <div className="bg-neutral-800 p-4 rounded-xl border border-white/10">
          <div className="text-sm text-neutral-400 text-red-400">Auto-submitted</div>
          <div className="text-xl font-bold text-red-400">{activeStudents.filter(s => s.status.includes('Auto-submitted')).length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeStudents.map((s) => (
          <div key={s.id} className="bg-neutral-900 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-white">{s.name}</h3>
                  <p className="text-xs text-neutral-400">{s.roll}</p>
                </div>
                <div className="text-sm font-semibold">{s.status}</div>
              </div>
              <div className="space-y-2 mt-4 text-sm text-neutral-300">
                <div className="flex items-center gap-2"><Clock size={14} /> Time Remaining: {s.timeRemaining}</div>
                <div className="flex items-center gap-2"><CheckCircle size={14} /> Answers: {s.answersCount}</div>
                <div className="flex items-center gap-2 text-yellow-400"><AlertTriangle size={14} /> Warnings: {s.warningCount}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 bg-amber-400/10 text-amber-400 border border-amber-400/20 py-1.5 rounded text-sm hover:bg-amber-400/20">Grant +15 Min</button>
              <button className="flex-1 bg-red-400/10 text-red-400 border border-red-400/20 py-1.5 rounded text-sm hover:bg-red-400/20">Reset</button>
            </div>
          </div>
        ))}
        {activeStudents.length === 0 && (
          <div className="col-span-full p-8 text-center text-neutral-500">No active attempts currently.</div>
        )}
      </div>
    </div>
  );
}
