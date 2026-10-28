import { DaySchedule, LeaveDay, TimeLog, UserSalaryConfig } from '../types';

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AU$)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar (HK$)' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (S$)' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc (CHF)' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar (NZ$)' },
];

export function getCurrencySymbol(code: string): string {
  const found = CURRENCIES.find((c) => c.code === code);
  return found ? found.symbol : '$';
}

/**
 * Calculates total weekly working hours based on day schedules
 */
export function calculateWeeklyWorkingHours(schedule: DaySchedule[]): number {
  return schedule.reduce((total, day) => {
    if (!day.isWorkDay) return total;
    const [startH, startM] = day.startTime.split(':').map(Number);
    const [endH, endM] = day.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const rawMinutes = Math.max(0, endMinutes - startMinutes);
    const netMinutes = Math.max(0, rawMinutes - (day.lunchBreakMinutes || 0));
    return total + netMinutes / 60;
  }, 0) || 40; // fallback to 40 if 0
}

/**
 * Recalculate salary figures to keep hourly, monthly, and yearly in sync
 */
export function syncSalaries(
  changedField: 'hourly' | 'monthly' | 'yearly',
  value: number,
  weeklyHours: number
): { hourlyRate: number; monthlySalary: number; yearlySalary: number } {
  const annualHours = Math.max(1, weeklyHours * 52);
  let hourlyRate = 0;
  let monthlySalary = 0;
  let yearlySalary = 0;

  if (changedField === 'hourly') {
    hourlyRate = Math.max(0, value);
    yearlySalary = hourlyRate * annualHours;
    monthlySalary = yearlySalary / 12;
  } else if (changedField === 'monthly') {
    monthlySalary = Math.max(0, value);
    yearlySalary = monthlySalary * 12;
    hourlyRate = yearlySalary / annualHours;
  } else {
    yearlySalary = Math.max(0, value);
    monthlySalary = yearlySalary / 12;
    hourlyRate = yearlySalary / annualHours;
  }

  return {
    hourlyRate: Number(hourlyRate.toFixed(2)),
    monthlySalary: Number(monthlySalary.toFixed(2)),
    yearlySalary: Number(yearlySalary.toFixed(2)),
  };
}

/**
 * Calculate annual bonus amount
 */
export function getAnnualBonusAmount(config: UserSalaryConfig): number {
  if (config.bonusType === 'percentage') {
    return (config.yearlySalary * (config.bonusValue || 0)) / 100;
  }
  return config.bonusValue || 0;
}

/**
 * Calculate effective hourly rate including prorated bonus
 */
export function getEffectiveHourlyRate(
  config: UserSalaryConfig,
  weeklyHours: number
): number {
  const annualBonus = getAnnualBonusAmount(config);
  const annualHours = Math.max(1, weeklyHours * 52);
  const bonusPerHour = annualBonus / annualHours;
  return config.hourlyRate + bonusPerHour;
}

/**
 * Format date to "YYYY-MM-DD"
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date string is in the leave list
 */
export function getLeaveForDate(dateStr: string, leaves: LeaveDay[]): LeaveDay | undefined {
  return leaves.find((l) => l.dateStr === dateStr);
}

/**
 * Calculate today's working schedule bounds
 */
export function getDayScheduleBounds(
  date: Date,
  daySchedule: DaySchedule
): { startMs: number; endMs: number; workSeconds: number } {
  const [startH, startM] = daySchedule.startTime.split(':').map(Number);
  const [endH, endM] = daySchedule.endTime.split(':').map(Number);

  const start = new Date(date);
  start.setHours(startH, startM, 0, 0);

  const end = new Date(date);
  end.setHours(endH, endM, 0, 0);

  const grossSeconds = Math.max(0, (end.getTime() - start.getTime()) / 1000);
  const breakSeconds = (daySchedule.lunchBreakMinutes || 0) * 60;
  const workSeconds = Math.max(0, grossSeconds - breakSeconds);

  return {
    startMs: start.getTime(),
    endMs: end.getTime(),
    workSeconds,
  };
}

/**
 * Calculate earnings for an individual day
 */
