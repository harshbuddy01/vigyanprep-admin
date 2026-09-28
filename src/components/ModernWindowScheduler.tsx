import { Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface ModernWindowSchedulerProps {
  startDate: string; // "YYYY-MM-DDTHH:mm"
  endDate: string;   // "YYYY-MM-DDTHH:mm"
  durationMinutes?: number;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  className?: string;
}

export function ModernWindowScheduler({
  startDate,
  endDate,
  durationMinutes = 180,
  onStartDateChange,
  onEndDateChange,
  className = ''
}: ModernWindowSchedulerProps) {
  const pad = (n: number) => String(n).padStart(2, '0');

  // Split start & end into separate date and time parts
  const startDatePart = startDate ? startDate.slice(0, 10) : '';
  const startTimePart = startDate ? startDate.slice(11, 16) : '';

  const endDatePart = endDate ? endDate.slice(0, 10) : '';
  const endTimePart = endDate ? endDate.slice(11, 16) : '';

  const handleStartDatePartChange = (dateVal: string) => {
    const timeVal = startTimePart || '09:00';
    const newStart = dateVal ? `${dateVal}T${timeVal}` : '';
    onStartDateChange(newStart);

    // If endDate is empty, auto-populate end date with same date + duration
    if (!endDate && dateVal) {
      autoSetEndFromStart(newStart, durationMinutes);
    }
  };

  const handleStartTimePartChange = (timeVal: string) => {
    const dateVal = startDatePart || getTodayString();
    const newStart = `${dateVal}T${timeVal}`;
    onStartDateChange(newStart);

    if (!endDate) {
      autoSetEndFromStart(newStart, durationMinutes);
    }
  };

  const handleEndDatePartChange = (dateVal: string) => {
    const timeVal = endTimePart || '12:00';
    onEndDateChange(dateVal ? `${dateVal}T${timeVal}` : '');
  };

  const handleEndTimePartChange = (timeVal: string) => {
    const dateVal = endDatePart || startDatePart || getTodayString();
    onEndDateChange(`${dateVal}T${timeVal}`);
  };

  const getTodayString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  };

  const getTomorrowString = () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
  };

  const autoSetEndFromStart = (startStr: string, minutes: number) => {
    try {
      const d = new Date(startStr + ':00+05:30');
      if (isNaN(d.getTime())) return;
      const endD = new Date(d.getTime() + minutes * 60 * 1000);
      const endStr = `${endD.getFullYear()}-${pad(endD.getMonth() + 1)}-${pad(endD.getDate())}T${pad(endD.getHours())}:${pad(endD.getMinutes())}`;
      onEndDateChange(endStr);
    } catch (e) {
      console.warn('Auto set end date error', e);
    }
  };

  // Preset 1: Today 9 AM - 12 PM (or + duration)
  const applyPresetTodayMorning = () => {
    const today = getTodayString();
    const start = `${today}T09:00`;
    onStartDateChange(start);
    autoSetEndFromStart(start, durationMinutes);
  };

  // Preset 2: Today 2 PM - 5 PM (or + duration)
  const applyPresetTodayAfternoon = () => {
    const today = getTodayString();
    const start = `${today}T14:00`;
    onStartDateChange(start);
    autoSetEndFromStart(start, durationMinutes);
  };

  // Preset 3: Tomorrow 9 AM - 12 PM
  const applyPresetTomorrowMorning = () => {
    const tomorrow = getTomorrowString();
    const start = `${tomorrow}T09:00`;
    onStartDateChange(start);
    autoSetEndFromStart(start, durationMinutes);
  };

  // Preset 4: Now (nearest 10 min) + duration
  const applyPresetNow = () => {
    const now = new Date();
    // round up to next 10 minutes
    const roundedMinutes = Math.ceil(now.getMinutes() / 10) * 10;
    now.setMinutes(roundedMinutes);
    now.setSeconds(0);
    now.setMilliseconds(0);

    const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    onStartDateChange(start);
    autoSetEndFromStart(start, durationMinutes);
  };

  // Preset 5: 24-Hour window starting 9 AM today
  const applyPreset24Hour = () => {
    const today = getTodayString();
    const tomorrow = getTomorrowString();
    onStartDateChange(`${today}T09:00`);
    onEndDateChange(`${tomorrow}T09:00`);
  };

  // Add hours helper
  const addHoursToEnd = (hours: number) => {
    if (!startDate) {
      applyPresetTodayMorning();
      return;
    }
    try {
      const d = new Date(startDate + ':00+05:30');
      const endD = new Date(d.getTime() + hours * 60 * 60 * 1000);
      const endStr = `${endD.getFullYear()}-${pad(endD.getMonth() + 1)}-${pad(endD.getDate())}T${pad(endD.getHours())}:${pad(endD.getMinutes())}`;
      onEndDateChange(endStr);
    } catch (e) {
      console.warn('Add hours error', e);
    }
  };

  // Format human-readable IST string
  const formatHumanIST = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    try {
      const d = new Date(dateTimeStr + ':00+05:30');
      if (isNaN(d.getTime())) return '';
      return d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' IST';
    } catch {
      return '';
    }
  };

  // Calculate window statistics & validation
  let windowDurationHours = 0;
  let windowDurationMinutes = 0;
  let validationError = '';

  if (startDate && endDate) {
    try {
      const startT = new Date(startDate + ':00+05:30').getTime();
      const endT = new Date(endDate + ':00+05:30').getTime();
      const diffMs = endT - startT;

      if (diffMs <= 0) {
        validationError = 'Window End must be after Window Start.';
      } else {
        const totalMinutes = Math.floor(diffMs / (60 * 1000));
        windowDurationHours = Math.floor(totalMinutes / 60);
        windowDurationMinutes = totalMinutes % 60;

        if (totalMinutes < durationMinutes) {
          validationError = `Window length (${totalMinutes} mins) is shorter than test duration (${durationMinutes} mins).`;
        }
      }
    } catch {
      validationError = 'Invalid date format.';
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 1. Quick Presets Bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Zap size={13} className="text-amber-400" />
            <span>Quick Schedule Presets</span>
          </label>
          <span className="text-[10px] text-zinc-500 font-mono">1-tap auto fill</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={applyPresetTodayMorning}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition"
          >
            Today 9:00 AM
          </button>
          <button
            type="button"
            onClick={applyPresetTodayAfternoon}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition"
          >
            Today 2:00 PM
          </button>
          <button
            type="button"
            onClick={applyPresetTomorrowMorning}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition"
          >
            Tomorrow 9:00 AM
          </button>
          <button
            type="button"
            onClick={applyPresetNow}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 transition flex items-center gap-1"
          >
            <span>Start Now</span>
          </button>
          <button
            type="button"
            onClick={applyPreset24Hour}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition"
          >
            24-Hour Window
          </button>
        </div>
      </div>

      {/* 2. Window Start & End Clean Split Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Window Start */}
        <div className="p-3 rounded-xl bg-[#0d0f12] border border-zinc-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Window Start (IST)</span>
            </label>
            <span className="text-[10px] text-zinc-500 font-mono">Entry Opens</span>
          </div>

          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7 relative">
              <input
                type="date"
                required
                value={startDatePart}
                onChange={(e) => handleStartDatePartChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/70 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 transition"
              />
            </div>
            <div className="col-span-5 relative">
              <input
                type="time"
                required
                value={startTimePart}
                onChange={(e) => handleStartTimePartChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/70 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          {/* Quick Start Time Shortcuts */}
          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
            <span>Quick:</span>
            <button
              type="button"
              onClick={() => handleStartTimePartChange('09:00')}
              className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition"
            >
              09:00 AM
            </button>
            <button
              type="button"
              onClick={() => handleStartTimePartChange('14:00')}
              className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition"
            >
              02:00 PM
            </button>
            <button
              type="button"
              onClick={() => handleStartTimePartChange('18:00')}
              className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition"
            >
              06:00 PM
            </button>
          </div>
        </div>

        {/* Window End */}
        <div className="p-3 rounded-xl bg-[#0d0f12] border border-zinc-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>Window End (IST)</span>
            </label>
            <span className="text-[10px] text-zinc-500 font-mono">Entry Closes</span>
          </div>

          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7 relative">
              <input
                type="date"
                required
                value={endDatePart}
                onChange={(e) => handleEndDatePartChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/70 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 transition"
              />
            </div>
            <div className="col-span-5 relative">
              <input
                type="time"
                required
                value={endTimePart}
                onChange={(e) => handleEndTimePartChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/70 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          {/* Quick End Window Shortcuts */}
          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
            <span>Extend:</span>
            <button
              type="button"
              onClick={() => autoSetEndFromStart(startDate, durationMinutes)}
              className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition"
              title={`Exact exam duration (${durationMinutes} mins)`}
            >
              +{durationMinutes}m
            </button>
            <button
              type="button"
              onClick={() => addHoursToEnd(6)}
              className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition"
            >
              +6 hrs
            </button>
            <button
              type="button"
              onClick={() => addHoursToEnd(24)}
              className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition"
            >
              +24 hrs
            </button>
            <button
              type="button"
              onClick={() => addHoursToEnd(48)}
              className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition"
            >
              +48 hrs
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live Confirmation & Validation Banner */}
      {startDate && endDate && (
        <div
          className={`p-3 rounded-xl border text-xs space-y-1 transition ${
            validationError
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {validationError ? (
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle size={15} className="shrink-0 text-red-400" />
              <span>{validationError}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5 text-white">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <span>Scheduled Window:</span>
                </span>
                <span className="font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                  Window: {windowDurationHours > 0 ? `${windowDurationHours}h ` : ''}
                  {windowDurationMinutes > 0 ? `${windowDurationMinutes}m` : ''}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[11px] text-zinc-300 pt-0.5">
                <span className="font-medium text-emerald-200">{formatHumanIST(startDate)}</span>
                <span className="text-zinc-500 hidden sm:inline">→</span>
                <span className="font-medium text-emerald-200">{formatHumanIST(endDate)}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
