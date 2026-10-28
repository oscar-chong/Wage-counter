import React, { useState, useEffect } from 'react';
import { Smartphone, Check, ChevronDown, Flame, DollarSign, Clock, ShieldCheck, Download } from 'lucide-react';
import { DaySchedule, DisplayPeriod, LeaveDay, TimeLog, UserSalaryConfig } from '../types';
import {
  calculateAccumulatedEarnings,
  calculateDayEarnings,
  formatCurrency,
  getCurrencySymbol,
} from '../utils/calculations';

interface WidgetSimulatorProps {
  config: UserSalaryConfig;
  schedules: DaySchedule[];
  leaves: LeaveDay[];
  logs: TimeLog[];
  activeActivity: string | null;
  onTriggerQuickBreak: (type: 'toilet' | 'lunch' | 'overtime') => void;
  onOpenExportModal: () => void;
}

type WidgetSize = 'small' | 'medium' | 'large' | 'lockscreen';

export const WidgetSimulator: React.FC<WidgetSimulatorProps> = ({
  config,
  schedules,
  leaves,
  logs,
  activeActivity,
  onTriggerQuickBreak,
  onOpenExportModal,
}) => {
  const [size, setSize] = useState<WidgetSize>('medium');
  const [period, setPeriod] = useState<DisplayPeriod>('day');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [liveData, setLiveData] = useState({
    amount: 0,
    periodLabel: "Today's Earnings",
    hourlyRate: config.hourlyRate,
    currentSecondRate: 0,
    isClockActive: true,
    totalHours: 0,
    isLoss: false,
  });

  const [todaySummary, setTodaySummary] = useState({
    baseEarned: 0,
    toiletImpact: 0,
    overtimeEarned: 0,
    unpaidOtLost: 0,
    scheduledWorkHours: 8,
  });

  // 100ms real-time loop for live iOS widget ticker
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const accumulated = calculateAccumulatedEarnings(
        period,
        config,
        schedules,
        leaves,
        logs,
        now
      );
      setLiveData({
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
        toiletImpact: dayStats.toiletImpact,
        overtimeEarned: dayStats.overtimeEarned,
        unpaidOtLost: dayStats.unpaidOtLost || 0,
        scheduledWorkHours: dayStats.scheduledWorkHours,
      });
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [period, config, schedules, leaves, logs]);

  const periodOptions: { id: DisplayPeriod; label: string; isLoss?: boolean }[] = [
    { id: 'day', label: "Today's Earnings" },
    { id: 'week', label: "This Week's Earnings" },
    { id: 'month', label: "This Month's Earnings" },
    { id: 'year', label: "This Year's Earnings" },
    { id: 'unpaid_ot', label: "Unpaid OT (Lost Income)", isLoss: true },
  ];

  const currentOption = periodOptions.find((p) => p.id === period) || periodOptions[0];
  const symbol = getCurrencySymbol(config.currency);
  const isLossMode = period === 'unpaid_ot';

  const formattedAmount = liveData.amount.toFixed(2);
  const [intVal, decVal] = formattedAmount.split('.');

  // Compute progress for today's scheduled 8 hours
  const scheduledDailyTotal = todaySummary.scheduledWorkHours * config.hourlyRate;
  const progressPercent = Math.min(
    100,
    Math.round((todaySummary.baseEarned / (scheduledDailyTotal || 1)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              iOS Home Screen & Lock Screen Widget Simulator
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Preview how your real-time earnings widget looks on iOS 16, 17, and 18 with WidgetKit.
          </p>
        </div>

        {/* Widget Size Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            onClick={() => setSize('small')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              size === 'small'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Small (2x2)
          </button>
          <button
            onClick={() => setSize('medium')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              size === 'medium'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Medium (4x2)
          </button>
          <button
            onClick={() => setSize('large')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              size === 'large'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Large (4x4)
          </button>
          <button
            onClick={() => setSize('lockscreen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              size === 'lockscreen'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Lock Screen
          </button>
        </div>
      </div>

      {/* Realistic iPhone Screen Showcase */}
      <div className="relative mx-auto max-w-md w-full rounded-[44px] p-4 bg-gradient-to-b from-slate-900 via-[#0e1628] to-slate-950 border-[6px] border-slate-800 shadow-2xl shadow-emerald-950/40 min-h-[580px] flex flex-col justify-between overflow-hidden">
        {/* Dynamic Island / Notch */}
        <div className="mx-auto w-32 h-6 bg-black rounded-full mb-3 flex items-center justify-between px-3 text-[10px] text-white">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
          {activeActivity ? (
            <span className="text-[10px] text-emerald-400 font-mono animate-pulse">
              {activeActivity === 'toilet' ? '🚽 12m' : '⚡ Live'}
            </span>
          ) : (
            <span className="text-[9px] text-slate-500 font-mono">9:41</span>
          )}
          <div className="w-2 h-2 rounded-full bg-blue-500/80" />
        </div>

        {/* iPhone Status Bar */}
        <div className="flex items-center justify-between px-4 text-xs font-semibold text-slate-300">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>5G</span>
            <span>100%</span>
            <div className="w-5 h-2.5 rounded-sm border border-slate-400 p-0.5 flex items-center">
              <div className="w-full h-full bg-emerald-400 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Widget Canvas Area */}
        <div className="my-auto py-6 flex flex-col items-center justify-center">
          {/* 1. System Small Widget (170x170 pt) */}
          {size === 'small' && (
            <div className={`w-[170px] h-[170px] rounded-[28px] p-4 border shadow-2xl backdrop-blur-xl flex flex-col justify-between text-white relative select-none ${
              isLossMode ? 'bg-rose-950/90 border-rose-500/60' : 'bg-slate-900/90 border-slate-700/60'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black ${
                    isLossMode ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {isLossMode ? '⚠️' : '$'}
                  </div>
                  <span className={`text-[10px] font-bold tracking-tight uppercase truncate max-w-[85px] ${
                    isLossMode ? 'text-rose-300' : 'text-slate-400'
                  }`}>
                    {isLossMode ? 'Unpaid OT' : period}
                  </span>
                </div>
                <span className={`w-2 h-2 rounded-full ${isLossMode ? 'bg-rose-500 animate-pulse' : (liveData.isClockActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600')}`} />
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {isLossMode ? 'Lost Income' : 'Earnings'}
                </div>
                <div className={`text-2xl font-black font-mono tracking-tight tabular-nums ${
                  isLossMode ? 'text-rose-400' : 'text-white'
                }`}>
                  {isLossMode && '-'}{symbol}{formattedAmount}
                </div>
                <div className={`text-[9px] font-mono font-medium mt-0.5 flex items-center gap-1 ${
                  isLossMode ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  <span>{isLossMode ? '⚠️' : '⚡'}</span>
                  <span>{isLossMode ? `${liveData.totalHours.toFixed(1)} hrs unpaid` : `+$${(config.hourlyRate / 3600).toFixed(4)}/s`}</span>
                </div>
              </div>

              {/* Progress bar towards daily target */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isLossMode ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* 2. System Medium Widget (360x170 pt) - THE MAIN WIDGET */}
          {size === 'medium' && (
            <div className={`w-full max-w-[340px] h-[164px] rounded-[28px] p-4 border shadow-2xl backdrop-blur-2xl flex flex-col justify-between text-white relative select-none ${
              isLossMode ? 'bg-rose-950/90 border-rose-500/70' : 'bg-slate-900/95 border-slate-700/80'
            }`}>
              {/* Top row with required period dropdown selector within widget */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-black ${
                    isLossMode ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {isLossMode ? '⚠️' : '$'}
                  </div>
                  <span className={`text-[11px] font-bold tracking-tight ${
                    isLossMode ? 'text-rose-300' : 'text-slate-300'
                  }`}>
                    {isLossMode ? 'LOST INCOME (UNPAID OT)' : 'REAL-TIME WAGE'}
                  </span>
                </div>

                {/* Dropdown in widget */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-[11px] font-semibold text-slate-200 border border-slate-700/80 transition-all cursor-pointer"
                  >
                    <span>{currentOption.label}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-7 w-48 rounded-xl bg-slate-950 border border-slate-700 shadow-xl p-1 z-30">
                      {periodOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setPeriod(opt.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] ${
                            period === opt.id
                              ? opt.isLoss
                                ? 'bg-rose-500/20 text-rose-300 font-bold'
                                : 'bg-emerald-500/20 text-emerald-300 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Large Money Earner: Tabular numbers */}
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline font-mono tracking-tight">
                    {isLossMode && <span className="text-xl font-bold text-rose-400 mr-1">-</span>}
                    <span className={`text-xl font-light mr-1 ${isLossMode ? 'text-rose-400' : 'text-emerald-400'}`}>{symbol}</span>
                    <span className={`text-3xl font-extrabold tabular-nums ${isLossMode ? 'text-rose-300' : 'text-white'}`}>{intVal}</span>
                    <span className={`text-lg font-bold tabular-nums ${isLossMode ? 'text-rose-400' : 'text-emerald-400'}`}>.{decVal}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                    {isLossMode ? (
                      <span className="text-rose-400 font-mono">⚠️ Wage debt: {liveData.totalHours.toFixed(1)} hrs uncompensated</span>
                    ) : (
                      <>
                        <span className="text-emerald-400 font-mono">⚡ ${config.hourlyRate.toFixed(2)}/hr</span>
                        <span>·</span>
                        <span>{liveData.isClockActive ? 'Working Shift' : 'Off Shift'}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Interactive Widget Quick Buttons (WidgetKit iOS 17 AppIntents) */}
                <div className="flex flex-col gap-1.5 items-end">
                  <button
                    onClick={() => onTriggerQuickBreak('toilet')}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-[10px] font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="Interactive Widget Intent: Toilet"
                  >
                    <span>🚽 Toilet</span>
                  </button>
                  <button
                    onClick={() => onTriggerQuickBreak('overtime')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="Interactive Widget Intent: Overtime"
                  >
                    <span>⚡ +OT</span>
                  </button>
                </div>
              </div>

              {/* Bottom Micro strip */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                <span>{isLossMode ? 'Wages owed by employer' : `Daily Goal: ${formatCurrency(scheduledDailyTotal, config.currency)}`}</span>
                <span className={`font-mono font-semibold ${isLossMode ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isLossMode ? 'Wage Theft' : `${progressPercent}%`}
                </span>
              </div>
            </div>
          )}

          {/* 3. System Large Widget (360x376 pt) */}
          {size === 'large' && (
            <div className={`w-full max-w-[340px] h-[340px] rounded-[32px] p-5 border shadow-2xl backdrop-blur-2xl flex flex-col justify-between text-white relative select-none ${
              isLossMode ? 'bg-rose-950/90 border-rose-500/70' : 'bg-slate-900/95 border-slate-700/80'
            }`}>
              {/* Top Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                    isLossMode ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {isLossMode ? '⚠️' : '$'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">WageTicker</h4>
                    <span className="text-[10px] text-slate-400">Interactive Pro Widget</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-semibold text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  <span>{currentOption.label}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>

              {/* Large Ticker */}
              <div className="text-center py-2">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {isLossMode ? 'Accumulated Wage Debt' : 'Accumulated'}
                </div>
                <div className="flex items-baseline justify-center font-mono">
                  {isLossMode && <span className="text-2xl text-rose-400 mr-1">-</span>}
                  <span className={`text-2xl mr-1 ${isLossMode ? 'text-rose-400' : 'text-emerald-400'}`}>{symbol}</span>
                  <span className={`text-4xl font-extrabold tabular-nums ${isLossMode ? 'text-rose-300' : 'text-white'}`}>{intVal}</span>
                  <span className={`text-xl tabular-nums ${isLossMode ? 'text-rose-400' : 'text-emerald-400'}`}>.{decVal}</span>
                </div>
                <div className={`text-[11px] font-mono mt-1 ${isLossMode ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isLossMode ? `Unpaid Rate: $${(config.hourlyRate * config.overtimeMultiplier).toFixed(2)}/hr` : `Rate: +$${(config.hourlyRate / 3600).toFixed(4)} / sec`}
                </div>
              </div>

              {/* Stats Grid inside widget */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                  <div className="text-slate-400">🚽 Toilet Earned</div>
                  <div className="font-mono font-bold text-blue-300 text-xs mt-0.5">
                    {formatCurrency(todaySummary.toiletImpact, config.currency)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                  <div className="text-slate-400">⚠️ Unpaid OT Lost</div>
                  <div className="font-mono font-bold text-rose-400 text-xs mt-0.5">
                    -{formatCurrency(todaySummary.unpaidOtLost, config.currency)}
                  </div>
                </div>
              </div>

              {/* Widget Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => onTriggerQuickBreak('toilet')}
                  className="py-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-semibold hover:bg-blue-600/30 transition-all active:scale-95"
                >
                  🚽 Toilet Timer
                </button>
                <button
                  onClick={() => onTriggerQuickBreak('overtime')}
                  className="py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-600/30 transition-all active:scale-95"
                >
                  ⚡ Overtime
                </button>
              </div>
            </div>
          )}

          {/* 4. Lock Screen Widgets */}
          {size === 'lockscreen' && (
            <div className="w-full max-w-[320px] p-6 rounded-3xl bg-slate-950/80 border border-slate-800 text-white flex flex-col items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-extralight tracking-tight text-white mb-1">
                  09:41
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Tuesday, October 27
                </div>
              </div>

              {/* Lock Screen Accessory Rectangular */}
              <div className={`w-full p-3 rounded-2xl backdrop-blur-md border flex items-center justify-between ${
                isLossMode ? 'bg-rose-950/50 border-rose-500/30' : 'bg-white/10 border-white/15'
              }`}>
                <div>
                  <div className={`text-[10px] font-medium flex items-center gap-1 ${isLossMode ? 'text-rose-300' : 'text-slate-300'}`}>
                    <span>{isLossMode ? '⚠️' : '💵'}</span> {isLossMode ? 'Unpaid OT Lost' : "Today's Earnings"}
                  </div>
                  <div className={`font-mono font-bold text-lg ${isLossMode ? 'text-rose-400' : 'text-white'}`}>
                    {isLossMode && '-'}{symbol}{formattedAmount}
                  </div>
                  <div className={`text-[9px] ${isLossMode ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {isLossMode ? '⚠️ Wage debt owed' : `⚡ Live (+${(config.hourlyRate / 3600).toFixed(4)}/s)`}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-[10px] font-bold ${
                  isLossMode ? 'border-rose-400/80 text-rose-300' : 'border-emerald-400/80'
                }`}>
                  {isLossMode ? 'OT' : `${progressPercent}%`}
                </div>
              </div>

              {/* Lock Screen Accessory Circular */}
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center text-center p-1 ${
                  isLossMode ? 'border-rose-400/30 bg-rose-950/40' : 'border-white/20 bg-white/5'
                }`}>
                  <span className={`text-[9px] ${isLossMode ? 'text-rose-300' : 'text-slate-400'}`}>
                    {isLossMode ? 'LOST' : 'WAGE'}
                  </span>
                  <span className={`text-xs font-black font-mono ${isLossMode ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isLossMode && '-'}{symbol}{Math.floor(liveData.amount)}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Accessory Circular widget for Always-On Display.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* iPhone App Dock */}
        <div className="p-3 rounded-3xl bg-slate-800/40 backdrop-blur-xl border border-slate-700/40 grid grid-cols-4 gap-3 text-center">
          <div className="w-11 h-11 mx-auto rounded-2xl bg-green-500 flex items-center justify-center text-white text-lg shadow-md">
            📞
          </div>
          <div className="w-11 h-11 mx-auto rounded-2xl bg-blue-500 flex items-center justify-center text-white text-lg shadow-md">
            💬
          </div>
          <div className="w-11 h-11 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-emerald-500/30">
            $
          </div>
          <div className="w-11 h-11 mx-auto rounded-2xl bg-red-500 flex items-center justify-center text-white text-lg shadow-md">
            🎵
          </div>
        </div>

        {/* iPhone Home Indicator bar */}
        <div className="w-32 h-1 bg-white/40 rounded-full mx-auto mt-2" />
      </div>

      {/* Action banner to export real iOS widget code */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ready to install this widget on your physical iPhone?</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Download the ready-to-sign .IPA package, complete Swift/WidgetKit code, or run in 2 minutes via Scriptable!
          </p>
        </div>

        <button
          onClick={onOpenExportModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Get .IPA & Widget Code</span>
        </button>
      </div>
    </div>
  );
};
