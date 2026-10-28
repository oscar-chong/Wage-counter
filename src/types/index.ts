export type SalaryType = 'hourly' | 'monthly' | 'yearly';

export type BonusType = 'percentage' | 'fixed';

export type LeaveType = 'annual' | 'special' | 'holiday';

export type ActivityType = 'toilet' | 'lunch' | 'overtime';

export type DisplayPeriod = 'day' | 'week' | 'month' | 'year' | 'unpaid_ot';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  name: string;
  isWorkDay: boolean;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  lunchBreakMinutes: number; // e.g. 60
}

export interface LeaveDay {
  dateStr: string; // "YYYY-MM-DD"
  type: LeaveType;
  title: string;
  isPaid: boolean; // default true for AL / PH
}

export interface TimeLog {
  id: string;
  type: ActivityType;
  startTime: number; // timestamp ms
  endTime?: number;   // timestamp ms
  notes?: string;
  rateMultiplier?: number; // e.g. 1.5 for overtime
  isPaid?: boolean; // for toilet/lunch
  isUnpaidOT?: boolean; // true if overtime is unpaid (lost income)
  calculatedAmount?: number;
}

export interface RecordedSnapshot {
  id: string;
  timestamp: number;
  period: DisplayPeriod;
  periodLabel: string;
  amount: number;
  currency: string;
  note?: string;
}

export interface UserSalaryConfig {
  salaryType: SalaryType;
  hourlyRate: number;
  monthlySalary: number;
  yearlySalary: number;
  currency: string;
  bonusType: BonusType;
  bonusValue: number; // percentage (e.g. 10) or fixed annual amount (e.g. 5000)
  toiletIsPaid: boolean;
  lunchIsPaid: boolean;
  overtimeMultiplier: number; // default 1.5
  workingDaysPerYear: number;
}
