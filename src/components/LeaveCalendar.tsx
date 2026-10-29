import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Sun,
  Heart,
  Palmtree,
  Briefcase,
  CheckSquare,
  Square,
  X,
  CalendarRange,
} from 'lucide-react';
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

  // Multi-date selection set (array of "YYYY-MM-DD" strings)
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Range selector helper state
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [showRangePicker, setShowRangePicker] = useState(false);

  // Modal edit state for selected date(s)
  const [modalType, setModalType] = useState<LeaveType>('annual');
  const [modalTitle, setModalTitle] = useState('');
  const [modalIsPaid, setModalIsPaid] = useState(true);

  // Side list filter: 'all' | 'annual' | 'special' | 'holiday' | 'unemployed'
  const [filterCategory, setFilterCategory] = useState<string>('all');

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

  // Multi-selection toggle for a date
  const toggleDateSelection = (dateStr: string) => {
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  // Quick single-date click or multi-select
  const handleDateClick = (dayNum: number) => {
    const clickedDate = new Date(year, month, dayNum);
    const dateStr = formatDateKey(clickedDate);
    toggleDateSelection(dateStr);
  };

  // Select all weekdays in the currently visible month
  const handleSelectAllWeekdays = () => {
    const weekdays: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        weekdays.push(formatDateKey(d));
      }
    }
    // Union with existing
    const combined = Array.from(new Set([...selectedDates, ...weekdays]));
    setSelectedDates(combined);
  };

  // Apply Range Selection
  const handleApplyRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeStart || !rangeEnd) return;

    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    if (start > end) return;

    const rangeDates: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      rangeDates.push(formatDateKey(cur));
      cur.setDate(cur.getDate() + 1);
    }

    const combined = Array.from(new Set([...selectedDates, ...rangeDates]));
    setSelectedDates(combined);
    setShowRangePicker(false);
    setRangeStart('');
    setRangeEnd('');
  };

  const handleClearSelection = () => {
    setSelectedDates([]);
  };

  // Open batch configure modal
  const handleOpenConfigureModal = () => {
    if (selectedDates.length === 0) return;

    // Check if the first selected date already has a leave to prefill
    const firstExisting = leaves.find((l) => selectedDates.includes(l.dateStr));
    if (firstExisting) {
      setModalType(firstExisting.type);
      setModalTitle(firstExisting.title);
      setModalIsPaid(firstExisting.isPaid);
    } else {
      setModalType('annual');
      setModalTitle('Annual Leave');
      setModalIsPaid(true);
    }
    setIsModalOpen(true);
  };

  // Quick 1-click batch assign
  const handleBatchAssign = (
    type: LeaveType,
    title: string,
    isPaid: boolean
  ) => {
    if (selectedDates.length === 0) return;

    // Filter out previous leaves on these dates
    const remainingLeaves = leaves.filter((l) => !selectedDates.includes(l.dateStr));

    const newEntries: LeaveDay[] = selectedDates.map((dateStr) => ({
      dateStr,
      type,
      title,
      isPaid: type === 'unemployed' ? false : isPaid,
    }));

    onSaveLeaves([...remainingLeaves, ...newEntries]);
    setSelectedDates([]);
  };

  // Batch delete / clear leave on selected dates
  const handleBatchDelete = () => {
    if (selectedDates.length === 0) return;
    const remainingLeaves = leaves.filter((l) => !selectedDates.includes(l.dateStr));
    onSaveLeaves(remainingLeaves);
    setSelectedDates([]);
  };

  // Save from modal (batch applies to all selectedDates)
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDates.length === 0) return;

    const defaultTitle =
      modalType === 'annual'
        ? 'Annual Leave'
        : modalType === 'special'
        ? 'Special Leave'
        : modalType === 'holiday'
        ? 'Public Holiday'
        : 'Unemployed Gap';

    const remainingLeaves = leaves.filter((l) => !selectedDates.includes(l.dateStr));
    const newEntries: LeaveDay[] = selectedDates.map((dateStr) => ({
      dateStr,
      type: modalType,
      title: modalTitle.trim() || defaultTitle,
      isPaid: modalType === 'unemployed' ? false : modalIsPaid,
    }));

    onSaveLeaves([...remainingLeaves, ...newEntries]);
    setIsModalOpen(false);
    setSelectedDates([]);
  };

  // Single date delete from sidebar list
  const handleDeleteLeave = (dateStr: string) => {
    const updated = leaves.filter((l) => l.dateStr !== dateStr);
    onSaveLeaves(updated);
    setSelectedDates(selectedDates.filter((d) => d !== dateStr));
  };

  const todayStr = formatDateKey(new Date());

  const annualCount = leaves.filter((l) => l.type === 'annual').length;
  const specialCount = leaves.filter((l) => l.type === 'special').length;
  const holidayCount = leaves.filter((l) => l.type === 'holiday').length;
  const unemployedCount = leaves.filter((l) => l.type === 'unemployed').length;

  const filteredLeaves = leaves.filter((l) => {
    if (filterCategory === 'all') return true;
    return l.type === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            <span>Leave, Holiday & Unemployed Calendar</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select one or multiple dates to batch-mark Annual Leave, Special Leave, Public Holidays, or Unemployed periods.
          </p>
        </div>

        {/* Leave Category Indicators */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-700/30 border border-zinc-600/50 text-zinc-300 font-medium">
            <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
            <span>Unemployed ({unemployedCount})</span>
          </div>
        </div>
      </div>

      {/* Range Selection Bar / Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <CalendarRange className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">Multiple Date Selection:</span>
          <span className="text-slate-400">
            Click any dates on the grid to toggle selection, or use date range.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAllWeekdays}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Select Month Weekdays
          </button>

          <button
            type="button"
            onClick={() => setShowRangePicker(!showRangePicker)}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer border ${
              showRangePicker
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {showRangePicker ? 'Hide Range Tool' : 'Select Date Range...'}
          </button>
        </div>
      </div>

      {/* Date Range Tool Dropdown */}
      {showRangePicker && (
        <form
          onSubmit={handleApplyRange}
          className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 flex flex-wrap items-center gap-3 text-xs animate-in fade-in"
        >
          <span className="font-semibold text-white">From Date:</span>
          <input
            type="date"
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
            required
          />

          <span className="font-semibold text-white">To Date:</span>
          <input
            type="date"
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
            required
          />

          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all cursor-pointer"
          >
            Add Range to Selection
          </button>

          <button
            type="button"
            onClick={() => setShowRangePicker(false)}
            className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Bulk Action Sticky Strip when dates are selected */}
      {selectedDates.length > 0 && (
        <div className="sticky top-2 z-30 p-4 rounded-2xl bg-slate-900 border-2 border-emerald-500/80 shadow-2xl shadow-emerald-950/40 flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs">
              {selectedDates.length}
            </span>
            <div>
              <span className="font-bold text-white text-sm">
                {selectedDates.length} Date{selectedDates.length > 1 ? 's' : ''} Selected
              </span>
              <span className="text-slate-400 block text-[11px]">
                Apply category or salary exclusion rule across all selected dates:
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Batch Buttons */}
            <button
              type="button"
              onClick={() => handleBatchAssign('annual', 'Annual Leave', true)}
              className="px-2.5 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-semibold transition-all cursor-pointer"
              title="Mark all selected dates as Paid Annual Leave"
            >
              🏖️ Paid Annual
            </button>

            <button
              type="button"
              onClick={() => handleBatchAssign('annual', 'Unpaid Leave', false)}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold transition-all cursor-pointer"
              title="Mark all selected dates as Unpaid Leave (deducted from salary)"
            >
              ⛔ Unpaid Leave
            </button>

            <button
              type="button"
              onClick={() => handleBatchAssign('holiday', 'Public Holiday', true)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold transition-all cursor-pointer"
              title="Mark all selected dates as Public Holiday"
            >
              🏛️ Public Holiday
            </button>

            <button
              type="button"
              onClick={() => handleBatchAssign('special', 'Special Leave', true)}
              className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-semibold transition-all cursor-pointer"
              title="Mark all selected dates as Special Leave"
            >
              🩺 Special Leave
            </button>

            {/* UNEMPLOYED CATEGORY BUTTON */}
            <button
              type="button"
              onClick={() => handleBatchAssign('unemployed', 'Unemployed Gap', false)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              title="Mark all selected dates as Unemployed ($0 salary & no working hours)"
            >
              <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
              <span>👔 Unemployed ($0)</span>
            </button>

            <button
              type="button"
              onClick={handleOpenConfigureModal}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all cursor-pointer"
            >
              Custom Label...
            </button>

            <button
              type="button"
              onClick={handleBatchDelete}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
              title="Remove existing leaves from these dates"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonthDate(new Date())}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
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
              <div key={`empty-${i}`} className="min-h-[75px] rounded-xl bg-slate-950/20" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const cellDate = new Date(year, month, dayNum);
              const cellKey = formatDateKey(cellDate);
              const leave = leaves.find((l) => l.dateStr === cellKey);
              const isToday = cellKey === todayStr;
              const isSelected = selectedDates.includes(cellKey);

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleDateClick(dayNum)}
                  className={`min-h-[75px] p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'ring-2 ring-emerald-400 bg-emerald-950/40 border-emerald-400 shadow-md shadow-emerald-950/50 scale-[1.02] z-10'
                      : leave
                      ? leave.type === 'unemployed'
                        ? 'bg-zinc-900/90 border-zinc-600/80 shadow-sm'
                        : leave.type === 'annual'
                        ? leave.isPaid
                          ? 'bg-teal-950/40 border-teal-500/60 shadow-sm'
                          : 'bg-rose-950/30 border-rose-500/50 shadow-sm'
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
                        isSelected
                          ? 'text-emerald-300'
                          : isToday
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>

                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                      {isToday && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </div>
                  </div>

                  {leave ? (
                    <div className="mt-1">
                      <div
                        className={`text-[9px] font-bold truncate rounded px-1 py-0.5 ${
                          leave.type === 'unemployed'
                            ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            : leave.type === 'annual'
                            ? leave.isPaid
                              ? 'bg-teal-500/20 text-teal-300'
                              : 'bg-rose-500/20 text-rose-300'
                            : leave.type === 'special'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {leave.type === 'unemployed'
                          ? '👔 '
                          : leave.type === 'annual'
                          ? '🏖️ '
                          : leave.type === 'special'
                          ? '🩺 '
                          : '🏛️ '}
                        {leave.title}
                      </div>
                      <span className="text-[8px] text-slate-400 block mt-0.5">
                        {leave.type === 'unemployed'
                          ? 'Unemployed ($0)'
                          : leave.isPaid
                          ? 'Paid Day'
                          : 'Unpaid Exclude'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isSelected ? 'Selected' : '+ Select'}
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
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-bold text-white">
                Tagged Leave Days ({leaves.length})
              </h4>
              {leaves.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSaveLeaves([])}
                  className="text-[10px] text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Click dates above to toggle multi-selection and batch apply.
            </p>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1 mb-3">
              {[
                { id: 'all', label: 'All' },
                { id: 'annual', label: '🏖️ Annual' },
                { id: 'special', label: '🩺 Special' },
                { id: 'holiday', label: '🏛️ Holiday' },
                { id: 'unemployed', label: '👔 Unemployed' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                    filterCategory === cat.id
                      ? 'bg-slate-700 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredLeaves.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 italic">
                  {filterCategory === 'all'
                    ? 'No leaves or holidays marked yet. Click on any calendar date to set one.'
                    : `No dates found in ${filterCategory} category.`}
                </div>
              ) : (
                filteredLeaves.map((l) => (
                  <div
                    key={l.dateStr}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                      selectedDates.includes(l.dateStr)
                        ? 'bg-emerald-950/30 border-emerald-500/60'
                        : l.type === 'unemployed'
                        ? 'bg-zinc-950/80 border-zinc-700/60'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">
                          {l.type === 'unemployed'
                            ? '👔'
                            : l.type === 'annual'
                            ? '🏖️'
                            : l.type === 'special'
                            ? '🩺'
                            : '🏛️'}
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[140px]">
                          {l.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {l.dateStr} ·{' '}
                        {l.type === 'unemployed'
                          ? 'Unemployed ($0)'
                          : l.isPaid
                          ? 'Paid Day'
                          : 'Unpaid Exclude'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleDateSelection(l.dateStr)}
                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          selectedDates.includes(l.dateStr)
                            ? 'text-emerald-400 bg-emerald-500/20'
                            : 'text-slate-500 hover:text-white'
                        }`}
                        title="Toggle selection"
                      >
                        {selectedDates.includes(l.dateStr) ? (
                          <CheckSquare className="w-3.5 h-3.5" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLeave(l.dateStr)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Remove date"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date Edit Modal (Supports single or multi-date batch saving) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Configure {selectedDates.length} Date{selectedDates.length > 1 ? 's' : ''}
                </h3>
                <span className="text-xs font-mono text-emerald-400">
                  {selectedDates.length === 1
                    ? selectedDates[0]
                    : `${selectedDates.length} dates selected`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalType('annual');
                      setModalIsPaid(true);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      modalType === 'annual'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    🏖️ Annual Leave
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalType('special');
                      setModalIsPaid(true);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      modalType === 'special'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    🩺 Special Leave
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalType('holiday');
                      setModalIsPaid(true);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      modalType === 'holiday'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    🏛️ Public Holiday
                  </button>
                  {/* UNEMPLOYED CATEGORY OPTION */}
                  <button
                    type="button"
                    onClick={() => {
                      setModalType('unemployed');
                      setModalIsPaid(false);
                      if (!modalTitle || modalTitle === 'Annual Leave' || modalTitle === 'Public Holiday') {
                        setModalTitle('Unemployed Gap');
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      modalType === 'unemployed'
                        ? 'bg-zinc-800 border-zinc-500 text-zinc-100 font-bold ring-1 ring-zinc-400'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    👔 Unemployed ($0)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Label / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Summer Vacation, Medical, Christmas, Job Search Gap"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Salary Calculation Effect
                </label>
                {modalType === 'unemployed' ? (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-300">
                    <span className="font-bold text-zinc-100 block">Strictly $0 / Unpaid Excluded</span>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                      Unemployed dates zero out earnings and exclude working hours from calculation.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModalIsPaid(true)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                        modalIsPaid
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
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
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                        !modalIsPaid
                          ? 'bg-red-500/20 border-red-500 text-red-300 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      Unpaid Exclude
                      <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                        Deduct from working salary ($0)
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBatchDelete}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  Clear Leaves
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Apply to {selectedDates.length} Date{selectedDates.length > 1 ? 's' : ''}
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
