import React from 'react';
import { Download, FileText, Smartphone } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenExportModal: () => void;
  onOpenReportsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenExportModal,
  onOpenReportsModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0c0e15]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-base">
            $
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            WageTicker <span className="text-emerald-400 font-semibold text-xs tracking-normal border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 rounded-md ml-1">iOS Widget</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-xs font-semibold text-slate-300">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'hover:text-white hover:bg-slate-800/50 text-slate-400'
            }`}
          >
            Earnings & Breaks
          </button>
          <button
            onClick={() => setActiveTab('widgets')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'widgets'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'hover:text-white hover:bg-slate-800/50 text-slate-400'
            }`}
          >
            iOS Widget Simulator
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'hover:text-white hover:bg-slate-800/50 text-slate-400'
            }`}
          >
            Calendar & Leaves
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'hover:text-white hover:bg-slate-800/50 text-slate-400'
            }`}
          >
            Salary & Schedule
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenReportsModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700/80 rounded-xl transition-all whitespace-nowrap active:scale-95"
            title="Generate Daily CSV / PDF Report"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Daily</span> Reports
          </button>

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap active:scale-95"
            title="Download iOS .ipa & Swift Project"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>.IPA / Widget Code</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab bar row */}
      <div className="flex md:hidden items-center justify-around gap-1 mt-2.5 pt-2 border-t border-slate-800/60 overflow-x-auto text-[11px] font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-1 px-2.5 rounded-md whitespace-nowrap ${activeTab === 'dashboard' ? 'text-emerald-400 bg-slate-800 font-semibold' : ''}`}
        >
          Earnings
        </button>
        <button
          onClick={() => setActiveTab('widgets')}
          className={`py-1 px-2.5 rounded-md whitespace-nowrap ${activeTab === 'widgets' ? 'text-emerald-400 bg-slate-800 font-semibold' : ''}`}
        >
          iOS Widgets
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`py-1 px-2.5 rounded-md whitespace-nowrap ${activeTab === 'calendar' ? 'text-emerald-400 bg-slate-800 font-semibold' : ''}`}
        >
          Leaves
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-1 px-2.5 rounded-md whitespace-nowrap ${activeTab === 'settings' ? 'text-emerald-400 bg-slate-800 font-semibold' : ''}`}
        >
          Salary
        </button>
      </div>
    </header>
  );
};
