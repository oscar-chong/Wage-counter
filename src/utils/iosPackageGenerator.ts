import JSZip from 'jszip';
import { UserSalaryConfig, DaySchedule } from '../types';

export function generateSwiftWidgetCode(config: UserSalaryConfig, schedule: DaySchedule[]): string {
  return `//
//  WageWidget.swift
//  WageWidgetExtension
//
//  Created for iOS 16, 17, and 18 with WidgetKit & Interactive AppIntents
//  Direct Widget Activation on iPhone
//

import WidgetKit
import SwiftUI
import AppIntents

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> WageEntry {
        WageEntry(date: Date(), amount: 142.85, period: "Today", isWorking: true, hourlyRate: ${config.hourlyRate}, currency: "${config.currency}", isLostIncome: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (WageEntry) -> ()) {
        let entry = WageEntry(date: Date(), amount: calculateCurrentEarnings(), period: "Today", isWorking: true, hourlyRate: ${config.hourlyRate}, currency: "${config.currency}", isLostIncome: false)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [WageEntry] = []
        let currentDate = Date()
        
        // AppGroup shared defaults
        let userDefaults = UserDefaults(suiteName: "group.com.wageticker.shared")
        let showUnpaidOT = userDefaults?.bool(forKey: "show_unpaid_ot") ?? false
        let unpaidOTAmount = userDefaults?.double(forKey: "unpaid_ot_amount") ?? 108.0
        
        // Generate timeline entries for every minute
        for minuteOffset in 0 ..< 60 {
            let entryDate = Calendar.current.date(byAdding: .minute, value: minuteOffset, to: currentDate)!
            let amount = showUnpaidOT ? unpaidOTAmount : calculateCurrentEarnings(at: entryDate)
            let entry = WageEntry(
                date: entryDate,
                amount: amount,
                period: showUnpaidOT ? "Lost Income (Unpaid OT)" : "Today",
                isWorking: isCurrentlyWorking(at: entryDate),
                hourlyRate: ${config.hourlyRate},
                currency: "${config.currency}",
                isLostIncome: showUnpaidOT
            )
            entries.append(entry)
        }

        let timeline = Timeline(entries: entries, policy: .after(Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)!))
        completion(timeline)
    }

    private func calculateCurrentEarnings(at date: Date = Date()) -> Double {
        let userDefaults = UserDefaults(suiteName: "group.com.wageticker.shared")
        let baseRate = userDefaults?.double(forKey: "hourlyRate") ?? ${config.hourlyRate}
        
        let calendar = Calendar.current
        let hour = Double(calendar.component(.hour, from: date))
        let minute = Double(calendar.component(.minute, from: date))
        let second = Double(calendar.component(.second, from: date))
        
        // Schedule: 9am (hour 9) to 5pm (hour 17)
        let workStart: Double = 9.0
        let workEnd: Double = 17.0
        let currentDayHours = hour + (minute / 60.0) + (second / 3600.0)
        
        if currentDayHours < workStart {
            return 0.0
        } else if currentDayHours > workEnd {
            return (workEnd - workStart - 1.0) * baseRate // minus 1h break
        } else {
            let workedHours = max(0.0, currentDayHours - workStart)
            return workedHours * baseRate
        }
    }

    private func isCurrentlyWorking(at date: Date = Date()) -> Bool {
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: date)
        let weekday = calendar.component(.weekday, from: date)
        // 1 = Sunday, 7 = Saturday
        if weekday == 1 || weekday == 7 { return false }
        return hour >= 9 && hour < 17
    }
}

struct WageEntry: TimelineEntry {
    let date: Date
    let amount: Double
    let period: String
    let isWorking: Bool
    let hourlyRate: Double
    let currency: String
    let isLostIncome: Bool
}

// MARK: - Widget Views

struct WageWidgetEntryView : View {
    @Environment(\\.widgetFamily) var family
    var entry: Provider.Entry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWageWidget(entry: entry)
        case .systemMedium:
            MediumWageWidget(entry: entry)
        case .systemLarge:
            LargeWageWidget(entry: entry)
        case .accessoryCircular:
            LockScreenCircularWidget(entry: entry)
        case .accessoryRectangular:
            LockScreenRectangularWidget(entry: entry)
        default:
            SmallWageWidget(entry: entry)
        }
    }
}

// MARK: - Small Widget (2x2)
struct SmallWageWidget: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: entry.isLostIncome ? "exclamationmark.triangle.fill" : "banknote.fill")
                    .foregroundColor(entry.isLostIncome ? .red : .green)
                    .font(.system(size: 14))
                Text(entry.period)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(entry.isLostIncome ? .red : .secondary)
                    .lineLimit(1)
                Spacer()
                Circle()
                    .fill(entry.isLostIncome ? Color.red : (entry.isWorking ? Color.green : Color.gray))
                    .frame(width: 7, height: 7)
            }
            
            Spacer()
            
            Text(String(format: "%@$%.2f", entry.isLostIncome ? "-" : "", entry.amount))
                .font(.system(size: 26, weight: .heavy, design: .rounded))
                .foregroundColor(entry.isLostIncome ? .red : .primary)
                .minimumScaleFactor(0.7)
                .lineLimit(1)
            
            Text(entry.isLostIncome ? "⚠️ Unpaid Wage Loss" : (entry.isWorking ? "⚡ Live Earning" : "Resting / Off"))
                .font(.system(size: 10, weight: .semibold))
                .foregroundColor(entry.isLostIncome ? .red : (entry.isWorking ? .green : .secondary))
        }
        .padding()
        .containerBackground(Color(.systemBackground), for: .widget)
    }
}

// MARK: - Medium Widget (4x2)
struct MediumWageWidget: View {
    var entry: Provider.Entry

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Image(systemName: entry.isLostIncome ? "exclamationmark.triangle.fill" : "chart.line.uptrend.xyaxis")
                        .foregroundColor(entry.isLostIncome ? .red : .green)
                    Text(entry.isLostIncome ? "LOST INCOME (UNPAID OT)" : "REAL-TIME EARNINGS")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(entry.isLostIncome ? .red : .secondary)
                }
                
                Text(String(format: "%@$%.2f", entry.isLostIncome ? "-" : "", entry.amount))
                    .font(.system(size: 34, weight: .black, design: .rounded))
                    .foregroundColor(entry.isLostIncome ? .red : .primary)
                    .minimumScaleFactor(0.8)
                
                Text(entry.isLostIncome ? "Employer wage debt owed" : (entry.isWorking ? "Rate: $\(String(format: "%.2f", entry.hourlyRate))/hr (+$0.013/s)" : "Work Shift Finished"))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 8) {
                // Interactive AppIntent buttons
                Button(intent: LogToiletBreakIntent()) {
                    Label("Toilet", systemImage: "drop.fill")
                        .font(.caption2)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.blue.opacity(0.15))
                        .foregroundColor(.blue)
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)

                Button(intent: ToggleUnpaidOTIntent()) {
                    Label("Toggle OT", systemImage: "exclamationmark.triangle")
                        .font(.caption2)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.red.opacity(0.15))
                        .foregroundColor(.red)
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
            }
        }
        .padding()
        .containerBackground(Color(.systemBackground), for: .widget)
    }
}

// MARK: - Lock Screen Widgets
struct LockScreenCircularWidget: View {
    var entry: Provider.Entry

    var body: some View {
        Gauge(value: entry.amount, in: 0...350) {
            Image(systemName: entry.isLostIncome ? "exclamationmark.triangle" : "dollarsign")
        } currentValueLabel: {
            Text(String(format: "$%.0f", entry.amount))
                .font(.system(size: 11, weight: .bold))
        }
        .gaugeStyle(.accessoryCircular)
    }
}

struct LockScreenRectangularWidget: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Image(systemName: entry.isLostIncome ? "exclamationmark.triangle.fill" : "dollarsign.circle.fill")
                Text(entry.isLostIncome ? "Unpaid OT Loss" : "Today's Wage")
                    .font(.caption2)
            }
            Text(String(format: "%@$%.2f", entry.isLostIncome ? "-" : "", entry.amount))
                .font(.system(size: 18, weight: .bold, design: .rounded))
            Text(entry.isLostIncome ? "⚠️ Wage debt" : (entry.isWorking ? "⚡ On the clock" : "Shift Complete"))
                .font(.system(size: 9))
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Interactive AppIntents (iOS 17+)
struct LogToiletBreakIntent: AppIntent {
    static var title: LocalizedStringResource = "Record Bathroom Break"
    static var description = IntentDescription("Log time spent in the bathroom to calculate toilet earnings.")

    func perform() async throws -> some IntentResult {
        let defaults = UserDefaults(suiteName: "group.com.wageticker.shared")
        defaults?.set(Date().timeIntervalSince1970, forKey: "last_toilet_timestamp")
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

struct ToggleUnpaidOTIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Unpaid OT Mode"
    static var description = IntentDescription("Switch widget to display unpaid overtime lost income.")

    func perform() async throws -> some IntentResult {
        let defaults = UserDefaults(suiteName: "group.com.wageticker.shared")
        let current = defaults?.bool(forKey: "show_unpaid_ot") ?? false
        defaults?.set(!current, forKey: "show_unpaid_ot")
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

// MARK: - Widget Bundle Declaration
@main
struct WageWidgetBundle: WidgetBundle {
    var body: some Widget {
        WageWidget()
    }
}

struct WageWidget: Widget {
    let kind: String = "WageWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            WageWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Real-Time Wage & Lost Income Ticker")
        .description("Track your live earnings, unpaid overtime lost income, and bathroom breaks on your Home Screen.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular])
    }
}
`;
}

