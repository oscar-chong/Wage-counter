import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Clock,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Camera,
  Check,
  BookmarkCheck,
} from 'lucide-react';
import {
  DaySchedule,
  DisplayPeriod,
  LeaveDay,
  RecordedSnapshot,
  TimeLog,
  UserSalaryConfig,
} from '../types';
import {
  calculateAccumulatedEarnings,
  calculateDayEarnings,
  formatCurrency,
  getCurrencySymbol,
} from '../utils/calculations';
import { loadSelectedPeriod, saveSelectedPeriod } from '../utils/storage';

interface HeroEarningsProps {
  config: UserSalaryConfig;
  schedules: DaySchedule[];
  leaves: LeaveDay[];
  logs: TimeLog[];
  activeActivity: string | null;
  onRecordSnapshot?: (snapshot: RecordedSnapshot) => void;
}

export const HeroEarnings: React.FC<HeroEarningsProps> = ({
  config,
  schedules,
  leaves,
  logs,
  activeActivity,
  onRecordSnapshot,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<DisplayPeriod>(loadSelectedPeriod);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSnapshotRecorded, setIsSnapshotRecorded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click/touch reliably
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const [currentEarnings, setCurrentEarnings] = useState({
    amount: 0,
    periodLabel: "Today's Earnings",
    hourlyRate: config.hourlyRate,
    currentSecondRate: 0,
    isClockActive: false,
    totalHours: 0,
    isLoss: false,
  });

  const [todaySummary, setTodaySummary] = useState({
    baseEarned: 0,
    overtimeEarned: 0,
    unpaidOtHours: 0,
    unpaidOtLost: 0,
    toiletImpact: 0,
    lunchImpact: 0,
    netEarned: 0,
    scheduledWorkHours: 8,
    isWorkDay: true,
  });

  // Real-time ticking effect: updates every 100 milliseconds for silky micro-increments
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const accumulated = calculateAccumulatedEarnings(
        selectedPeriod,
        config,
        schedules,
        leaves,
        logs,
        now
      );
      setCurrentEarnings({
        ...accumulated,
        isLoss: Boolean(accumulated.isLoss),
      });

      const dayStats = calculateDayEarnings(
        now,
        config,
        schedules,
        leaves,
        logs,
        now.getTime()
      );
      setTodaySummary({
        baseEarned: dayStats.baseEarned,
        overtimeEarned: dayStats.overtimeEarned,
        unpaidOtHours: dayStats.unpaidOtHours || 0,
        unpaidOtLost: dayStats.unpaidOtLost || 0,
        toiletImpact: dayStats.toiletImpact,
        lunchImpact: dayStats.lunchImpact,
        netEarned: dayStats.netEarned,
        scheduledWorkHours: dayStats.scheduledWorkHours,
        isWorkDay: dayStats.isWorkDay,
      });
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [selectedPeriod, config, schedules, leaves, logs]);

  const handlePeriodSelect = (periodId: DisplayPeriod) => {
    setSelectedPeriod(periodId);
    saveSelectedPeriod(periodId);
    setIsDropdownOpen(false);
  };

  const handleTakeSnapshot = () => {
    const snapshot: RecordedSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: Date.now(),
      period: selectedPeriod,
      periodLabel: currentEarnings.periodLabel,
      amount: currentEarnings.amount,
      currency: config.currency,
      note: selectedPeriod === 'unpaid_ot' ? 'Unpaid Overtime Lost Income record' : 'Real-time earnings snapshot',
    };

    if (onRecordSnapshot) {
      onRecordSnapshot(snapshot);
    }
    setIsSnapshotRecorded(true);
    setTimeout(() => setIsSnapshotRecorded(false), 2500);
  };

  const periodOptions: { id: DisplayPeriod; label: string; sub: string; isLoss?: boolean }[] = [
    { id: 'day', label: "Today's Earnings", sub: 'From start of today to right now' },
    { id: 'week', label: "This Week's Earnings", sub: 'Monday through today' },
    { id: 'month', label: "This Month's Earnings", sub: '1st of this month to now' },
    { id: 'year', label: "This Year's Earnings", sub: 'Jan 1st to now' },
    {
      id: 'unpaid_ot',
      label: 'Unpaid OT (Lost Income)',
      sub: 'Uncompensated extra hours worked · Wage loss',
      isLoss: true,
    },
  ];

  const currentOption = periodOptions.find((p) => p.id === selectedPeriod) || periodOptions[0];
  const symbol = getCurrencySymbol(config.currency);
  const isLossMode = selectedPeriod === 'unpaid_ot';

  // Split whole number and decimals for stunning typography
  const formattedFull = currentEarnings.amount.toFixed(4);
  const [integerPart, decimalPart] = formattedFull.split('.');

  return (
    <div
      className={`relative rounded-3xl border p-6 sm:p-8 shadow-2xl transition-all duration-300 ${
        isLossMode
          ? 'bg-gradient-to-b from-rose-950/60 via-slate-900/95 to-slate-950 border-rose-500/50 shadow-rose-950/40'
          : 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-slate-800/80 shadow-emerald-950/20'
      }`}
    >
      {/* Background ambient lighting enclosed in overflow-hidden wrapper so glows don't leak */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl ${
            isLossMode ? 'bg-rose-500/20' : 'bg-emerald-500/10'
          }`}
        />
        <div
          className={`absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl ${
            isLossMode ? 'bg-red-600/15' : 'bg-teal-500/10'
          }`}
        />
      </div>

      {/* Header with recordable dropdown selector - elevated z-40 layer above live counter */}
      <div className="relative z-40 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div className="flex flex-wrap items-center gap-2.5">
          {isLossMode ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>LOST INCOME · UNPAID OVERTIME</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE MONEY EARNER</span>
            </div>
          )}

          {activeActivity && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium capitalize">
              {activeActivity === 'toilet'
                ? '🚽 Toilet Session Active'
                : activeActivity === 'lunch'
                ? '🥪 Lunch Break Active'
                : '⚡ Overtime Clocking'}
            </span>
          )}
        </div>

        {/* Dropdown & Snapshot recorder controls */}
        <div className="flex items-center gap-2">
          {/* Record / Snapshot Current Display Amount */}
          <button
            type="button"
            onClick={handleTakeSnapshot}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 shadow-sm cursor-pointer ${
              isSnapshotRecorded
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Record this exact earnings figure to your history log"
          >
            {isSnapshotRecorded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Recorded!</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Record</span> Snapshot
              </>
            )}
          </button>

          {/* The required recordable dropdown selector */}
          <div className="relative z-[90]" ref={dropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className={`flex items-center gap-2.5 px-4 py-2 border rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer relative z-[91] ${
                isLossMode
                  ? 'bg-rose-950/90 hover:bg-rose-900 text-rose-200 border-rose-500/70'
                  : 'bg-slate-800/95 hover:bg-slate-750 text-slate-100 border-slate-700'
              }`}
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
            >
              <span>{currentOption.label}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 z-[100] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 backdrop-blur-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 pointer-events-auto">
                <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase border-b border-slate-800/80 mb-1">
                  Select Display Period & Balance
                </div>
                {periodOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePeriodSelect(option.id);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex flex-col gap-0.5 cursor-pointer pointer-events-auto ${
                      selectedPeriod === option.id
                        ? option.isLoss
                          ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                          : 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                        : option.isLoss
                        ? 'text-rose-400 hover:bg-rose-950/50'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {option.isLoss && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                      <span className="font-semibold">{option.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {option.sub}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Large Money Display: Always shows ONE amount only */}
      <div className="relative z-0 py-6 sm:py-8 flex flex-col items-center justify-center text-center">
        <div className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
          {isLossMode ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-400 font-bold">Uncompensated Wage Loss</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentOption.label} Total</span>
            </>
          )}
        </div>

        {/* Giant Monospace Numeric Display with Tabular Figures */}
        <div className="flex items-baseline justify-center font-mono tracking-tight text-white select-none">
          {isLossMode && (
            <span className="text-4xl sm:text-6xl md:text-7xl font-bold text-rose-400 mr-2">
              -
            </span>
          )}
          <span
            className={`text-3xl sm:text-5xl md:text-6xl font-light mr-1 ${
              isLossMode ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {symbol}
          </span>
          <span
            className={`text-5xl sm:text-7xl md:text-8xl font-extrabold tabular-nums tracking-tighter bg-clip-text text-transparent ${
              isLossMode
                ? 'bg-gradient-to-r from-rose-200 via-rose-400 to-red-500'
                : 'bg-gradient-to-r from-white via-slate-100 to-slate-300'
            }`}
          >
            {Number(integerPart).toLocaleString()}
          </span>
          <span
            className={`text-2xl sm:text-4xl md:text-5xl font-semibold tabular-nums ml-1 ${
              isLossMode ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            .{decimalPart}
          </span>
        </div>

        {/* Real-time Velocity indicator */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
          {isLossMode ? (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Total Unpaid OT: {currentEarnings.totalHours.toFixed(1)} hrs</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 font-mono">
                <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                <span>Value: ${(config.hourlyRate * config.overtimeMultiplier).toFixed(2)}/hr</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>+${(currentEarnings.hourlyRate / 3600).toFixed(4)}/sec</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 font-mono">
                <DollarSign className="w-3.5 h-3.5 text-teal-400" />
                <span>${currentEarnings.hourlyRate.toFixed(2)}/hr base</span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300">
                {currentEarnings.isClockActive ? (
                  <span className="text-emerald-400 font-semibold">⚡ On the Clock</span>
                ) : (
                  <span className="text-slate-400 font-normal">Off Clock / Rest Hour</span>
                )}
              </div>
            </>
          )}
        </div>

        {isLossMode && (
          <div className="mt-3 text-xs text-rose-300/80 max-w-md mx-auto">
            This represents unpaid overtime hours logged. Your employer has not compensated you for this work.
          </div>
        )}
      </div>

      {/* Quick Status Sub-Strip */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/60 text-xs">
        <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800/60">
          <div className="text-slate-400 text-[11px]">Today's Scheduled Pay</div>
          <div className="font-mono font-bold text-white text-sm sm:text-base mt-0.5">
            {formatCurrency(todaySummary.baseEarned, config.currency)}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800/60">
          <div className="text-slate-400 text-[11px] flex items-center gap-1">
            <span>🚽 Toilet Pay</span>
            <span className="text-[10px] text-emerald-400 font-semibold">(Earned)</span>
          </div>
          <div className="font-mono font-bold text-emerald-400 text-sm sm:text-base mt-0.5">
            {formatCurrency(Math.max(0, todaySummary.toiletImpact), config.currency)}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800/60">
          <div className="text-slate-400 text-[11px] flex items-center gap-1">
            <span>⚡ Overtime Pay</span>
            <span className="text-[10px] text-amber-400 font-semibold">(Earned)</span>
          </div>
          <div className="font-mono font-bold text-amber-400 text-sm sm:text-base mt-0.5">
            {formatCurrency(todaySummary.overtimeEarned, config.currency)}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800/60">
          <div className="text-slate-400 text-[11px] flex items-center gap-1 text-rose-400">
            <span>⚠️ Unpaid OT Lost</span>
          </div>
          <div className="font-mono font-bold text-rose-400 text-sm sm:text-base mt-0.5">
            {formatCurrency(todaySummary.unpaidOtLost, config.currency)}
          </div>
        </div>
      </div>
    </div>
  );
};