export function calculateDayEarnings(
  targetDate: Date,
  config: UserSalaryConfig,
  schedules: DaySchedule[],
  leaves: LeaveDay[],
  logs: TimeLog[],
  nowMs: number = Date.now()
): {
  baseEarned: number;
  overtimeEarned: number;
  unpaidOtHours: number;
  unpaidOtLost: number;
  toiletImpact: number;
  lunchImpact: number;
  bonusEarned: number;
  netEarned: number;
  scheduledWorkHours: number;
  workedSecondsToday: number;
  isWorkDay: boolean;
  leaveStatus?: LeaveDay;
  isCompletedDay: boolean;
} {
  const dateKey = formatDateKey(targetDate);
  const dayOfWeek = targetDate.getDay();
  const daySchedule = schedules.find((s) => s.dayOfWeek === dayOfWeek) || schedules[1];
  const leave = getLeaveForDate(dateKey, leaves);

  const weeklyHours = calculateWeeklyWorkingHours(schedules);
  const effectiveHourly = getEffectiveHourlyRate(config, weeklyHours);
  const baseHourly = config.hourlyRate;
  const perSecondRate = baseHourly / 3600;
  const bonusPerSecondRate = (getAnnualBonusAmount(config) / (weeklyHours * 52)) / 3600;

  // Check if target day is before today (already passed), today, or future
  const startOfTarget = new Date(targetDate);
  startOfTarget.setHours(0, 0, 0, 0);
  const endOfTarget = new Date(targetDate);
  endOfTarget.setHours(23, 59, 59, 999);

  const isToday =
    formatDateKey(new Date(nowMs)) === dateKey;
  const isPast = endOfTarget.getTime() < nowMs && !isToday;

  const { startMs, endMs, workSeconds } = getDayScheduleBounds(targetDate, daySchedule);
  const scheduledWorkHours = workSeconds / 3600;

  let workedSecondsToday = 0;
  let baseEarned = 0;
  let bonusEarned = 0;

  const isWorkDay = daySchedule.isWorkDay && (!leave || leave.isPaid);

  if (leave) {
    if (leave.isPaid) {
      // Paid leave (e.g. Paid Annual Leave / Paid Holiday) gets full scheduled day earnings
      baseEarned = scheduledWorkHours * baseHourly;
      bonusEarned = scheduledWorkHours * (bonusPerSecondRate * 3600);
      workedSecondsToday = workSeconds;
    } else {
      // Unpaid leave = 0
      baseEarned = 0;
      bonusEarned = 0;
      workedSecondsToday = 0;
    }
  } else if (!daySchedule.isWorkDay) {
    // Rest day
    baseEarned = 0;
    bonusEarned = 0;
    workedSecondsToday = 0;
  } else {
    // Regular work day
    if (isPast) {
      workedSecondsToday = workSeconds;
      baseEarned = scheduledWorkHours * baseHourly;
      bonusEarned = scheduledWorkHours * (bonusPerSecondRate * 3600);
    } else if (isToday) {
      if (nowMs <= startMs) {
        workedSecondsToday = 0;
      } else if (nowMs >= endMs) {
        workedSecondsToday = workSeconds;
      } else {
        const elapsedGross = (nowMs - startMs) / 1000;
        // Proportionally exclude lunch
        const totalGross = (endMs - startMs) / 1000;
        const ratio = totalGross > 0 ? Math.min(1, elapsedGross / totalGross) : 0;
        workedSecondsToday = Math.max(0, ratio * workSeconds);
      }
      baseEarned = workedSecondsToday * perSecondRate;
      bonusEarned = workedSecondsToday * bonusPerSecondRate;
    } else {
      // Future day
      workedSecondsToday = 0;
      baseEarned = 0;
      bonusEarned = 0;
    }
  }

  // Filter logs for this specific day
  const dayLogs = logs.filter((log) => {
    const logDate = new Date(log.startTime);
    return formatDateKey(logDate) === dateKey;
  });

  let overtimeEarned = 0;
  let unpaidOtHours = 0;
  let unpaidOtLost = 0;
  let toiletImpact = 0;
  let lunchImpact = 0;

  for (const log of dayLogs) {
    const logEnd = log.endTime || (isToday ? nowMs : log.startTime);
    const durationSeconds = Math.max(0, (logEnd - log.startTime) / 1000);
    const durationHours = durationSeconds / 3600;

    if (log.type === 'overtime') {
      const multiplier = log.rateMultiplier || config.overtimeMultiplier || 1.5;
      const otPay = durationHours * baseHourly * multiplier;
      if (log.isUnpaidOT) {
        unpaidOtHours += durationHours;
        unpaidOtLost += otPay;
      } else {
        overtimeEarned += otPay;
      }
    } else if (log.type === 'toilet') {
      const toiletPay = durationHours * baseHourly;
      if (config.toiletIsPaid) {
        // Toilet is paid (we earned while pooping!)
        toiletImpact += toiletPay;
      } else {
        // Deduction
        toiletImpact -= toiletPay;
      }
    } else if (log.type === 'lunch') {
      const lunchPay = durationHours * baseHourly;
      if (config.lunchIsPaid) {
        lunchImpact += lunchPay;
      } else {
        // Unpaid
        lunchImpact -= lunchPay;
      }
    }
  }

  const netEarned = baseEarned + bonusEarned + overtimeEarned;

  return {
    baseEarned,
    overtimeEarned,
    unpaidOtHours,
    unpaidOtLost,
    toiletImpact,
    lunchImpact,
    bonusEarned,
    netEarned,
    scheduledWorkHours,
    workedSecondsToday,
    isWorkDay,
    leaveStatus: leave,
    isCompletedDay: isPast,
  };
}