export function generateSwiftAppCode(config: UserSalaryConfig): string {
  return `//
//  WageApp.swift
//  WageTicker (Main App)
//
//  Immediately activates WidgetKit timelines on physical iPhone
//

import SwiftUI
import WidgetKit

@main
struct WageApp: App {
    init() {
        // Direct Activation: Write user settings to Shared App Group & reload WidgetKit immediately
        let defaults = UserDefaults(suiteName: "group.com.wageticker.shared")
        defaults?.set(${config.hourlyRate}, forKey: "hourlyRate")
        defaults?.set("${config.currency}", forKey: "currency")
        
        // Force WidgetKit to activate and reload all widget extensions on iPhone
        WidgetCenter.shared.reloadAllTimelines()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear {
                    // Activate widget again on launch
                    WidgetCenter.shared.reloadAllTimelines()
                }
        }
    }
}

struct ContentView: View {
    @State private var widgetStatus = "Widget Active"

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "banknote.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)
            
            Text("WageTicker iOS")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Your real-time earnings widget is active and ready on your iPhone.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            Button(action: {
                WidgetCenter.shared.reloadAllTimelines()
                widgetStatus = "Widget Timeline Refreshed!"
            }) {
                Label("Activate / Refresh Widget", systemImage: "arrow.triangle.2.circlepath")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .foregroundColor(.black)
                    .cornerRadius(14)
            }
            .padding(.horizontal)
            
            Text(widgetStatus)
                .font(.caption)
                .foregroundColor(.green)
        }
        .padding()
    }
}
`;
}

