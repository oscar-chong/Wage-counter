import { jsPDF } from 'jspdf';
import { DaySchedule, LeaveDay, TimeLog, UserSalaryConfig } from '../types';
import {
  calculateDayEarnings,
  calculateWeeklyWorkingHours,
  formatCurrency,
  formatDateKey,
} from './calculations';

export interface DailyReportRow {
  dateStr: string;
  dayName: string;
  status: string;
  scheduledHours: number;
  baseEarned: number;
  toiletTimeMin: number;
  toiletImpact: number;
  lunchTimeMin: number;
  overtimeHours: number;
  overtimeEarned: number;
  unpaidOtHours: number;
  unpaidOtLost: number;
  bonusEarned: number;
  netEarned: number;
}

export function generateReportData(
  startDate: Date,
  endDate: Date,
  config: UserSalaryConfig,
  schedules: DaySchedule[],
  leaves: LeaveDay[],
  logs: TimeLog[]
): {
  rows: DailyReportRow[];
  totals: {
    hours: number;
    base: number;
    ot: number;
    unpaidOtLost: number;
    bonus: number;
    net: number;
    toiletEarned: number;
  };
} {
  const rows: DailyReportRow[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  const endMs = endDate.getTime();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let totalHours = 0;
  let totalBase = 0;
  let totalOt = 0;
  let totalUnpaidOtLost = 0;
  let totalBonus = 0;
  let totalNet = 0;
  let totalToiletEarned = 0;

  while (cursor.getTime() <= endMs) {
    const dateKey = formatDateKey(cursor);
    const dayOfWeek = cursor.getDay();
    const dayStats = calculateDayEarnings(
      new Date(cursor),
      config,
      schedules,
      leaves,
      logs,
      Date.now()
    );

    // Calculate toilet, lunch, and OT minutes from logs
    const dayLogs = logs.filter((l) => formatDateKey(new Date(l.startTime)) === dateKey);
    let toiletSeconds = 0;
    let lunchSeconds = 0;
    let otHours = 0;
    let unpaidOtHours = 0;
    let unpaidOtLost = 0;

    for (const log of dayLogs) {
      const durationSec = Math.max(0, ((log.endTime || Date.now()) - log.startTime) / 1000);
      if (log.type === 'toilet') toiletSeconds += durationSec;
      if (log.type === 'lunch') lunchSeconds += durationSec;
      if (log.type === 'overtime') {
        const mult = log.rateMultiplier || config.overtimeMultiplier || 1.5;
        const durHours = durationSec / 3600;
        if (log.isUnpaidOT) {
          unpaidOtHours += durHours;
          unpaidOtLost += durHours * config.hourlyRate * mult;
        } else {
          otHours += durHours;
        }
      }
    }

    let status = 'Work Day';
    if (dayStats.leaveStatus) {
      status = `${dayStats.leaveStatus.type.toUpperCase()}: ${dayStats.leaveStatus.title}`;
    } else if (!dayStats.isWorkDay) {
      status = 'Rest Day';
    }

    rows.push({
      dateStr: dateKey,
      dayName: dayNames[dayOfWeek],
      status,
      scheduledHours: Number(dayStats.scheduledWorkHours.toFixed(1)),
      baseEarned: dayStats.baseEarned,
      toiletTimeMin: Math.round(toiletSeconds / 60),
      toiletImpact: dayStats.toiletImpact,
      lunchTimeMin: Math.round(lunchSeconds / 60),
      overtimeHours: Number(otHours.toFixed(2)),
      overtimeEarned: dayStats.overtimeEarned,
      unpaidOtHours: Number(unpaidOtHours.toFixed(2)),
      unpaidOtLost,
      bonusEarned: dayStats.bonusEarned,
      netEarned: dayStats.netEarned,
    });

    totalHours += dayStats.scheduledWorkHours + otHours;
    totalBase += dayStats.baseEarned;
    totalOt += dayStats.overtimeEarned;
    totalUnpaidOtLost += unpaidOtLost;
    totalBonus += dayStats.bonusEarned;
    totalNet += dayStats.netEarned;
    if (dayStats.toiletImpact > 0) totalToiletEarned += dayStats.toiletImpact;

    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    rows,
    totals: {
      hours: Number(totalHours.toFixed(1)),
      base: totalBase,
      ot: totalOt,
      unpaidOtLost: totalUnpaidOtLost,
      bonus: totalBonus,
      net: totalNet,
      toiletEarned: totalToiletEarned,
    },
  };
}

export function exportToCSV(
  rows: DailyReportRow[],
  totals: {
    hours: number;
    base: number;
    ot: number;
    unpaidOtLost: number;
    bonus: number;
    net: number;
    toiletEarned: number;
  },
  currencyCode: string
): void {
  const headers = [
    'Date',
    'Day',
    'Status',
    'Scheduled Hours',
    'Base Salary Earned',
    'Toilet Time (min)',
    'Toilet Earnings Impact',
    'Lunch Time (min)',
    'Paid OT Hours',
    'Paid Overtime Pay',
    'Unpaid OT Hours (Lost)',
    'Unpaid OT Lost Income',
    'Prorated Bonus',
    'Net Total Earned',
  ];

  const csvRows = [headers.join(',')];

  rows.forEach((row) => {
    const line = [
      `"${row.dateStr}"`,
      `"${row.dayName}"`,
      `"${row.status}"`,
      row.scheduledHours,
      row.baseEarned.toFixed(2),
      row.toiletTimeMin,
      row.toiletImpact.toFixed(2),
      row.lunchTimeMin,
      row.overtimeHours.toFixed(2),
      row.overtimeEarned.toFixed(2),
      row.unpaidOtHours.toFixed(2),
      row.unpaidOtLost.toFixed(2),
      row.bonusEarned.toFixed(2),
      row.netEarned.toFixed(2),
    ];
    csvRows.push(line.join(','));
  });

  // Summary Row
  csvRows.push('');
  csvRows.push(
    [
      `"TOTALS"`,
      `""`,
      `""`,
      totals.hours,
      totals.base.toFixed(2),
      `""`,
      totals.toiletEarned.toFixed(2),
      `""`,
      `""`,
      totals.ot.toFixed(2),
      `""`,
      totals.unpaidOtLost.toFixed(2),
      totals.bonus.toFixed(2),
      totals.net.toFixed(2),
    ].join(',')
  );

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `Earnings_Timesheet_Report_${formatDateKey(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(
  rows: DailyReportRow[],
  totals: {
    hours: number;
    base: number;
    ot: number;
    unpaidOtLost: number;
    bonus: number;
    net: number;
    toiletEarned: number;
  },
  config: UserSalaryConfig
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('REAL-TIME EARNINGS & TIMESHEET STATEMENT', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 25);
  doc.text(`Base Rate: ${formatCurrency(config.hourlyRate, config.currency)}/hr | Overtime Multiplier: ${config.overtimeMultiplier}x`, 14, 30);

  // Summary KPI Cards (4 Cards)
  const startY = 46;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startY, 43, 20, 2, 2, 'FD');
  doc.roundedRect(59, startY, 43, 20, 2, 2, 'FD');
  doc.roundedRect(104, startY, 43, 20, 2, 2, 'FD');
  doc.roundedRect(149, startY, 47, 20, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.text('TOTAL NET EARNED', 17, startY + 5);
  doc.text('SCHEDULED + OT', 62, startY + 5);
  doc.text('PAID OVERTIME', 107, startY + 5);
  doc.text('UNPAID OT (LOST)', 152, startY + 5);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(formatCurrency(totals.net, config.currency), 17, startY + 14);
  doc.text(`${totals.hours} hrs`, 62, startY + 14);
  doc.text(formatCurrency(totals.ot, config.currency), 107, startY + 14);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(`-${formatCurrency(totals.unpaidOtLost, config.currency)}`, 152, startY + 14);

  // Table Header
  let y = 74;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, pageWidth - 28, 7, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');

  doc.text('Date', 16, y);
  doc.text('Day', 34, y);
  doc.text('Status', 46, y);
  doc.text('Hours', 84, y);
  doc.text('Base Pay', 100, y);
  doc.text('Paid OT', 124, y);
  doc.text('Unpaid OT (Lost)', 146, y);
  doc.text('Net Total', 178, y);

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  rows.forEach((row, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y - 5, pageWidth - 28, 7, 'F');
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'bold');
      doc.text('Date', 16, y);
      doc.text('Day', 34, y);
      doc.text('Status', 46, y);
      doc.text('Hours', 84, y);
      doc.text('Base Pay', 100, y);
      doc.text('Paid OT', 124, y);
      doc.text('Unpaid OT (Lost)', 146, y);
      doc.text('Net Total', 178, y);
      y += 5.5;
      doc.setFont('helvetica', 'normal');
    }

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, pageWidth - 28, 5.5, 'F');
    }

    doc.setTextColor(30, 41, 59);
    doc.text(row.dateStr, 16, y);
    doc.text(row.dayName, 34, y);

    const truncatedStatus = row.status.length > 18 ? row.status.substring(0, 16) + '..' : row.status;
    doc.text(truncatedStatus, 46, y);
    doc.text(`${row.scheduledHours}h`, 84, y);
    doc.text(formatCurrency(row.baseEarned, config.currency), 100, y);
    doc.text(row.overtimeEarned > 0 ? formatCurrency(row.overtimeEarned, config.currency) : '-', 124, y);

    if (row.unpaidOtLost > 0) {
      doc.setTextColor(225, 29, 72);
      doc.text(`-${formatCurrency(row.unpaidOtLost, config.currency)}`, 146, y);
      doc.setTextColor(30, 41, 59);
    } else {
      doc.text('-', 146, y);
    }

    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(row.netEarned, config.currency), 178, y);
    doc.setFont('helvetica', 'normal');

    y += 5.5;
  });

  // Footer Totals
  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y - 2, pageWidth - 14, y - 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTAL STATEMENT EARNINGS:', 14, y + 4);
  doc.setTextColor(16, 185, 129);
  doc.text(formatCurrency(totals.net, config.currency), 178, y + 4);

  if (totals.unpaidOtLost > 0) {
    y += 6;
    doc.setTextColor(225, 29, 72);
    doc.setFontSize(8);
    doc.text(`TOTAL UNPAID OVERTIME WAGE LOSS: -${formatCurrency(totals.unpaidOtLost, config.currency)}`, 14, y + 3);
  }

  doc.save(`Earnings_Timesheet_Report_${formatDateKey(new Date())}.pdf`);
}
