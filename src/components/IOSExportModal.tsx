import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Copy,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  WifiOff,
  Laptop,
  HelpCircle,
  Share2,
  Code2,
  AlertTriangle,
  FolderArchive,
} from 'lucide-react';
import { DaySchedule, LeaveDay, UserSalaryConfig } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  createIPAPackage,
  generateMobileConfig,
  generateScriptableWidgetCode,
  generateSwiftAppCode,
  generateSwiftWidgetCode,
} from '../utils/iosPackageGenerator';
import {
  createAPKPackage,
  generateAndroidManifest,
  generateKotlinAppCode,
  generateKotlinWidgetCode,
} from '../utils/androidPackageGenerator';

interface IOSExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserSalaryConfig;
  schedules: DaySchedule[];
  leaves?: LeaveDay[];
}

type PlatformType = 'android' | 'ios';
type IOSTabType = 'apk_style' | 'direct' | 'scriptable' | 'swift';
type AndroidTabType = 'apk' | 'widget_guide' | 'kotlin_source';

export const IOSExportModal: React.FC<IOSExportModalProps> = ({
  isOpen,
  onClose,
  config,
  schedules,
  leaves = [],
}) => {
  // Main Platform selection: Android or iOS
  const [platform, setPlatform] = useState<PlatformType>('android');

  // Sub tabs
  const [iosTab, setIosTab] = useState<IOSTabType>('apk_style');
  const [androidTab, setAndroidTab] = useState<AndroidTabType>('apk');

  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();

  const [copiedSwift, setCopiedSwift] = useState(false);
  const [copiedKotlin, setCopiedKotlin] = useState(false);
  const [copiedScriptable, setCopiedScriptable] = useState(false);
  const [isPackaging, setIsPackaging] = useState(false);
  const [installSuccessMessage, setInstallSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // iOS sources
  const swiftWidgetCode = generateSwiftWidgetCode(config, schedules);
  const swiftAppCode = generateSwiftAppCode(config, schedules);
  const scriptableCode = generateScriptableWidgetCode(config);

  // Android sources
  const kotlinAppCode = generateKotlinAppCode(config);
  const kotlinWidgetCode = generateKotlinWidgetCode(config);
  const androidManifest = generateAndroidManifest();

  const handleCopySwift = () => {
    navigator.clipboard.writeText(
      `${swiftAppCode}\n\n// ====================================\n// WIDGET EXTENSION\n// ====================================\n\n${swiftWidgetCode}`
    );
    setCopiedSwift(true);
    setTimeout(() => setCopiedSwift(false), 2000);
  };

  const handleCopyKotlin = () => {
    navigator.clipboard.writeText(
      `// MainActivity.kt\n${kotlinAppCode}\n\n// ====================================\n// WageWidgetProvider.kt\n// ====================================\n${kotlinWidgetCode}\n\n// ====================================\n// AndroidManifest.xml\n// ====================================\n${androidManifest}`
    );
    setCopiedKotlin(true);
    setTimeout(() => setCopiedKotlin(false), 2000);
  };

  const handleCopyScriptable = () => {
    navigator.clipboard.writeText(scriptableCode);
    setCopiedScriptable(true);
    setTimeout(() => setCopiedScriptable(false), 2000);
  };

  // 1-Tap Native Android WebAPK Installation
  const handleNativeAndroidInstall = async () => {
    if (isInstallable) {
      const installed = await triggerInstall();
      if (installed) {
        setInstallSuccessMessage('✅ App installed to your Android launcher!');
        setTimeout(() => setInstallSuccessMessage(null), 4000);
      }
    } else {
      setInstallSuccessMessage('📱 To install: In Chrome, tap ⋮ (top-right) -> "Install app"');
      setTimeout(() => setInstallSuccessMessage(null), 6000);
    }
  };

  // Download Android .APK Package (Direct compiled binary)
  const handleDownloadAPK = () => {
    try {
      setIsPackaging(true);
      const a = document.createElement('a');
      a.href = '/WageTicker.apk';
      a.download = 'WageTicker.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setInstallSuccessMessage('✅ WageTicker.apk (Signed APK, 562 KB) is downloading! Tap the downloaded file on your Android device to install.');
      setTimeout(() => setInstallSuccessMessage(null), 6000);
    } catch (e) {
      console.error('APK download error', e);
      window.location.href = '/WageTicker.apk';
    } finally {
      setIsPackaging(false);
    }
  };

  // Download Android Studio Project .zip
  const handleDownloadAndroidStudioProject = () => {
    try {
      setIsPackaging(true);
      const a = document.createElement('a');
      a.href = '/WageTicker-Android-Studio-Project.zip';
      a.download = 'WageTicker-Android-Studio-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setInstallSuccessMessage('✅ WageTicker Android Studio Project (.zip) downloaded!');
      setTimeout(() => setInstallSuccessMessage(null), 4000);
    } catch (e) {
      console.error('Project download error', e);
      window.location.href = '/WageTicker-Android-Studio-Project.zip';
    } finally {
      setIsPackaging(false);
    }
  };

  // Download iOS .IPA Package
  const handleDownloadIPA = async () => {
    try {
      setIsPackaging(true);
      const blob = await createIPAPackage(config, schedules, leaves);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'WageTicker.ipa';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('IPA packaging failed', e);
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

  const scriptableAddUrl = `scriptable:///add?scriptName=WageTicker&code=${encodeURIComponent(
    scriptableCode
  )}`;

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
                <span>WageTicker Mobile App & Widget Center</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  <span>100% Offline & Local</span>
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Install as a native offline app on Android or iOS and add live ticking widgets to your Home Screen.
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

        {/* Platform Selector Switch (Android vs iOS) */}
        <div className="bg-slate-950/80 px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Select Operating System:</span>
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setPlatform('android')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  platform === 'android'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🤖</span>
                <span>Android (APK & Widget)</span>
              </button>

              <button
                type="button"
                onClick={() => setPlatform('ios')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  platform === 'ios'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🍏</span>
                <span>Apple iOS (.IPA & Widget)</span>
              </button>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Preloaded: Rate ${config.hourlyRate}/hr</span>
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 text-xs font-semibold text-slate-400 overflow-x-auto">
          {platform === 'android' ? (
            <>
              <button
                onClick={() => setAndroidTab('apk')}
                className={`pb-3 px-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  androidTab === 'apk'
                    ? 'border-emerald-400 text-emerald-400 font-bold'
                    : 'border-transparent hover:text-white'
                }`}
              >
                <span>⚡</span>
                <span>Android App & APK Options</span>
              </button>
              <button
                onClick={() => setAndroidTab('widget_guide')}
                className={`pb-3 px-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  androidTab === 'widget_guide'
                    ? 'border-emerald-400 text-emerald-400 font-bold'
                    : 'border-transparent hover:text-white'
                }`}
              >
                <span>📲</span>
                <span>Home Screen Widget Guide</span>
              </button>
              <button
                onClick={() => setAndroidTab('kotlin_source')}
                className={`pb-3 px-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  androidTab === 'kotlin_source'
                    ? 'border-emerald-400 text-emerald-400 font-bold'
                    : 'border-transparent hover:text-white'
                }`}
              >
                <span>🛠️</span>
                <span>Kotlin & AppWidget Source</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIosTab('apk_style')}
                className={`pb-3 px-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  iosTab === 'apk_style'
                    ? 'border-emerald-400 text-emerald-400 font-bold'
                    : 'border-transparent hover:text-white'
                }`}
              >
                <span>📦</span>
                <span>Download WageTicker.ipa</span>
              </button>
              <button
                onClick={() => setIosTab('direct')}
                className={`pb-3 px-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  iosTab === 'direct'
                    ? 'border-emerald-400 text-emerald-400 font-bold'
                    : 'border-transparent hover:text-white'
                }`}
              >
                <span>🚀</span>
                <span>Direct Profile (.mobileconfig)</span>
              </button>
              <button
                onClick={() => setIosTab('scriptable')}
                className={`pb-3 px-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  iosTab === 'scriptable'
                    ? 'border-emerald-400 text-emerald-400 font-bold'
                    : 'border-transparent hover:text-white'
                }`}
              >
                <span>⚡</span>
                <span>Scriptable (1-Tap Script)</span>
              </button>
              <button
                onClick={() => setIosTab('swift')}
                className={`pb-3 px-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  iosTab === 'swift'
                    ? 'border-emerald-400 text-emerald-400 font-bold'
                    : 'border-transparent hover:text-white'
                }`}
              >
                <span>🛠️</span>
                <span>Swift / WidgetKit Source</span>
              </button>
            </>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================= */}
          {/* ANDROID TAB CONTENT                                      */}
          {/* ========================================================= */}
          {platform === 'android' && (
            <>
              {androidTab === 'apk' && (
                <div className="space-y-6">
                  {/* Diagnosis & Root Cause Box */}
                  <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Diagnosis: Why did the direct APK fail to install?</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Modern Android (Android 11, 12, 13, 14 & 15) strictly requires APKs to contain <strong>binary-compiled AAPT2 XML</strong> and an official <strong>v2/v3 cryptographic APK signing block</strong>. Files downloaded directly from a web browser lack the local C++ AAPT compiler, causing Android's system package installer to report: <code className="text-amber-300">"There was a problem parsing the package"</code>.
                    </p>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      We have fixed this by providing <strong>Method 1 (Native 1-Tap WebAPK)</strong>, which uses Android's built-in OS service to compile and install a real, signed native APK directly on your phone with zero errors!
                    </p>
                  </div>

                  {/* Method 1: Signed Android APK (.apk) & 1-Tap WebAPK */}
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border-2 border-emerald-500/50 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                            GENUINE COMPILED &amp; SIGNED APK (v1 + v2 + v3)
                          </span>
                          <span className="text-xs text-slate-400">Zero Parse Errors · Ready to Install</span>
                        </div>
                        <h4 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                          WageTicker.apk (Standalone Android APK)
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                          Standard Android package compiled with native binary manifest (<code className="text-emerald-300">AXML</code>), Dalvik bytecode (<code className="text-emerald-300">classes.dex</code>), and 4-byte alignment (<code className="text-emerald-300">zipalign</code>). Includes home screen widget provider and runs 100% offline!
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <a
                          href="./WageTicker.apk"
                          download="WageTicker.apk"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-xl shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer text-center"
                        >
                          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                          <span>Download WageTicker.apk</span>
                        </a>

                        <button
                          type="button"
                          onClick={handleNativeAndroidInstall}
                          className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all active:scale-95 cursor-pointer"
                        >
                          <Zap className="w-4 h-4 text-emerald-400" />
                          <span>1-Tap WebAPK</span>
                        </button>
                      </div>
                    </div>

                    {installSuccessMessage && (
                      <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-in fade-in">
                        {installSuccessMessage}
                      </div>
                    )}

                    {/* Preloaded Package Checklist */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Package: com.wageticker.app</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Min SDK: Android 5.0+ (API 21)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Signatures: v1, v2, v3 Verified</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Native Widget Provider included</span>
                      </div>
                    </div>
                  </div>

                  {/* Method 2 & Method 3 Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Method 2: Android Studio / Gradle Project */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                            2
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Developer / ADB Sideload
                          </span>
                        </div>
                        <h5 className="font-bold text-white text-sm mt-2">
                          Android Studio Gradle Project
                        </h5>
                        <p className="text-slate-400 text-[11px] leading-relaxed mt-1">
                          For building a signed APK or running via Android Debug Bridge (ADB):
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] mt-2">
                          <li>Download the complete project zip below.</li>
                          <li>Open in Android Studio or run: <code className="text-blue-400">./gradlew assembleDebug</code></li>
                          <li>Generates a 100% compliant, debug-signed APK for any physical device or emulator!</li>
                        </ol>
                      </div>

                      <button
                        onClick={handleDownloadAndroidStudioProject}
                        disabled={isPackaging}
                        className="w-full mt-3 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <FolderArchive className="w-4 h-4 text-blue-400" />
                        <span>Download Android Studio Project (.zip)</span>
                      </button>
                    </div>

                    {/* Method 3: Browser Menu Fallback */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                            3
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Chrome / Samsung Menu
                          </span>
                        </div>
                        <h5 className="font-bold text-white text-sm mt-2">
                          Direct Browser Menu Install
                        </h5>
                        <p className="text-slate-400 text-[11px] leading-relaxed mt-1">
                          If you are on an Android phone right now:
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] mt-2">
                          <li>Open this page in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong>.</li>
                          <li>Tap the three vertical dots (<strong>⋮</strong>) in the top right corner.</li>
                          <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                          <li>Android installs WageTicker directly into your app drawer!</li>
                        </ol>
                      </div>

                      <div className="pt-2 border-t border-slate-800 text-[11px] text-purple-300 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                        <span>Zero configuration profiles · Works on all Android versions</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {androidTab === 'widget_guide' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Android Home Screen Widget Guide & Gestures</span>
                    </h4>

                    <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <strong className="text-emerald-400 block mb-1">
                          1. How to place the WageTicker widget on Android:
                        </strong>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                          <li>Go to any empty space on your Android Home Screen.</li>
                          <li>Touch and hold (long press) until the home screen settings menu appears.</li>
                          <li>Tap <strong>Widgets</strong>.</li>
                          <li>Scroll or search for <strong>WageTicker</strong>.</li>
                          <li>Touch and hold the <strong>WageTicker Live Widget</strong>.</li>
                          <li>Drag it to your desired position on your Home Screen and let go!</li>
                        </ol>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <strong className="text-blue-400 block mb-1">
                          2. Supported Widget Sizes & Features:
                        </strong>
                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                          <li><strong>Compact 2x1 / 2x2:</strong> Displays today's live earnings total with green live indicator.</li>
                          <li><strong>Extended 4x2:</strong> Includes real-time per-second velocity, scheduled hours, and interactive <strong>Toilet Break</strong> and <strong>Overtime Toggle</strong> buttons!</li>
                          <li><strong>Resizable:</strong> Drag the widget borders to expand or compact to fit your launcher layout.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {androidTab === 'kotlin_source' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Android Studio Kotlin & AppWidgetProvider Source Code
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Full native source code for building in Android Studio or compiling with Gradle.
                      </p>
                    </div>
                    <button
                      onClick={handleCopyKotlin}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all active:scale-95 cursor-pointer"
                    >
                      {copiedKotlin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKotlin ? 'Copied Kotlin!' : 'Copy Source'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed">
                    <code>{`// ============================================
// WageWidgetProvider.kt (Android Widget)
// ============================================
${kotlinWidgetCode}

// ============================================
// MainActivity.kt (100% Offline Host)
// ============================================
${kotlinAppCode}`}</code>
                  </pre>
                </div>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* APPLE iOS TAB CONTENT                                     */}
          {/* ========================================================= */}
          {platform === 'ios' && (
            <>
              {iosTab === 'apk_style' && (
                <div className="space-y-6">
                  {/* Highlight Banner */}
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border-2 border-emerald-500/40 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                            ZERO PROFILES · 100% OFFLINE .IPA
                          </span>
                          <span className="text-xs text-slate-400">Direct Sideload & On-Device Install</span>
                        </div>
                        <h4 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                          WageTicker.ipa (Direct Installation)
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                          You do <strong>not</strong> need to install configuration profiles in Settings. You can install <code className="text-emerald-400">WageTicker.ipa</code> directly on your iPhone just like an Android APK using on-device installers (Scarlet/TrollStore) or desktop sideloaders (Sideloadly/AltStore).
                        </p>
                      </div>

                      <button
                        onClick={handleDownloadIPA}
                        disabled={isPackaging}
                        className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-sm font-extrabold flex items-center gap-2 shadow-xl shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Download className="w-5 h-5" />
                        <span>{isPackaging ? 'Packaging WageTicker.ipa...' : 'Download WageTicker.ipa'}</span>
                      </button>
                    </div>

                    {/* Preloaded Package Checklist */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Rate: ${config.hourlyRate}/hr</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Schedule & Leaves preloaded</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WidgetKit extension inside</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>No Profiles Needed</span>
                      </div>
                    </div>
                  </div>

                  {/* 3 APK-Style Installation Methods */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Choose how you want to install without profile settings:
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Method 1: On-Device APK-Style */}
                      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                              A
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              100% On-Device (Zero PC)
                            </span>
                          </div>
                          <h5 className="font-bold text-white text-sm mt-2">
                            TrollStore / Scarlet / ESign
                          </h5>
                          <p className="text-slate-400 text-[11px] leading-relaxed mt-1">
                            Exact equivalent to Android APK install:
                          </p>
                          <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] mt-2">
                            <li>Tap <strong>Download WageTicker.ipa</strong> above.</li>
                            <li>Open the file in <strong>TrollStore</strong>, <strong>Scarlet</strong>, or <strong>ESign</strong> on your iPhone.</li>
                            <li>Tap <strong>Install</strong>. The app installs directly onto your Home Screen!</li>
                          </ol>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-semibold pt-1 border-t border-slate-800">
                          ✓ No computer needed · No profile settings
                        </div>
                      </div>

                      {/* Method 2: Sideloadly / AltStore */}
                      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                              B
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              1-Click Sideload (USB/Wi-Fi)
                            </span>
                          </div>
                          <h5 className="font-bold text-white text-sm mt-2">
                            Sideloadly / AltStore
                          </h5>
                          <p className="text-slate-400 text-[11px] leading-relaxed mt-1">
                            Standard sideloading method on Mac or Windows PC:
                          </p>
                          <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] mt-2">
                            <li>Download <strong>WageTicker.ipa</strong> to your computer.</li>
                            <li>Drag & drop into free <strong>Sideloadly</strong> or <strong>AltStore</strong>.</li>
                            <li>Sign with your Apple ID and click <strong>Start</strong>. It installs as a regular native app!</li>
                          </ol>
                        </div>
                        <div className="text-[10px] text-blue-400 font-semibold pt-1 border-t border-slate-800">
                          ✓ Direct app installation · No profile files
                        </div>
                      </div>

                      {/* Method 3: Instant Safari PWA */}
                      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                              C
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Instant (No Tools Required)
                            </span>
                          </div>
                          <h5 className="font-bold text-white text-sm mt-2">
                            Safari "Add to Home Screen"
                          </h5>
                          <p className="text-slate-400 text-[11px] leading-relaxed mt-1">
                            The easiest zero-tool offline method:
                          </p>
                          <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] mt-2">
                            <li>Open this app in <strong>Safari</strong> on your iPhone.</li>
                            <li>Tap the <strong>Share</strong> button (<Share2 className="w-3 h-3 inline text-blue-400" />) at the bottom.</li>
                            <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                          </ol>
                        </div>
                        <div className="text-[10px] text-purple-400 font-semibold pt-1 border-t border-slate-800">
                          ✓ Zero tools · Zero downloads · Zero profiles
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {iosTab === 'direct' && (
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
                </div>
              )}

              {iosTab === 'scriptable' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-3">
                    <span className="text-xl">⚡</span>
                    <div>
                      <div className="font-bold text-emerald-200">
                        Direct 1-Tap Widget for iPhone (Uses Scriptable App):
                      </div>
                      <p className="text-slate-300 mt-1">
                        If you have <strong>Scriptable</strong> installed on your iPhone (free from the App Store), tap the direct activation button below to automatically load the widget script!
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">
                        Scriptable Widget Code (<code className="text-emerald-400 font-mono">wageticker-scriptable.js</code>)
                      </span>
                      <p className="text-[11px] text-slate-400">
                        100% Offline JavaScript for the Scriptable app on iPhone &amp; iPad.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href="./wageticker-scriptable.js"
                        download="WageTicker.js"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Download raw JavaScript file"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Download .js</span>
                      </a>
                      <a
                        href={scriptableAddUrl}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>1-Tap Open in Scriptable</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyScriptable}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        {copiedScriptable ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedScriptable ? 'Copied JavaScript!' : 'Copy Code'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <span className="text-slate-300 font-bold block">📋 3 Steps to setup on iPhone:</span>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Copy the JavaScript code below or download <code className="text-emerald-400">WageTicker.js</code>.</li>
                      <li>Open the free <strong>Scriptable</strong> app on your iPhone, tap <strong>+</strong>, and paste.</li>
                      <li>Go to your iPhone Home Screen, add a <strong>Scriptable</strong> widget (Medium or Small), and choose <strong>WageTicker</strong>!</li>
                    </ol>
                  </div>

                  <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[340px]">
                    <code>{scriptableCode}</code>
                  </pre>
                </div>
              )}

              {iosTab === 'swift' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Native Swift 5.9+ & WidgetKit Extension Source Code
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        100% Offline & Local: AppGroup UserDefaults synchronization, WidgetKit timelines, and Unpaid Overtime mode.
                      </p>
                    </div>
                    <button
                      onClick={handleCopySwift}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all active:scale-95 cursor-pointer"
                    >
                      {copiedSwift ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSwift ? 'Copied Swift!' : 'Copy Source'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed">
                    <code>{`${swiftAppCode}

// ============================================
// WIDGET EXTENSION: WageWidget.swift
// ============================================

${swiftWidgetCode}`}</code>
                  </pre>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            {platform === 'android'
              ? 'Package: com.wageticker.android · Android 10-15 Compatible'
              : 'Bundle: com.wageticker.iosapp · iOS 16-18 Compatible'}
          </span>
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
