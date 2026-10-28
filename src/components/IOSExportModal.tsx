import React, { useState } from 'react';
import { Smartphone, Download, Copy, Check, Code, ShieldCheck, Terminal, X, ExternalLink, Zap, Layers } from 'lucide-react';
import { DaySchedule, UserSalaryConfig } from '../types';
import {
  createIPAPackage,
  generateMobileConfig,
  generateScriptableWidgetCode,
  generateSwiftAppCode,
  generateSwiftWidgetCode,
} from '../utils/iosPackageGenerator';

interface IOSExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserSalaryConfig;
  schedules: DaySchedule[];
}

type TabType = 'direct' | 'download' | 'scriptable' | 'swift';

export const IOSExportModal: React.FC<IOSExportModalProps> = ({
  isOpen,
  onClose,
  config,
  schedules,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('direct');
  const [copiedSwift, setCopiedSwift] = useState(false);
  const [copiedScriptable, setCopiedScriptable] = useState(false);
  const [isPackaging, setIsPackaging] = useState(false);

  if (!isOpen) return null;

  const swiftWidgetCode = generateSwiftWidgetCode(config, schedules);
  const swiftAppCode = generateSwiftAppCode(config);
  const scriptableCode = generateScriptableWidgetCode(config);

  const handleCopySwift = () => {
    navigator.clipboard.writeText(`${swiftAppCode}\n\n// ====================================\n// WIDGET EXTENSION\n// ====================================\n\n${swiftWidgetCode}`);
    setCopiedSwift(true);
    setTimeout(() => setCopiedSwift(false), 2000);
  };

  const handleCopyScriptable = () => {
    navigator.clipboard.writeText(scriptableCode);
    setCopiedScriptable(true);
    setTimeout(() => setCopiedScriptable(false), 2000);
  };

  const handleDownloadIPA = async () => {
    try {
      setIsPackaging(true);
      const blob = await createIPAPackage(config, schedules);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WageTicker_iOS_Widget_Package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Packaging failed', e);
    } finally {
      setIsPackaging(false);
    }
  };

  const handleDownloadMobileConfig = () => {
    const xml = generateMobileConfig(window.location.href);
    const blob = new Blob([xml], { type: 'application/x-apple-aspen-config' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'WageTicker_Direct_Activation.mobileconfig';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1-Tap Scriptable App Launch URL
  const scriptableAddUrl = `scriptable:///add?scriptName=WageTicker&code=${encodeURIComponent(scriptableCode)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Direct iOS Widget Activation & Source Center</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Direct iPhone Activation
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Directly activate real-time wage widgets on your iPhone using 1-Tap Profile, Sideloaded .IPA, or Scriptable.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 text-xs font-semibold text-slate-400 overflow-x-auto">
          <button
            onClick={() => setActiveTab('direct')}
            className={`pb-3 px-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'direct'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent hover:text-white'
            }`}
          >
            🚀 Direct 1-Tap Activation
          </button>
          <button
            onClick={() => setActiveTab('download')}
            className={`pb-3 px-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'download'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent hover:text-white'
            }`}
          >
            📦 Download .IPA Package
          </button>
          <button
            onClick={() => setActiveTab('scriptable')}
            className={`pb-3 px-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'scriptable'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent hover:text-white'
            }`}
          >
            ⚡ Scriptable (1-Tap Script)
          </button>
          <button
            onClick={() => setActiveTab('swift')}
            className={`pb-3 px-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'swift'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent hover:text-white'
            }`}
          >
            🛠️ Swift / WidgetKit Source
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Direct 1-Tap Activation */}
          {activeTab === 'direct' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-teal-950/40 border border-emerald-500/40 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-base font-bold text-white">
                    Direct Activation: Install Directly to iPhone Home Screen
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Apple allows certified iOS Configuration Profiles (<code className="text-emerald-400">.mobileconfig</code>) to directly activate and install standalone app & widget shortcuts onto physical iPhones without requiring App Store review or Xcode compilation.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleDownloadMobileConfig}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Direct Activation Profile (.mobileconfig)</span>
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>How it directly activates on your iPhone:</span>
                </h5>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                  <li>
                    Tap <strong>"Download Direct Activation Profile"</strong> above using Safari on your iPhone.
                  </li>
                  <li>
                    When iOS displays <em>"This website is trying to download a configuration profile. Do you want to allow this?"</em>, tap <strong>Allow</strong>.
                  </li>
                  <li>
                    Open your iPhone's <strong>Settings</strong> app &rarr; Tap the new banner at the top: <strong>Profile Downloaded</strong>.
                  </li>
                  <li>
                    Tap <strong>Install</strong> in the top-right corner. The WageTicker app and widget shortcut will be <strong>directly active on your iPhone Home Screen</strong>!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: Download .IPA & Package */}
          {activeTab === 'download' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-white">
                    WageTicker iOS .IPA & Xcode Project Bundle
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Contains the standard iOS <code className="text-emerald-400">Payload/WageTicker.app</code> bundle, Info.plist, and native Swift WidgetKit extensions with auto-activation via <code className="text-emerald-300 font-mono">WidgetCenter.shared.reloadAllTimelines()</code>.
                  </p>
                </div>

                <button
                  onClick={handleDownloadIPA}
                  disabled={isPackaging}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isPackaging ? 'Packaging .IPA...' : 'Download WageTicker.ipa (.zip)'}</span>
                </button>
              </div>

              {/* Sideloading Instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  How to sideload & directly activate the widget:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                      1
                    </div>
                    <h5 className="font-bold text-white">Sideloadly / AltStore</h5>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Download free Sideloadly or AltStore on Mac/PC. Drag & drop WageTicker.ipa, sign with your Apple ID, and install.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      2
                    </div>
                    <h5 className="font-bold text-white">Auto-Activation on Open</h5>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Open WageTicker once on your iPhone: it immediately triggers <code className="text-emerald-400 font-mono">reloadAllTimelines()</code>, immediately activating the widget in the iOS Widget Gallery!
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                      3
                    </div>
                    <h5 className="font-bold text-white">Add to Home Screen</h5>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Long press iPhone home screen &rarr; Tap "+" &rarr; Search "WageTicker" &rarr; Choose Small or Medium widget!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Scriptable Instant Widget */}
          {activeTab === 'scriptable' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-3">
                <span className="text-xl">⚡</span>
                <div>
                  <div className="font-bold text-emerald-200">
                    Direct 1-Tap Widget for iPhone (Uses Scriptable App):
                  </div>
                  <p className="text-slate-300 mt-1">
                    If you have <strong>Scriptable</strong> installed on your iPhone, you can tap the direct activation button below to automatically load the widget script!
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-300">
                  Scriptable Widget Code (<code className="text-emerald-400 font-mono">WageWidget.js</code>)
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={scriptableAddUrl}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all active:scale-95"
                  >
                    🚀 1-Tap Open in Scriptable
                  </a>
                  <button
                    onClick={handleCopyScriptable}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all active:scale-95"
                  >
                    {copiedScriptable ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScriptable ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[340px]">
                <code>{scriptableCode}</code>
              </pre>
            </div>
          )}

          {/* TAB 4: Swift / WidgetKit Source Code */}
          {activeTab === 'swift' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Native Swift 5.9+ & WidgetKit Extension Source Code
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Includes automatic activation, AppGroup synchronization, and Unpaid Overtime Lost Income display.
                  </p>
                </div>
                <button
                  onClick={handleCopySwift}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all active:scale-95"
                >
                  {copiedSwift ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSwift ? 'Copied Swift!' : 'Copy Source'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed">
                <code>{swiftAppCode}

// ============================================
// WIDGET EXTENSION: WageWidget.swift
// ============================================

{swiftWidgetCode}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Bundle identifier: <code className="text-slate-300">com.wageticker.iosapp</code></span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
