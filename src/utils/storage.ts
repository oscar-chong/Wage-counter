import { DaySchedule, LeaveDay, TimeLog, UserSalaryConfig } from '../types';
import { formatDateKey } from './calculations';

export const DEFAULT_SALARY_CONFIG: UserSalaryConfig = {
  salaryType: 'hourly',
  hourlyRate: 48.0,
  monthlySalary: 8320.0,
  yearlySalary: 99840.0,
  currency: 'USD',
  bonusType: 'percentage',
  bonusValue: 8.0, // 8% annual bonus
  toiletIsPaid: true,
  lunchIsPaid: false,
  overtimeMultiplier: 1.5,
  workingDaysPerYear: 260,
};

export const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 0, name: 'Sunday', isWorkDay: false, startTime: '09:00', endTime: '17:00', lunchBreakMinutes: 60 },
  { dayOfWeek: 1, name: 'Monday', isWorkDay: true, startTime: '09:00', endTime: '17:00', lunchBreakMinutes: 60 },
  { dayOfWeek: 2, name: 'Tuesday', isWorkDay: true, startTime: '09:00', endTime: '17:00', lunchBreakMinutes: 60 },
  { dayOfWeek: 3, name: 'Wednesday', isWorkDay: true, startTime: '09:00', endTime: '17:00', lunchBreakMinutes: 60 },
  { dayOfWeek: 4, name: 'Thursday', isWorkDay: true, startTime: '09:00', endTime: '17:00', lunchBreakMinutes: 60 },
  { dayOfWeek: 5, name: 'Friday', isWorkDay: true, startTime: '09:00', endTime: '17:00', lunchBreakMinutes: 60 },
  { dayOfWeek: 6, name: 'Saturday', isWorkDay: false, startTime: '09:00', endTime: '17:00', lunchBreakMinutes: 60 },
];

export function getDefaultLeaves(): LeaveDay[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Return a couple of sensible upcoming / default leaves
  const nextWeekLeave = new Date(year, month, today.getDate() + 4);
  const holiday = new Date(year, month, today.getDate() + 10);

  return [
    {
      dateStr: formatDateKey(nextWeekLeave),
      type: 'annual',
      title: 'Annual Vacation Day',
      isPaid: true,
    },
    {
      dateStr: formatDateKey(holiday),
      type: 'holiday',
      title: 'Public Holiday',
      isPaid: true,
    },
  ];
}

export function getDefaultLogs(): TimeLog[] {
  const now = Date.now();
  // 1 toilet break earlier today
  const toiletStart = now - 1000 * 60 * 18; // 18 mins ago
  const toiletEnd = now - 1000 * 60 * 5;   // ended 5 mins ago

  // 1 unpaid overtime session yesterday (lost income)
  const unpaidOtStart = now - 1000 * 60 * 60 * 26; // 26 hrs ago
  const unpaidOtEnd = unpaidOtStart + 1000 * 60 * 90; // 90 min (1.5h)

  return [
    {
      id: 'log-toilet-1',
      type: 'toilet',
      startTime: toiletStart,
      endTime: toiletEnd,
      notes: 'Paid to poop break 🚽',
      isPaid: true,
      calculatedAmount: 10.4,
    },
    {
      id: 'log-unpaid-ot-1',
      type: 'overtime',
      startTime: unpaidOtStart,
      endTime: unpaidOtEnd,
      notes: 'Unpaid crunch after shift (Lost Income)',
      isPaid: false,
      isUnpaidOT: true,
      rateMultiplier: 1.5,
      calculatedAmount: 108.0,
    },
  ];
}

const STORAGE_KEYS = {
  SALARY: 'ios_wage_salary_config',
  SCHEDULE: 'ios_wage_weekly_schedule',
  LEAVES: 'ios_wage_leaves',
  LOGS: 'ios_wage_logs',
  PERIOD: 'ios_wage_selected_period',
  SNAPSHOTS: 'ios_wage_recorded_snapshots',
};

export function loadSelectedPeriod(): import('../types').DisplayPeriod {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PERIOD);
    if (raw) return raw as import('../types').DisplayPeriod;
  } catch (e) {
    console.error('Failed to load selected period', e);
  }
  return 'day';
}

export function saveSelectedPeriod(period: import('../types').DisplayPeriod): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PERIOD, period);
  } catch (e) {
    console.error('Failed to save selected period', e);
  }
}

export function loadSnapshots(): import('../types').RecordedSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load snapshots', e);
  }
  return [];
}

export function saveSnapshots(snapshots: import('../types').RecordedSnapshot[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(snapshots));
  } catch (e) {
    console.error('Failed to save snapshots', e);
  }
}

export function loadSalaryConfig(): UserSalaryConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALARY);
    if (raw) return { ...DEFAULT_SALARY_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load salary config', e);
  }
  return DEFAULT_SALARY_CONFIG;
}

export function saveSalaryConfig(config: UserSalaryConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SALARY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save salary config', e);
  }
}

export function loadWeeklySchedule(): DaySchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load schedule', e);
  }
  return DEFAULT_WEEKLY_SCHEDULE;
}

export function saveWeeklySchedule(schedule: DaySchedule[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
  } catch (e) {
    console.error('Failed to save schedule', e);
  }
}

export function loadLeaves(): LeaveDay[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEAVES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load leaves', e);
  }
  return getDefaultLeaves();
}

export function saveLeaves(leaves: LeaveDay[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
  } catch (e) {
    console.error('Failed to save leaves', e);
  }
}

export function loadLogs(): TimeLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load logs', e);
  }
  return getDefaultLogs();
}

export function saveLogs(logs: TimeLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save logs', e);
  }
}
