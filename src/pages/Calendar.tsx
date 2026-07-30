import { Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';

const UPCOMING_TESTS = [
  { id: '1', title: 'IISER IAT Full Length Mock 5', date: '2026-08-05', time: '10:00 AM', duration: '180 mins', type: 'Mock Test' },
  { id: '2', title: 'NISER NEST All India Live Test', date: '2026-08-12', time: '02:00 PM', duration: '180 mins', type: 'Live Test' },
  { id: '3', title: 'Physics Chapterwise Practice Test 3', date: '2026-08-18', time: '05:00 PM', duration: '60 mins', type: 'Chapter Test' },
];

export function Calendar() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="text-amber-400" /> Test Calendar & Schedule
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Schedule live exams, mock tests, and timed releases for students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-neutral-800/50 border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock size={18} className="text-amber-400" /> Scheduled Upcoming Tests
          </h2>
          <div className="space-y-3">
            {UPCOMING_TESTS.map((t) => (
              <div key={t.id} className="p-4 bg-neutral-900 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">{t.title}</div>
                  <div className="text-xs text-neutral-400 mt-1">
                    📅 {t.date} at {t.time} • ⏳ {t.duration}
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-full text-xs font-semibold">
                  {t.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Quick Schedule Test</h2>
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Select Test</label>
              <select className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400">
                <option>IAT Full Length Mock 5</option>
                <option>NEST Mock Test 2</option>
                <option>ISI Practice Test 1</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Date</label>
              <input
                type="date"
                defaultValue="2026-08-05"
                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Time</label>
              <input
                type="time"
                defaultValue="10:00"
                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-400 text-neutral-950 font-bold rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-amber-300 transition"
            >
              <Plus size={16} /> Schedule Test Release
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
