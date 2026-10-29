import React from 'react';
import { Smartphone, Download, HelpCircle, Layers, CheckCircle2, Apple, Play } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DashboardInstallBannerProps {
  onOpenExportModal: () => void;
}

export const DashboardInstallBanner: React.FC<DashboardInstallBannerProps> = ({
  onOpenExportModal,
}) => {
  const { isInstallable, triggerInstall } = usePWAInstall();

  return (
    <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-teal-950/40 border border-emerald-500/30 p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Side: Description */}
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 shrink-0">
            <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Install WageTicker on Android & iPhone
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Offline & Widgets
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Get the APK for Android or .IPA for iOS. Add live ticking earnings directly to your phone&apos;s Home Screen with zero internet or cloud tracking.
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Direct Android APK Download */}
          <a
            href="/WageTicker.apk"
            download="WageTicker.apk"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer text-center"
            title="Directly download WageTicker.apk"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Download APK</span>
          </a>

          {/* Direct iOS IPA Download */}
          <a
            href="/WageTicker.ipa"
            download="WageTicker.ipa"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-all active:scale-95 cursor-pointer text-center"
            title="Directly download WageTicker.ipa"
          >
            <Apple className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span>Download .IPA</span>
          </a>

          {/* 1-Tap PWA / WebAPK button if supported */}
          {isInstallable && (
            <button
              onClick={triggerInstall}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-semibold text-xs border border-teal-500/40 transition-all active:scale-95 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>1-Tap Install</span>
            </button>
          )}

          {/* Full Instructions Modal Button */}
          <button
            onClick={onOpenExportModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-medium text-xs border border-slate-700/80 transition-all active:scale-95 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>Widget Guide & Source</span>
          </button>
        </div>
      </div>
    </div>
  );
};