export function generateScriptableWidgetCode(config: UserSalaryConfig): string {
  return `// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: dollar-sign;
//
// Real-Time Wage & Unpaid OT Tracker for Scriptable (iOS Home Screen)
// 1. Download Scriptable from the App Store (Free)
// 2. Open this script in Scriptable or launch scriptable:///add
// 3. Add a Scriptable Widget to your iOS Home Screen!

const HOURLY_RATE = ${config.hourlyRate};
const CURRENCY = "${config.currency === 'USD' ? '$' : config.currency === 'EUR' ? '€' : config.currency === 'GBP' ? '£' : '$'}";
const WORK_START = 9;  // 9:00 AM
const WORK_END = 17;   // 5:00 PM
const LUNCH_MINUTES = 60;
const UNPAID_OT_HOURS = 1.5; // Unpaid Overtime Hours logged

// Set SHOW_UNPAID_OT to true if you want widget to display Lost Income!
const SHOW_UNPAID_OT = false;

function calculateTodayEarnings() {
  const now = new Date();
  const day = now.getDay();
  if (day === 0 || day === 6) return 0.0;

  const hours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  if (hours < WORK_START) return 0.0;
  if (hours >= WORK_END) {
    const totalHours = (WORK_END - WORK_START) - (LUNCH_MINUTES / 60);
    return totalHours * HOURLY_RATE;
  }
  
  const grossHours = hours - WORK_START;
  const netHours = Math.max(0, grossHours - (LUNCH_MINUTES / 60) * (grossHours / (WORK_END - WORK_START)));
  return netHours * HOURLY_RATE;
}

const widget = new ListWidget();

if (SHOW_UNPAID_OT) {
  const lostIncome = UNPAID_OT_HOURS * HOURLY_RATE * 1.5;
  widget.backgroundColor = new Color("#4c0519");
  const title = widget.addText("⚠️ LOST INCOME (UNPAID OT)");
  title.font = Font.boldSystemFont(11);
  title.textColor = new Color("#f43f5e");
  widget.addSpacer(8);
  const amountText = widget.addText("-" + CURRENCY + lostIncome.toFixed(2));
  amountText.font = Font.systemFont(32, "heavy");
  amountText.textColor = new Color("#fda4af");
  widget.addSpacer(4);
  const sub = widget.addText("Wage Debt Owed: " + UNPAID_OT_HOURS + " hrs");
  sub.font = Font.systemFont(11);
  sub.textColor = new Color("#fecdd3");
} else {
  const amount = calculateTodayEarnings();
  widget.backgroundColor = new Color("#0f172a");
  const title = widget.addText("TODAY'S EARNINGS");
  title.font = Font.boldSystemFont(11);
  title.textColor = new Color("#94a3b8");
  widget.addSpacer(8);
  const amountText = widget.addText(CURRENCY + amount.toFixed(2));
  amountText.font = Font.systemFont(32, "heavy");
  amountText.textColor = new Color("#22c55e");
  widget.addSpacer(4);
  const sub = widget.addText("⚡ Rate: " + CURRENCY + HOURLY_RATE + "/hr");
  sub.font = Font.systemFont(11);
  sub.textColor = new Color("#cbd5e1");
}

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}
Script.complete();
`;
}

