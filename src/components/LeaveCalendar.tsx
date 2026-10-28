import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Sun, Heart, Palmtree } from 'lucide-react';
import { LeaveDay, LeaveType } from '../types';
import { formatDateKey } from '../utils/calculations';

interface LeaveCalendarProps {
  leaves: LeaveDay[];
  onSaveLeaves: (leaves: LeaveDay[]) => void;
}

export const LeaveCalendar: React.FC<LeaveCalendarProps> = ({
  leaves,
  onSaveLeaves,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Modal edit state for clicked date
  const [modalType, setModalType] = useState<LeaveType>('annual');
  const [modalTitle, setModalTitle] = useState('');
  const [modalIsPaid, setModalIsPaid] = useState(true);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  // Calendar matrix calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handleDateClick = (dayNum: number) => {
    const clickedDate = new Date(year, month, dayNum);
    const dateStr = formatDateKey(clickedDate);
    const existing = leaves.find((l) => l.dateStr === dateStr);

    setSelectedDateStr(dateStr);
    if (existing) {
      setModalType(existing.type);
      setModalTitle(existing.title);
      setModalIsPaid(existing.isPaid);
    } else {
      setModalType('annual');
      setModalTitle('Annual Leave');
      setModalIsPaid(true);
    }
  };

  const handleSaveLeaveDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateStr) return;

    const filtered = leaves.filter((l) => l.dateStr !== selectedDateStr);
    const newLeave: LeaveDay = {
      dateStr: selectedDateStr,
      type: modalType,
      title: modalTitle || (modalType === 'annual' ? 'Annual Leave' : modalType === 'special' ? 'Special Leave' : 'Public Holiday'),
      isPaid: modalIsPaid,
    };

    onSaveLeaves([...filtered, newLeave]);
    setSelectedDateStr(null);
  };

  const handleDeleteLeave = (dateStr: string) => {
    const updated = leaves.filter((l) => l.dateStr !== dateStr);
    onSaveLeaves(updated);
    if (selectedDateStr === dateStr) {
      setSelectedDateStr(null);
    }
  };

  const todayStr = formatDateKey(new Date());

  const annualCount = leaves.filter((l) => l.type === 'annual').length;
  const specialCount = leaves.filter((l) => l.type === 'special').length;
  const holidayCount = leaves.filter((l) => l.type === 'holiday').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            <span>Leave & Public Holiday Calendar</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select dates to record Annual Leave, Special Leave, or Public Holidays to adjust your salary calculation.
          </p>
        </div>

        {/* Leave Category Indicators */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300">
            <Palmtree className="w-3.5 h-3.5" />
            <span>Annual ({annualCount})</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300">
            <Heart className="w-3.5 h-3.5" />
            <span>Special ({specialCount})</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <Sun className="w-3.5 h-3.5" />
            <span>Holidays ({holidayCount})</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar Grid */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">
              {monthNames[month]} {year}
            </h4>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMonthDate(new Date())}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 pb-1 border-b border-slate-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[70px] rounded-xl bg-slate-950/20" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const cellDate = new Date(year, month, dayNum);
              const cellKey = formatDateKey(cellDate);
              const leave = leaves.find((l) => l.dateStr === cellKey);
              const isToday = cellKey === todayStr;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleDateClick(dayNum)}
                  className={`min-h-[70px] p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                    leave
                      ? leave.type === 'annual'
                        ? 'bg-teal-950/40 border-teal-500/60 shadow-sm'
                        : leave.type === 'special'
                        ? 'bg-purple-950/40 border-purple-500/60 shadow-sm'
                        : 'bg-amber-950/40 border-amber-500/60 shadow-sm'
                      : isToday
                      ? 'bg-slate-800/80 border-emerald-500/80'
                      : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>

                  {leave ? (
                    <div className="mt-1">
                      <div
                        className={`text-[9px] font-bold truncate rounded px-1 py-0.5 ${
                          leave.type === 'annual'
                            ? 'bg-teal-500/20 text-teal-300'
                            : leave.type === 'special'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {leave.type === 'annual' ? '🏖️ ' : leave.type === 'special' ? '🩺 ' : '🏛️ '}
                        {leave.title}
                      </div>
                      <span className="text-[8px] text-slate-400 block mt-0.5">
                        {leave.isPaid ? 'Paid' : 'Unpaid Exclude'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      + Add
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Side Panel: Scheduled Leaves List */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white mb-1">
              Tagged Leave Days ({leaves.length})
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Click any date on the calendar to add or edit leave rules.
            </p>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {leaves.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 italic">
                  No leaves or holidays marked yet. Click on any calendar date to set one.
                </div>
              ) : (
                leaves.map((l) => (
                  <div
                    key={l.dateStr}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">
                          {l.type === 'annual' ? '🏖️' : l.type === 'special' ? '🩺' : '🏛️'}
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[140px]">
                          {l.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {l.dateStr} · {l.isPaid ? 'Paid Day' : 'Unpaid Exclude'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteLeave(l.dateStr)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Remove date"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date Edit Modal */}
      {selectedDateStr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Configure Leave Date</h3>
                <span className="text-xs font-mono text-emerald-400">{selectedDateStr}</span>
              </div>
              <button
                onClick={() => setSelectedDateStr(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLeaveDate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType('annual')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                      modalType === 'annual'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    🏖️ Annual Leave
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalType('special')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                      modalType === 'special'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    🩺 Special Leave
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalType('holiday')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                      modalType === 'holiday'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    🏛️ Public Holiday
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Label / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Summer Vacation, Doctor Visit, Christmas"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Salary Calculation Effect
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalIsPaid(true)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                      modalIsPaid
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Paid Leave
                    <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                      Counts as normal salary day
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalIsPaid(false)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                      !modalIsPaid
                        ? 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Unpaid Exclude
                    <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                      Deduct from working salary
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {leaves.some((l) => l.dateStr === selectedDateStr) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteLeave(selectedDateStr)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Delete Tag
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedDateStr(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    Save Date
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
