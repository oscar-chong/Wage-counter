import React, { useState } from 'react';
import { Calendar, Clock, Check, Copy, RotateCcw } from 'lucide-react';
import { DaySchedule } from '../types';
import { calculateWeeklyWorkingHours } from '../utils/calculations';

interface ScheduleSettingsProps {
  schedules: DaySchedule[];
  onSaveSchedules: (newSchedules: DaySchedule[]) => void;
}

export const ScheduleSettings: React.FC<ScheduleSettingsProps> = ({
  schedules,
  onSaveSchedules,
}) => {
  const [scheduleList, setScheduleList] = useState<DaySchedule[]>(schedules);
  const [savedBadge, setSavedBadge] = useState(false);

  const weeklyHours = calculateWeeklyWorkingHours(scheduleList);
  const workDaysCount = scheduleList.filter((s) => s.isWorkDay).length;

  const triggerSave = (updated: DaySchedule[]) => {
    setScheduleList(updated);
    onSaveSchedules(updated);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
  };

  const handleToggleWorkDay = (dayIndex: number) => {
    const updated = scheduleList.map((d, idx) =>
      idx === dayIndex ? { ...d, isWorkDay: !d.isWorkDay } : d
    );
    triggerSave(updated);
  };

  const handleTimeChange = (
    dayIndex: number,
    field: 'startTime' | 'endTime' | 'lunchBreakMinutes',
    value: string | number
  ) => {
    const updated = scheduleList.map((d, idx) =>
      idx === dayIndex ? { ...d, [field]: value } : d
    );
    triggerSave(updated);
  };

  const handleApplyDefaultWeekdays = () => {
    // Take Monday's schedule and copy to Tue, Wed, Thu, Fri
    const monday = scheduleList.find((s) => s.dayOfWeek === 1) || scheduleList[1];
    const updated = scheduleList.map((d) => {
      // If Monday - Friday (1 to 5)
      if (d.dayOfWeek >= 1 && d.dayOfWeek <= 5) {
        return {
          ...d,
          isWorkDay: true,
          startTime: monday.startTime,
          endTime: monday.endTime,
          lunchBreakMinutes: monday.lunchBreakMinutes,
        };
      }
      return d;
    });
    triggerSave(updated);
  };

  const calculateDailyNetHours = (day: DaySchedule): number => {
    if (!day.isWorkDay) return 0;
    const [startH, startM] = day.startTime.split(':').map(Number);
    const [endH, endM] = day.endTime.split(':').map(Number);
    const grossMinutes = Math.max(0, (endH * 60 + endM) - (startH * 60 + startM));
    const netMinutes = Math.max(0, grossMinutes - (day.lunchBreakMinutes || 0));
    return Number((netMinutes / 60).toFixed(1));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span>Weekly Work Schedule & Rest Days</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure working hours, start/end shift times, and rest days for each day of the week.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedBadge && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </div>
          )}

          <button
            onClick={handleApplyDefaultWeekdays}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all active:scale-95"
            title="Copy Monday's schedule to all weekdays (Mon-Fri)"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-400" />
            <span>Apply Mon-Fri Default</span>
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">Weekly Work Days</div>
            <div className="text-white font-mono font-bold text-base mt-0.5">
              {workDaysCount} days / week
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Total Working Hours</div>
            <div className="text-emerald-400 font-mono font-bold text-base mt-0.5">
              {weeklyHours.toFixed(1)} hrs / week
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Rest Days</div>
            <div className="text-slate-300 font-medium text-xs mt-0.5">
              {scheduleList.filter((s) => !s.isWorkDay).map((s) => s.name).join(', ') || 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* 7 Days List */}
      <div className="space-y-2.5">
        {scheduleList.map((day, idx) => {
          const netHours = calculateDailyNetHours(day);

          return (
            <div
              key={day.dayOfWeek}
              className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
                day.isWorkDay
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-slate-950/60 border-slate-900 opacity-75'
              }`}
            >
              {/* Day Name & Toggle */}
              <div className="flex items-center gap-3 min-w-[140px]">
                <button
                  type="button"
                  onClick={() => handleToggleWorkDay(idx)}
                  className={`w-9 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                    day.isWorkDay ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      day.isWorkDay ? 'translate-x-3' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div>
                  <h4 className="text-sm font-bold text-white">{day.name}</h4>
                  <span className={`text-[10px] font-semibold ${day.isWorkDay ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {day.isWorkDay ? 'Work Day' : 'Rest Day'}
                  </span>
                </div>
              </div>

              {/* Working Hours Time Inputs */}
              {day.isWorkDay ? (
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">Start:</span>
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <span className="text-slate-600">→</span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">End:</span>
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">Break (m):</span>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      step="5"
                      value={day.lunchBreakMinutes}
                      onChange={(e) => handleTimeChange(idx, 'lunchBreakMinutes', Number(e.target.value))}
                      className="w-16 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="font-mono text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    {netHours}h
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  Scheduled off-shift / Rest day
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