/**
 * Calculates earnings for current day, week, month, year, or unpaid overtime
 */
export function calculateAccumulatedEarnings(
  period: 'day' | 'week' | 'month' | 'year' | 'unpaid_ot',
  config: UserSalaryConfig,
  schedules: DaySchedule[],
  leaves: LeaveDay[],
  logs: TimeLog[],
  now: Date = new Date()
): {
  amount: number;
  periodLabel: string;
  hourlyRate: number;
  currentSecondRate: number;
  isClockActive: boolean;
  totalHours: number;
  isLoss?: boolean;
} {
  const nowMs = now.getTime();
  const weeklyHours = calculateWeeklyWorkingHours(schedules);
  const effectiveHourly = getEffectiveHourlyRate(config, weeklyHours);
  const perSecondRate = effectiveHourly / 3600;

  // If calculating Unpaid Overtime (Lost Income)
  if (period === 'unpaid_ot') {
    let totalUnpaidHours = 0;
    let totalUnpaidLost = 0;

    for (const log of logs) {
      if (log.type === 'overtime' && log.isUnpaidOT) {
        const logEnd = log.endTime || nowMs;
        const durationSeconds = Math.max(0, (logEnd - log.startTime) / 1000);
        const durationHours = durationSeconds / 3600;
        const multiplier = log.rateMultiplier || config.overtimeMultiplier || 1.5;
        const lost = durationHours * config.hourlyRate * multiplier;
        totalUnpaidHours += durationHours;
        totalUnpaidLost += lost;
      }
    }

    return {
      amount: totalUnpaidLost,
      periodLabel: "Unpaid OT (Lost Income)",
      hourlyRate: config.hourlyRate * config.overtimeMultiplier,
      currentSecondRate: 0,
      isClockActive: false,
      totalHours: totalUnpaidHours,
      isLoss: true,
    };
  }

  // Check if currently on the clock right now
  const todayDayOfWeek = now.getDay();
  const todaySchedule = schedules.find((s) => s.dayOfWeek === todayDayOfWeek) || schedules[1];
  const todayLeave = getLeaveForDate(formatDateKey(now), leaves);
  const { startMs, endMs } = getDayScheduleBounds(now, todaySchedule);
  const isClockActive =
    todaySchedule.isWorkDay &&
    !todayLeave &&
    nowMs >= startMs &&
    nowMs <= endMs;

  if (period === 'day') {
    const dayStats = calculateDayEarnings(now, config, schedules, leaves, logs, nowMs);
    return {
      amount: dayStats.netEarned,
      periodLabel: "Today's Earnings",
      hourlyRate: effectiveHourly,
      currentSecondRate: isClockActive ? perSecondRate : 0,
      isClockActive,
      totalHours: dayStats.workedSecondsToday / 3600,
    };
  }

  // Calculate start date of the period
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  if (period === 'week') {
    // Start of week: Monday
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    startDate.setDate(now.getDate() - distanceToMonday);
  } else if (period === 'month') {
    // 1st day of month
    startDate.setDate(1);
  } else if (period === 'year') {
    // Jan 1st
    startDate.setMonth(0, 1);
  }

  let totalAmount = 0;
  let totalHours = 0;
  const cursor = new Date(startDate);

  // Iterate day by day from startDate to today
  while (cursor.getTime() <= nowMs) {
    const isToday = formatDateKey(cursor) === formatDateKey(now);
    const dayStats = calculateDayEarnings(
      new Date(cursor),
      config,
      schedules,
      leaves,
      logs,
      isToday ? nowMs : cursor.getTime() + 86400000 - 1000
    );

    totalAmount += dayStats.netEarned;
    totalHours += dayStats.workedSecondsToday / 3600;
    cursor.setDate(cursor.getDate() + 1);
  }

  const labels: Record<string, string> = {
    day: "Today's Earnings",
    week: "This Week's Earnings",
    month: "This Month's Earnings",
    year: "This Year's Earnings",
    unpaid_ot: "Unpaid OT (Lost Income)",
  };

  return {
    amount: totalAmount,
    periodLabel: labels[period] || "Today's Earnings",
    hourlyRate: effectiveHourly,
    currentSecondRate: isClockActive ? perSecondRate : 0,
    isClockActive,
    totalHours,
  };
}

/**
 * Format currency with customizable decimal precision
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  decimals: number = 2
): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${symbol}${formatted}`;
}
