import React, { useState } from 'react';
import { Trash2, Clock, CheckCircle2, DollarSign, AlertTriangle, Camera, Bookmark } from 'lucide-react';
import { RecordedSnapshot, TimeLog, UserSalaryConfig } from '../types';
import { formatCurrency } from '../utils/calculations';

interface LogsTimelineProps {
  logs: TimeLog[];
  snapshots?: RecordedSnapshot[];
  config: UserSalaryConfig;
  onDeleteLog: (id: string) => void;
  onDeleteSnapshot?: (id: string) => void;
  onClearLogs: () => void;
}

export const LogsTimeline: React.FC<LogsTimelineProps> = ({
  logs,
  snapshots = [],
  config,
  onDeleteLog,
  onDeleteSnapshot,
  onClearLogs,
}) => {
  const [activeView, setActiveView] = useState<'all' | 'unpaid' | 'snapshots'>('all');

  // Sort reverse chronological
  const sortedLogs = [...logs].sort((a, b) => b.startTime - a.startTime);
  const sortedSnapshots = [...snapshots].sort((a, b) => b.timestamp - a.timestamp);

  const formatDuration = (start: number, end?: number) => {
    const durationSec = Math.max(0, Math.floor(((end || Date.now()) - start) / 1000));
    const mins = Math.floor(durationSec / 60);
    const secs = durationSec % 60;
    if (mins >= 60) {
      const hours = (mins / 60).toFixed(1);
      return `${hours}h (${mins}m)`;
    }
    return `${mins}m ${secs}s`;
  };

  const formatTimestamp = (ms: number) => {
    const d = new Date(ms);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Calculate totals
  let totalToiletMoney = 0;
  let totalPaidOtMoney = 0;
  let totalUnpaidOtMoney = 0;

  logs.forEach((log) => {
    const durationHours = Math.max(0, ((log.endTime || Date.now()) - log.startTime) / 3600000);
    if (log.type === 'toilet') {
      const pay = durationHours * config.hourlyRate;
      totalToiletMoney += config.toiletIsPaid ? pay : -pay;
    } else if (log.type === 'overtime') {
      const mult = log.rateMultiplier || config.overtimeMultiplier || 1.5;
      const pay = durationHours * config.hourlyRate * mult;
      if (log.isUnpaidOT) {
        totalUnpaidOtMoney += pay;
      } else {
        totalPaidOtMoney += pay;
      }
    }
  });

  const filteredLogs = activeView === 'unpaid' ? sortedLogs.filter((l) => l.isUnpaidOT) : sortedLogs;

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Activity & Record History Log</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Exact timestamped sessions showing the money earned, deductions, unpaid OT lost income, and saved snapshots.
          </p>
        </div>

        {/* View filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveView('all')}
            className={`px-3 py-1 rounded-lg transition-all font-semibold ${
              activeView === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveView('unpaid')}
            className={`px-3 py-1 rounded-lg transition-all font-semibold ${
              activeView === 'unpaid' ? 'bg-rose-950 text-rose-300 border border-rose-500/40 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚠️ Unpaid OT ({logs.filter((l) => l.isUnpaidOT).length})
          </button>
          <button
            onClick={() => setActiveView('snapshots')}
            className={`px-3 py-1 rounded-lg transition-all font-semibold ${
              activeView === 'snapshots' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            📸 Snapshots ({snapshots.length})
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="text-slate-400 text-[11px]">🚽 Net Toilet Pay</div>
          <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
            {formatCurrency(Math.max(0, totalToiletMoney), config.currency)}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="text-slate-400 text-[11px]">⚡ Paid Overtime</div>
          <div className="font-mono font-bold text-amber-400 text-sm mt-0.5">
            {formatCurrency(totalPaidOtMoney, config.currency)}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="text-slate-400 text-[11px] text-rose-400 font-semibold">⚠️ Unpaid OT (Lost)</div>
          <div className="font-mono font-bold text-rose-400 text-sm mt-0.5">
            -{formatCurrency(totalUnpaidOtMoney, config.currency)}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="text-slate-400 text-[11px]">Recorded Items</div>
          <div className="font-mono font-bold text-white text-sm mt-0.5">
            {logs.length + snapshots.length} total
          </div>
        </div>
      </div>

      {/* Snapshots View */}
      {activeView === 'snapshots' ? (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {sortedSnapshots.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">
              No balance snapshots recorded yet. Use the <strong>"Record Snapshot"</strong> button next to the dropdown menu above to save a snapshot anytime!
            </div>
          ) : (
            sortedSnapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-base font-bold">
                    📸
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{snap.periodLabel}</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Snapshot
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatTimestamp(snap.timestamp)} {snap.note && `· ${snap.note}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-xs font-mono font-bold ${snap.period === 'unpaid_ot' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {snap.period === 'unpaid_ot' && '-'}{formatCurrency(snap.amount, snap.currency)}
                    </div>
                    <div className="text-[10px] text-slate-400">{snap.period === 'unpaid_ot' ? 'Lost Income' : 'Recorded Balance'}</div>
                  </div>

                  {onDeleteSnapshot && (
                    <button
                      onClick={() => onDeleteSnapshot(snap.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete snapshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Logs List */
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">
              {activeView === 'unpaid'
                ? 'No unpaid overtime logged yet. Click "Clock Unpaid OT" above to log uncompensated overtime.'
                : 'No activities recorded yet. Click on "Toilet Break", "Lunch Hour", or "Overtime" above to start clocking!'}
            </div>
          ) : (
            filteredLogs.map((log) => {
              const durationHours = Math.max(0, ((log.endTime || Date.now()) - log.startTime) / 3600000);
              let earnedAmount = 0;
              let isPositive = true;

              if (log.type === 'overtime') {
                const mult = log.rateMultiplier || config.overtimeMultiplier || 1.5;
                earnedAmount = durationHours * config.hourlyRate * mult;
                isPositive = !log.isUnpaidOT;
              } else if (log.type === 'toilet') {
                earnedAmount = durationHours * config.hourlyRate;
                isPositive = config.toiletIsPaid;
              } else {
                earnedAmount = durationHours * config.hourlyRate;
                isPositive = config.lunchIsPaid;
              }

              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                    log.isUnpaidOT
                      ? 'bg-rose-950/40 border-rose-500/40 hover:border-rose-500/70'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                        log.type === 'toilet'
                          ? 'bg-blue-500/20 text-blue-400'
                          : log.type === 'lunch'
                          ? 'bg-amber-500/20 text-amber-400'
                          : log.isUnpaidOT
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {log.type === 'toilet' ? '🚽' : log.type === 'lunch' ? '🥪' : log.isUnpaidOT ? '⚠️' : '⚡'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold capitalize ${log.isUnpaidOT ? 'text-rose-300' : 'text-white'}`}>
                          {log.type === 'toilet'
                            ? 'Toilet / Bathroom Break'
                            : log.type === 'lunch'
                            ? 'Lunch Hour'
                            : log.isUnpaidOT
                            ? 'Unpaid Overtime (Lost Income)'
                            : 'Paid Overtime Clock'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({formatDuration(log.startTime, log.endTime)})
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-0.5">
                        <span>{formatTimestamp(log.startTime)}</span>
                        {log.notes && (
                          <span> · <span className="text-slate-300 italic">{log.notes}</span></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div
                        className={`text-xs font-mono font-bold ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? '+' : '-'}{formatCurrency(earnedAmount, config.currency)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.type === 'toilet'
                          ? config.toiletIsPaid ? 'Paid while pooping' : 'Deducted break'
                          : log.type === 'lunch'
                          ? config.lunchIsPaid ? 'Paid break' : 'Unpaid meal'
                          : log.isUnpaidOT
                          ? 'Employer wage debt'
                          : `${log.rateMultiplier || config.overtimeMultiplier}x rate`}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete log entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
