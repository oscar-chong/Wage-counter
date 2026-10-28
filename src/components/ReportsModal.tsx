import React, { useState } from 'react';
import { FileText, Download, Printer, X, Calendar, Check } from 'lucide-react';
import { DaySchedule, LeaveDay, TimeLog, UserSalaryConfig } from '../types';
import {
  exportToCSV,
  exportToPDF,
  generateReportData,
} from '../utils/exportReport';
import { formatCurrency } from '../utils/calculations';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserSalaryConfig;
  schedules: DaySchedule[];
  leaves: LeaveDay[];
  logs: TimeLog[];
}

type ReportRange = '7days' | 'thisMonth' | '30days';

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  config,
  schedules,
  leaves,
  logs,
}) => {
  const [range, setRange] = useState<ReportRange>('thisMonth');

  if (!isOpen) return null;

  const now = new Date();
  let startDate = new Date();
  const endDate = new Date(now);

  if (range === '7days') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 6);
  } else if (range === 'thisMonth') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 29);
  }

  const { rows, totals } = generateReportData(
    startDate,
    endDate,
    config,
    schedules,
    leaves,
    logs
  );

  const handleDownloadCSV = () => {
    exportToCSV(rows, totals, config.currency);
  };

  const handleDownloadPDF = () => {
    exportToPDF(rows, totals, config);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-5xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Daily Earnings & Timesheet Report
              </h3>
              <p className="text-xs text-slate-400">
                Detailed day-by-day record of salary, breaks, toilet times, overtime, and bonus.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Range Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setRange('7days')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  range === '7days' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setRange('thisMonth')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  range === 'thisMonth' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setRange('30days')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  range === '30days' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Last 30 Days
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Totals Cards */}
        <div className="p-4 sm:p-6 bg-slate-950/60 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Net Earnings</div>
            <div className="font-mono font-black text-emerald-400 text-lg sm:text-xl mt-0.5">
              {formatCurrency(totals.net, config.currency)}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Scheduled Hours</div>
            <div className="font-mono font-bold text-white text-lg sm:text-xl mt-0.5">
              {totals.hours} hrs
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">⚡ Paid OT Pay</div>
            <div className="font-mono font-bold text-amber-400 text-lg sm:text-xl mt-0.5">
              {formatCurrency(totals.ot, config.currency)}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-[11px] text-rose-400 uppercase font-semibold flex items-center gap-1">
              <span>⚠️ Unpaid OT (Lost)</span>
            </div>
            <div className="font-mono font-bold text-rose-400 text-lg sm:text-xl mt-0.5">
              -{formatCurrency(totals.unpaidOtLost, config.currency)}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 sticky top-0 text-[11px] text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-2">Day</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-2">Hours</th>
                <th className="py-2.5 px-3">Base Pay</th>
                <th className="py-2.5 px-3">Toilet Pay</th>
                <th className="py-2.5 px-3">Paid OT</th>
                <th className="py-2.5 px-3 text-rose-400">Unpaid OT (Lost)</th>
                <th className="py-2.5 px-3 text-right">Net Day Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {rows.map((row) => (
                <tr key={row.dateStr} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white">{row.dateStr}</td>
                  <td className="py-2.5 px-2 text-slate-400">{row.dayName}</td>
                  <td className="py-2.5 px-3 font-sans text-[11px]">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md ${
                        row.status.includes('ANNUAL')
                          ? 'bg-teal-500/20 text-teal-300'
                          : row.status.includes('SPECIAL')
                          ? 'bg-purple-500/20 text-purple-300'
                          : row.status.includes('HOLIDAY')
                          ? 'bg-amber-500/20 text-amber-300'
                          : row.status === 'Rest Day'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">{row.scheduledHours}h</td>
                  <td className="py-2.5 px-3">{formatCurrency(row.baseEarned, config.currency)}</td>
                  <td className="py-2.5 px-3 text-blue-400">
                    {row.toiletTimeMin > 0 ? `${row.toiletTimeMin}m (${formatCurrency(row.toiletImpact, config.currency)})` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-amber-400">
                    {row.overtimeHours > 0 ? `${row.overtimeHours}h (${formatCurrency(row.overtimeEarned, config.currency)})` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-rose-400">
                    {row.unpaidOtLost > 0 ? `-${formatCurrency(row.unpaidOtLost, config.currency)}` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-white">
                    {formatCurrency(row.netEarned, config.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Export format compliance: CSV (RFC-4180) & PDF (vector print ready)
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
