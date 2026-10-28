import React, { useState } from 'react';
import { DollarSign, Percent, RefreshCw, Sparkles, Check, Settings2 } from 'lucide-react';
import { BonusType, DaySchedule, SalaryType, UserSalaryConfig } from '../types';
import {
  calculateWeeklyWorkingHours,
  CURRENCIES,
  formatCurrency,
  getAnnualBonusAmount,
  getEffectiveHourlyRate,
  syncSalaries,
} from '../utils/calculations';

interface SalarySettingsProps {
  config: UserSalaryConfig;
  schedules: DaySchedule[];
  onSaveConfig: (newConfig: UserSalaryConfig) => void;
}

export const SalarySettings: React.FC<SalarySettingsProps> = ({
  config,
  schedules,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<UserSalaryConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  const weeklyHours = calculateWeeklyWorkingHours(schedules);

  const handleSalaryChange = (field: 'hourly' | 'monthly' | 'yearly', valStr: string) => {
    const num = parseFloat(valStr) || 0;
    const synced = syncSalaries(field, num, weeklyHours);
    const updated: UserSalaryConfig = {
      ...formData,
      salaryType: field,
      hourlyRate: synced.hourlyRate,
      monthlySalary: synced.monthlySalary,
      yearlySalary: synced.yearlySalary,
    };
    setFormData(updated);
    onSaveConfig(updated);
    showSavedBadge();
  };

  const handleBonusTypeChange = (type: BonusType) => {
    const updated: UserSalaryConfig = {
      ...formData,
      bonusType: type,
      // Default sample values when switching
      bonusValue: type === 'percentage' ? 10 : 5000,
    };
    setFormData(updated);
    onSaveConfig(updated);
    showSavedBadge();
  };

  const handleBonusValueChange = (valStr: string) => {
    const num = parseFloat(valStr) || 0;
    const updated: UserSalaryConfig = {
      ...formData,
      bonusValue: num,
    };
    setFormData(updated);
    onSaveConfig(updated);
    showSavedBadge();
  };

  const handleCurrencyChange = (currencyCode: string) => {
    const updated: UserSalaryConfig = {
      ...formData,
      currency: currencyCode,
    };
    setFormData(updated);
    onSaveConfig(updated);
    showSavedBadge();
  };

  const handleToggle = (key: 'toiletIsPaid' | 'lunchIsPaid') => {
    const updated: UserSalaryConfig = {
      ...formData,
      [key]: !formData[key],
    };
    setFormData(updated);
    onSaveConfig(updated);
    showSavedBadge();
  };

  const handleOvertimeChange = (multiplier: number) => {
    const updated: UserSalaryConfig = {
      ...formData,
      overtimeMultiplier: multiplier,
    };
    setFormData(updated);
    onSaveConfig(updated);
    showSavedBadge();
  };

  const showSavedBadge = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const annualBonus = getAnnualBonusAmount(formData);
  const effectiveHourly = getEffectiveHourlyRate(formData, weeklyHours);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Salary & Compensation Settings</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronize hourly, monthly, or yearly pay. All 3 auto-calculate dynamically based on your {weeklyHours}h/week schedule.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Auto-Saved</span>
          </div>
        )}
      </div>

      {/* 1. Currency & Primary Inputs */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
        {/* Currency Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Earning Currency
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {CURRENCIES.map((curr) => (
              <button
                key={curr.code}
                type="button"
                onClick={() => handleCurrencyChange(curr.code)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                  formData.currency === curr.code
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-white'
                }`}
              >
                <span className="font-mono font-bold mr-1">{curr.symbol}</span>
                <span>{curr.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3 Synced Salary Inputs: Hourly, Monthly, Yearly */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Hourly */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 focus-within:border-emerald-500/80 transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>Hourly Rate</span>
              <span className="text-[10px] text-emerald-400 font-mono">/ hour</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-500 font-mono text-sm">
                {formData.currency}
              </span>
              <input
                type="number"
                step="0.25"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) => handleSalaryChange('hourly', e.target.value)}
                className="w-full pl-14 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-white font-mono font-bold text-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5">
              ~${(formData.hourlyRate / 60).toFixed(3)}/min · ${(formData.hourlyRate / 3600).toFixed(4)}/sec
            </div>
          </div>

          {/* Monthly */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 focus-within:border-emerald-500/80 transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>Monthly Salary</span>
              <span className="text-[10px] text-teal-400 font-mono">/ month</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-500 font-mono text-sm">
                {formData.currency}
              </span>
              <input
                type="number"
                step="50"
                min="0"
                value={formData.monthlySalary}
                onChange={(e) => handleSalaryChange('monthly', e.target.value)}
                className="w-full pl-14 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-white font-mono font-bold text-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5">
              12 salary periods per year
            </div>
          </div>

          {/* Yearly */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 focus-within:border-emerald-500/80 transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>Yearly Salary</span>
              <span className="text-[10px] text-blue-400 font-mono">/ year</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-500 font-mono text-sm">
                {formData.currency}
              </span>
              <input
                type="number"
                step="500"
                min="0"
                value={formData.yearlySalary}
                onChange={(e) => handleSalaryChange('yearly', e.target.value)}
                className="w-full pl-14 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-white font-mono font-bold text-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5">
              Based on {weeklyHours * 52} annual work hours
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bonus Section */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Bonus & Performance Incentive</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Add bonus as a percentage of base pay or as a fixed annual amount.
            </p>
          </div>

          {/* Toggle Type */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleBonusTypeChange('percentage')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                formData.bonusType === 'percentage'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Percentage (%)
            </button>
            <button
              type="button"
              onClick={() => handleBonusTypeChange('fixed')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                formData.bonusType === 'fixed'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fixed Amount ($)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {formData.bonusType === 'percentage' ? 'Bonus Percentage of Base Pay (%)' : 'Fixed Bonus Amount (Annual)'}
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                step={formData.bonusType === 'percentage' ? '1' : '100'}
                min="0"
                value={formData.bonusValue}
                onChange={(e) => handleBonusValueChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-mono font-bold text-base focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-3.5 text-slate-400 font-semibold text-xs">
                {formData.bonusType === 'percentage' ? '%' : formData.currency}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex flex-col justify-center">
            <div className="text-amber-300 font-semibold">Prorated Bonus Impact</div>
            <div className="text-slate-300 mt-1">
              Annual Bonus: <span className="font-mono font-bold text-white">{formatCurrency(annualBonus, formData.currency)}</span>
            </div>
            <div className="text-slate-300">
              Effective Hourly Pay: <span className="font-mono font-bold text-emerald-300">${effectiveHourly.toFixed(2)}/hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Policies & Overtime Multiplier */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Settings2 className="w-4 h-4 text-emerald-400" />
          <span>Break Compensation & Overtime Multipliers</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Toilet Policy */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🚽 Toilet Time Compensation</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {formData.toiletIsPaid
                  ? 'Paid work time: Earn money while on the toilet!'
                  : 'Unpaid deduction: Deducts toilet minutes.'}
              </p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => handleToggle('toiletIsPaid')}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  formData.toiletIsPaid
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {formData.toiletIsPaid ? '✓ Paid Break (Earning)' : 'Unpaid Deduction'}
              </button>
            </div>
          </div>

          {/* Lunch Policy */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🥪 Lunch Hour Status</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {formData.lunchIsPaid
                  ? 'Paid lunch: Included in working hour pay.'
                  : 'Standard unpaid meal break (deducted from shift).'}
              </p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => handleToggle('lunchIsPaid')}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  formData.lunchIsPaid
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {formData.lunchIsPaid ? '✓ Paid Lunch' : 'Unpaid Lunch Break'}
              </button>
            </div>
          </div>

          {/* Overtime Multiplier */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>⚡ Overtime Multiplier</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Rate applied during extra overtime hours.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-1.5">
              {[1.25, 1.5, 2.0].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleOvertimeChange(rate)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    formData.overtimeMultiplier === rate
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
