import React, { useState, useEffect } from 'react';
import { Play, Square, Plus, CheckCircle, Clock, Flame, Utensils, AlertTriangle } from 'lucide-react';
import { ActivityType, TimeLog, UserSalaryConfig } from '../types';
import { formatCurrency } from '../utils/calculations';

interface QuickBreakTrackerProps {
  config: UserSalaryConfig;
  logs: TimeLog[];
  onAddLog: (log: TimeLog) => void;
  activeActivity: ActivityType | null;
  setActiveActivity: (act: ActivityType | null) => void;
}

export const QuickBreakTracker: React.FC<QuickBreakTrackerProps> = ({
  config,
  logs,
  onAddLog,
  activeActivity,
  setActiveActivity,
}) => {
  const [activeStartTime, setActiveStartTime] = useState<number | null>(null);
  const [activeIsUnpaidOT, setActiveIsUnpaidOT] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showManualModal, setShowManualModal] = useState(false);

  // Manual modal state
  const [manualType, setManualType] = useState<ActivityType>('toilet');
  const [manualIsUnpaidOT, setManualIsUnpaidOT] = useState(false);
  const [manualDurationMin, setManualDurationMin] = useState(15);
  const [manualNote, setManualNote] = useState('');

  // Live timer for active activity
  useEffect(() => {
    if (!activeActivity || !activeStartTime) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - activeStartTime) / 1000);
      setElapsedSeconds(seconds);
    }, 500);

    return () => clearInterval(interval);
  }, [activeActivity, activeStartTime]);

  const handleStartActivity = (type: ActivityType, isUnpaidOT: boolean = false) => {
    // If another is active, prompt or auto-stop
    if (activeActivity && activeStartTime) {
      handleStopActivity();
    }
    setActiveActivity(type);
    setActiveIsUnpaidOT(isUnpaidOT);
    setActiveStartTime(Date.now());
  };

  const handleStopActivity = () => {
    if (!activeActivity || !activeStartTime) return;
    const now = Date.now();
    const durationSeconds = Math.max(1, Math.floor((now - activeStartTime) / 1000));
    const durationHours = durationSeconds / 3600;

    let calculatedAmount = 0;
    if (activeActivity === 'overtime') {
      calculatedAmount = durationHours * config.hourlyRate * config.overtimeMultiplier;
    } else if (activeActivity === 'toilet') {
      calculatedAmount = durationHours * config.hourlyRate;
    } else {
      calculatedAmount = durationHours * config.hourlyRate;
    }

    const newLog: TimeLog = {
      id: `log-${Date.now()}`,
      type: activeActivity,
      startTime: activeStartTime,
      endTime: now,
      notes:
        activeActivity === 'toilet'
          ? 'Bathroom break session'
          : activeActivity === 'lunch'
          ? 'Lunch meal break'
          : activeIsUnpaidOT
          ? `Unpaid Overtime Crunch (Lost Income at ${config.overtimeMultiplier}x rate)`
          : `Paid Overtime at ${config.overtimeMultiplier}x rate`,
      rateMultiplier: activeActivity === 'overtime' ? config.overtimeMultiplier : 1.0,
      isPaid: activeActivity === 'toilet' ? config.toiletIsPaid : activeIsUnpaidOT ? false : config.lunchIsPaid,
      isUnpaidOT: activeActivity === 'overtime' && activeIsUnpaidOT,
      calculatedAmount: Number(calculatedAmount.toFixed(2)),
    };

    onAddLog(newLog);
    setActiveActivity(null);
    setActiveIsUnpaidOT(false);
    setActiveStartTime(null);
    setElapsedSeconds(0);
  };

  const handleCreateManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const durationMs = manualDurationMin * 60 * 1000;
    const end = Date.now();
    const start = end - durationMs;
    const durationHours = manualDurationMin / 60;

    let calculatedAmount = 0;
    if (manualType === 'overtime') {
      calculatedAmount = durationHours * config.hourlyRate * config.overtimeMultiplier;
    } else {
      calculatedAmount = durationHours * config.hourlyRate;
    }

    const newLog: TimeLog = {
      id: `log-manual-${Date.now()}`,
      type: manualType,
      startTime: start,
      endTime: end,
      notes: manualNote || (manualIsUnpaidOT ? 'Manual Unpaid Overtime (Lost Income)' : `Manual ${manualType} entry`),
      rateMultiplier: manualType === 'overtime' ? config.overtimeMultiplier : 1.0,
      isPaid: manualType === 'toilet' ? config.toiletIsPaid : manualIsUnpaidOT ? false : config.lunchIsPaid,
      isUnpaidOT: manualType === 'overtime' && manualIsUnpaidOT,
      calculatedAmount: Number(calculatedAmount.toFixed(2)),
    };

    onAddLog(newLog);
    setShowManualModal(false);
    setManualNote('');
    setManualIsUnpaidOT(false);
  };

  // Helper formatting for live ticker
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentActiveEarnings = () => {
    if (!activeActivity) return 0;
    const durationHours = elapsedSeconds / 3600;
    if (activeActivity === 'overtime') {
      return durationHours * config.hourlyRate * config.overtimeMultiplier;
    }
    return durationHours * config.hourlyRate;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Real-Time Break & Overtime Triggers</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click to record exact timestamps. Paid earnings and unpaid OT lost income calculate automatically.
          </p>
        </div>

        <button
          onClick={() => setShowManualModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Manual Entry</span>
        </button>
      </div>

      {/* Active Session Live Island / Bar */}
      {activeActivity && (
        <div
          className={`p-4 rounded-2xl border shadow-xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in ${
            activeIsUnpaidOT
              ? 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-rose-500/50 shadow-rose-950/40'
              : 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border-emerald-500/40 shadow-emerald-950/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                activeIsUnpaidOT
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {activeActivity === 'toilet' ? '🚽' : activeActivity === 'lunch' ? '🥪' : activeIsUnpaidOT ? '⚠️' : '⚡'}
            </div>
            <div>
              <div
                className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                  activeIsUnpaidOT ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-ping ${
                    activeIsUnpaidOT ? 'bg-rose-400' : 'bg-emerald-400'
                  }`}
                />
                <span>
                  {activeActivity === 'toilet'
                    ? 'Bathroom Session in Progress'
                    : activeActivity === 'lunch'
                    ? 'Lunch Break in Progress'
                    : activeIsUnpaidOT
                    ? 'Unpaid Overtime Session (Lost Income Accumulating)'
                    : 'Paid Overtime Clock Active'}
                </span>
              </div>
              <div className="text-slate-200 text-sm font-medium mt-0.5">
                {activeActivity === 'toilet' && (
                  <span>
                    {config.toiletIsPaid ? 'Getting paid to poop! ' : 'Unpaid toilet break. '}
                    Earned: <span className="font-mono font-bold text-emerald-300">{formatCurrency(currentActiveEarnings(), config.currency, 2)}</span>
                  </span>
                )}
                {activeActivity === 'lunch' && (
                  <span>
                    {config.lunchIsPaid ? 'Paid lunch: ' : 'Standard lunch break: '}
                    Value: <span className="font-mono font-bold text-blue-300">{formatCurrency(currentActiveEarnings(), config.currency, 2)}</span>
                  </span>
                )}
                {activeActivity === 'overtime' && (
                  <span>
                    {activeIsUnpaidOT ? (
                      <span className="text-rose-300">
                        Unpaid Overtime Loss: <span className="font-mono font-bold text-rose-400">-{formatCurrency(currentActiveEarnings(), config.currency, 2)}</span>
                      </span>
                    ) : (
                      <span>
                        Overtime ({config.overtimeMultiplier}x): <span className="font-mono font-bold text-amber-300">{formatCurrency(currentActiveEarnings(), config.currency, 2)}</span>
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="font-mono text-2xl font-black text-white tabular-nums tracking-wider px-3 py-1 bg-slate-950/60 rounded-xl border border-slate-800">
              {formatTime(elapsedSeconds)}
            </div>
            <button
              onClick={handleStopActivity}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Finish & Save</span>
            </button>
          </div>
        </div>
      )}

      {/* 4 Prominent Quick Action Cards: Toilet, Lunch, Paid OT, and Unpaid OT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Toilet Break Button */}
        <div
          className={`relative p-4 rounded-2xl border transition-all duration-200 ${
            activeActivity === 'toilet'
              ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-950/30'
              : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🚽</span>
              <div>
                <h4 className="text-sm font-bold text-white">Toilet Break</h4>
                <p className="text-[11px] text-slate-400">
                  {config.toiletIsPaid ? 'Paid on company time' : 'Unpaid break time'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] text-blue-400 font-mono font-medium">
              Rate: ${config.hourlyRate}/hr
            </span>
            {activeActivity === 'toilet' ? (
              <button
                onClick={handleStopActivity}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={() => handleStartActivity('toilet', false)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Clock In</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Lunch Break Button */}
        <div
          className={`relative p-4 rounded-2xl border transition-all duration-200 ${
            activeActivity === 'lunch'
              ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/30'
              : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🥪</span>
              <div>
                <h4 className="text-sm font-bold text-white">Lunch Hour</h4>
                <p className="text-[11px] text-slate-400">
                  {config.lunchIsPaid ? 'Paid meal break' : 'Unpaid meal deduction'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] text-amber-400 font-mono font-medium">
              Daily quota: 60m
            </span>
            {activeActivity === 'lunch' ? (
              <button
                onClick={handleStopActivity}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={() => handleStartActivity('lunch', false)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Start Lunch</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Paid Overtime Button */}
        <div
          className={`relative p-4 rounded-2xl border transition-all duration-200 ${
            activeActivity === 'overtime' && !activeIsUnpaidOT
              ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/30'
              : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="text-sm font-bold text-white">Paid Overtime</h4>
                <p className="text-[11px] text-slate-400">
                  {config.overtimeMultiplier}x rate (${(config.hourlyRate * config.overtimeMultiplier).toFixed(2)}/hr)
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] text-emerald-400 font-mono font-medium">
              Extra Pay
            </span>
            {activeActivity === 'overtime' && !activeIsUnpaidOT ? (
              <button
                onClick={handleStopActivity}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop OT</span>
              </button>
            ) : (
              <button
                onClick={() => handleStartActivity('overtime', false)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Start Paid OT</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. Unpaid Overtime (Lost Income) Button */}
        <div
          className={`relative p-4 rounded-2xl border transition-all duration-200 ${
            activeActivity === 'overtime' && activeIsUnpaidOT
              ? 'bg-rose-950/50 border-rose-500 shadow-lg shadow-rose-950/40'
              : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="text-sm font-bold text-rose-300">Unpaid Overtime</h4>
                <p className="text-[11px] text-slate-400">
                  Track lost income & wage debt
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] text-rose-400 font-mono font-medium">
              Lost Income
            </span>
            {activeActivity === 'overtime' && activeIsUnpaidOT ? (
              <button
                onClick={handleStopActivity}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={() => handleStartActivity('overtime', true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Clock Unpaid OT</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Record Past Activity</span>
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualLog} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Activity Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setManualType('toilet');
                      setManualIsUnpaidOT(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      manualType === 'toilet'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    🚽 Toilet Break
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualType('lunch');
                      setManualIsUnpaidOT(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      manualType === 'lunch'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    🥪 Lunch Break
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualType('overtime');
                      setManualIsUnpaidOT(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      manualType === 'overtime' && !manualIsUnpaidOT
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    ⚡ Paid Overtime
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualType('overtime');
                      setManualIsUnpaidOT(true);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      manualType === 'overtime' && manualIsUnpaidOT
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    ⚠️ Unpaid OT (Lost Income)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={manualDurationMin}
                  onChange={(e) => setManualDurationMin(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder={manualIsUnpaidOT ? 'e.g. Uncompensated weekend shift' : 'e.g. Emergency client bugfix'}
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
