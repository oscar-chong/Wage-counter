import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroEarnings } from './components/HeroEarnings';
import { QuickBreakTracker } from './components/QuickBreakTracker';
import { LogsTimeline } from './components/LogsTimeline';
import { WidgetSimulator } from './components/WidgetSimulator';
import { SalarySettings } from './components/SalarySettings';
import { ScheduleSettings } from './components/ScheduleSettings';
import { LeaveCalendar } from './components/LeaveCalendar';
import { ReportsModal } from './components/ReportsModal';
import { IOSExportModal } from './components/IOSExportModal';
import {
  ActivityType,
  DaySchedule,
  LeaveDay,
  TimeLog,
  UserSalaryConfig,
} from './types';
import {
  loadLeaves,
  loadLogs,
  loadSalaryConfig,
  loadWeeklySchedule,
  saveLeaves,
  saveLogs,
  saveSalaryConfig,
  saveWeeklySchedule,
} from './utils/storage';

export default function App() {
  const [config, setConfig] = useState<UserSalaryConfig>(loadSalaryConfig);
  const [schedules, setSchedules] = useState<DaySchedule[]>(loadWeeklySchedule);
  const [leaves, setLeaves] = useState<LeaveDay[]>(loadLeaves);
  const [logs, setLogs] = useState<TimeLog[]>(loadLogs);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeActivity, setActiveActivity] = useState<ActivityType | null>(null);

  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Persistence hooks
  const handleUpdateConfig = (newConfig: UserSalaryConfig) => {
    setConfig(newConfig);
    saveSalaryConfig(newConfig);
  };

  const handleUpdateSchedules = (newSchedules: DaySchedule[]) => {
    setSchedules(newSchedules);
    saveWeeklySchedule(newSchedules);
  };

  const handleUpdateLeaves = (newLeaves: LeaveDay[]) => {
    setLeaves(newLeaves);
    saveLeaves(newLeaves);
  };

  const handleAddLog = (newLog: TimeLog) => {
    const updated = [newLog, ...logs];
    setLogs(updated);
    saveLogs(updated);
  };

  const handleDeleteLog = (id: string) => {
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    saveLogs(updated);
  };

  const handleClearLogs = () => {
    setLogs([]);
    saveLogs([]);
  };

  const handleTriggerQuickBreak = (type: ActivityType) => {
    setActiveTab('dashboard');
    setActiveActivity(type);
  };

  const [snapshots, setSnapshots] = useState<import('./types').RecordedSnapshot[]>(() => {
    return (
      (typeof window !== 'undefined' &&
        JSON.parse(localStorage.getItem('ios_wage_recorded_snapshots') || '[]')) ||
      []
    );
  });

  const handleRecordSnapshot = (newSnap: import('./types').RecordedSnapshot) => {
    const updated = [newSnap, ...snapshots];
    setSnapshots(updated);
    try {
      localStorage.setItem('ios_wage_recorded_snapshots', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    const updated = snapshots.filter((s) => s.id !== id);
    setSnapshots(updated);
    try {
      localStorage.setItem('ios_wage_recorded_snapshots', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Bar adhering to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenReportsModal={() => setIsReportsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* TAB 1: DASHBOARD (Home Page with Large Money Earner) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* The Large Money Earner Card */}
            <HeroEarnings
              config={config}
              schedules={schedules}
              leaves={leaves}
              logs={logs}
              activeActivity={activeActivity}
              onRecordSnapshot={handleRecordSnapshot}
            />

            {/* Quick Action Triggers for Toilet, Lunch, and Overtime */}
            <QuickBreakTracker
              config={config}
              logs={logs}
              onAddLog={handleAddLog}
              activeActivity={activeActivity}
              setActiveActivity={setActiveActivity}
            />

            {/* Timeline of Recorded Sessions & Snapshots */}
            <LogsTimeline
              logs={logs}
              snapshots={snapshots}
              config={config}
              onDeleteLog={handleDeleteLog}
              onDeleteSnapshot={handleDeleteSnapshot}
              onClearLogs={handleClearLogs}
            />
          </div>
        )}

        {/* TAB 2: WIDGET SIMULATOR */}
        {activeTab === 'widgets' && (
          <div className="animate-in fade-in duration-200">
            <WidgetSimulator
              config={config}
              schedules={schedules}
              leaves={leaves}
              logs={logs}
              activeActivity={activeActivity}
              onTriggerQuickBreak={handleTriggerQuickBreak}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          </div>
        )}

        {/* TAB 3: CALENDAR & LEAVES */}
        {activeTab === 'calendar' && (
          <div className="animate-in fade-in duration-200">
            <LeaveCalendar
              leaves={leaves}
              onSaveLeaves={handleUpdateLeaves}
            />
          </div>
        )}

        {/* TAB 4: SALARY & SCHEDULE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <SalarySettings
              config={config}
              schedules={schedules}
              onSaveConfig={handleUpdateConfig}
            />

            <ScheduleSettings
              schedules={schedules}
              onSaveSchedules={handleUpdateSchedules}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0c13] py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">WageTicker iOS</span>
            <span>·</span>
            <span>Real-time salary calculation engine & iOS Widget</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Export .IPA Package
            </button>
            <span>·</span>
            <button
              onClick={() => setIsReportsModalOpen(true)}
              className="hover:text-blue-400 transition-colors"
            >
              Download Daily PDF / CSV Report
            </button>
          </div>
        </div>
      </footer>

      {/* Daily Reports Modal */}
      <ReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        config={config}
        schedules={schedules}
        leaves={leaves}
        logs={logs}
      />

      {/* iOS .IPA & Swift Source Code Export Modal */}
      <IOSExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        config={config}
        schedules={schedules}
      />
    </div>
  );
}