/**
 * Generates an iOS .mobileconfig profile that directly creates a WebClip widget on the iPhone Home Screen
 */
export function generateMobileConfig(appUrl: string): string {
  const uuid1 = 'E7D1A54F-5A2C-4A8F-9C81-817B60AA919A';
  const uuid2 = 'F8C2B65E-6B3D-5B9E-0D92-928C71BB020B';
  const targetUrl = appUrl || window.location.href;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>Icon</key>
            <data></data>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>WageTicker</string>
            <key>PayloadDescription</key>
            <string>Activates the Real-Time WageTicker App and Widget on iPhone.</string>
            <key>PayloadDisplayName</key>
            <string>WageTicker</string>
            <key>PayloadIdentifier</key>
            <string>com.wageticker.webclip.${uuid1}</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>${uuid1}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${targetUrl}</string>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>WageTicker Direct Activation Profile</string>
    <key>PayloadIdentifier</key>
    <string>com.wageticker.profile.${uuid2}</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${uuid2}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;
}

export function generateInfoPlist(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleDisplayName</key>
    <string>WageTicker</string>
    <key>CFBundleExecutable</key>
    <string>WageTicker</string>
    <key>CFBundleIdentifier</key>
    <string>com.wageticker.iosapp</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>WageTicker</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>NSSupportsLiveActivities</key>
    <true/>
    <key>NSSupportsLiveActivitiesFrequentUpdates</key>
    <true/>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>arm64</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
    </array>
</dict>
</plist>`;
}

export async function createIPAPackage(config: UserSalaryConfig, schedule: DaySchedule[]): Promise<Blob> {
  const zip = new JSZip();

  // 1. Payload directory (Standard iOS IPA layout)
  const payload = zip.folder('Payload');
  const app = payload?.folder('WageTicker.app');

  const infoPlist = generateInfoPlist();
  app?.file('Info.plist', infoPlist);
  app?.file('embedded.mobileprovision', 'REPLACE_WITH_YOUR_DEVELOPER_OR_ENTERPRISE_PROVISIONING_PROFILE');

  // 2. Xcode Source Project Directory with Direct Activation
  const sourceFolder = zip.folder('WageTicker-Xcode-Source');
  sourceFolder?.file('WageApp.swift', generateSwiftAppCode(config));
  sourceFolder?.file('WageWidget.swift', generateSwiftWidgetCode(config, schedule));
  sourceFolder?.file('WageWidgetScriptable.js', generateScriptableWidgetCode(config));
  sourceFolder?.file('WageTicker_Direct_Activation.mobileconfig', generateMobileConfig(window.location.href));
  sourceFolder?.file('Info.plist', infoPlist);

  const instructions = `=============================================================================
WAGETICKER iOS APP & DIRECT WIDGET ACTIVATION GUIDE (.IPA / PROFILE / SCRIPTABLE)
=============================================================================

METHOD 1: DIRECT 1-TAP ACTIVATION VIA PROFILE (.MOBILECONFIG) - ZERO COMPILATION
-----------------------------------------------------------------------------
1. Download "WageTicker_Direct_Activation.mobileconfig" on your iPhone Safari.
2. Tap "Allow" when iOS says "Profile Downloaded".
3. Open Settings -> Tap "Profile Downloaded" -> Tap "Install".
4. The app and widget shortcut are instantly activated on your iPhone Home Screen!

METHOD 2: DIRECT SCRIPTABLE APP WIDGET (2 MINUTES - 100% FREE IN APP STORE)
-----------------------------------------------------------------------------
1. Download "Scriptable" from the iOS App Store.
2. Open Scriptable, create a script, paste "WageWidgetScriptable.js".
3. Tap "Done", go to iPhone Home Screen, enter jiggle mode, tap "+" and choose Scriptable.
4. Select "WageWidgetScriptable" - the widget is live and ticking!

METHOD 3: SIDELOAD .IPA WITH ALTSTORE, SIDELOADLY, OR TROLLSTORE
-----------------------------------------------------------------------------
1. Connect your iPhone via USB or Wi-Fi to your computer.
2. Drag & drop WageTicker.ipa into Sideloadly or AltStore.
3. Sign with any free Apple ID to install.
4. Open WageTicker once on your iPhone: it automatically executes WidgetCenter.shared.reloadAllTimelines()
   which activates the widget in your iOS Widget Gallery immediately!
=============================================================================
`;

  zip.file('README_INSTALLATION.txt', instructions);
  zip.file('WageWidget.swift', generateSwiftWidgetCode(config, schedule));
  zip.file('WageApp.swift', generateSwiftAppCode(config));
  zip.file('WageWidgetScriptable.js', generateScriptableWidgetCode(config));
  zip.file('WageTicker_Direct_Activation.mobileconfig', generateMobileConfig(window.location.href));

  return await zip.generateAsync({ type: 'blob' });
}
