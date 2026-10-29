// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: dollar-sign;
//
// ==============================================================================
// WageTicker - iOS Scriptable Widget (100% Offline JavaScript)
// ==============================================================================
// How to use on iPhone / iPad:
// 1. Download the free "Scriptable" app from the iOS App Store.
// 2. Open Scriptable, tap the "+" button in the top right to create a new script.
// 3. Paste this entire code and rename the script to "WageTicker".
// 4. Tap the Play button (bottom right) to test the widget!
// 5. Go to your iOS Home Screen, long-press empty space, tap "+", search "Scriptable",
//    add a Medium or Small widget, tap the widget to edit, and choose "WageTicker".
// ==============================================================================

// USER CONFIGURATION (Customize your salary & schedule here):
const CONFIG = {
  hourlyRate: 48.08,           // Hourly rate in your currency
  currency: "$",               // Currency symbol: $, €, £, ¥, etc.
  workStartHour: 9,            // Work day start (9 = 9:00 AM)
  workStartMinute: 0,
  workEndHour: 17,             // Work day end (17 = 5:00 PM)
  workEndMinute: 0,
  lunchDurationMinutes: 60,    // Lunch break deduction (minutes)
  workDays: [1, 2, 3, 4, 5],   // Working days (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri)
  accentColor: "#10b981",      // Emerald green
  backgroundColor: "#090d16",  // Deep midnight
  cardColor: "#111827",        // Card background
};

function calculateTodayEarnings() {
  const now = new Date();
  const day = now.getDay();
  const isWorkDay = CONFIG.workDays.includes(day);

  if (!isWorkDay) {
    return {
      amount: 0,
      status: "Weekend / Day Off",
      isWorking: false,
      progress: 0,
    };
  }

  const startSeconds = (CONFIG.workStartHour * 60 + CONFIG.workStartMinute) * 60;
  const endSeconds = (CONFIG.workEndHour * 60 + CONFIG.workEndMinute) * 60;
  const currentSeconds = (now.getHours() * 60 + now.getMinutes()) * 60 + now.getSeconds();
  const totalWorkSeconds = endSeconds - startSeconds;
  const paidWorkSeconds = Math.max(1, totalWorkSeconds - CONFIG.lunchDurationMinutes * 60);
  const secondRate = (CONFIG.hourlyRate * (paidWorkSeconds / 3600)) / totalWorkSeconds;

  if (currentSeconds < startSeconds) {
    const minUntil = Math.round((startSeconds - currentSeconds) / 60);
    return {
      amount: 0,
      status: `Shift starts in ${minUntil > 60 ? Math.floor(minUntil/60) + 'h ' + (minUntil%60) + 'm' : minUntil + 'm'}`,
      isWorking: false,
      progress: 0,
    };
  }

  if (currentSeconds >= endSeconds) {
    const totalDayEarned = (paidWorkSeconds / 3600) * CONFIG.hourlyRate;
    return {
      amount: totalDayEarned,
      status: "Shift Completed",
      isWorking: false,
      progress: 1,
    };
  }

  const elapsedSeconds = currentSeconds - startSeconds;
  const earned = elapsedSeconds * secondRate;
  const progress = Math.min(1, Math.max(0, elapsedSeconds / totalWorkSeconds));

  return {
    amount: earned,
    status: "● Working Now (Ticking)",
    isWorking: true,
    progress: progress,
  };
}

async function createWidget() {
  const data = calculateTodayEarnings();
  const widget = new ListWidget();
  widget.backgroundColor = new Color(CONFIG.backgroundColor);
  widget.setPadding(16, 16, 16, 16);

  // Top Row: App Label + Status
  const headerStack = widget.addStack();
  headerStack.layoutHorizontally();

  const title = headerStack.addText("WAGETICKER");
  title.font = Font.blackSystemFont(11);
  title.textColor = new Color("#94a3b8");

  headerStack.addSpacer();

  const statusBadge = headerStack.addText(data.isWorking ? "● LIVE" : data.status);
  statusBadge.font = Font.boldSystemFont(10);
  statusBadge.textColor = data.isWorking ? new Color(CONFIG.accentColor) : new Color("#94a3b8");

  widget.addSpacer(10);

  // Large Accrued Amount
  const amountStack = widget.addStack();
  amountStack.layoutHorizontally();

  const formattedAmount = `${CONFIG.currency}${data.amount.toFixed(2)}`;
  const amountText = amountStack.addText(formattedAmount);
  amountText.font = Font.systemFont(34, "heavy");
  amountText.textColor = data.isWorking ? new Color(CONFIG.accentColor) : new Color("#ffffff");

  widget.addSpacer(4);

  // Subtitle / Rate info
  const rateText = widget.addText(`⚡ ${CONFIG.currency}${CONFIG.hourlyRate.toFixed(2)}/hr  ·  ${Math.round(data.progress * 100)}% of shift`);
  rateText.font = Font.mediumSystemFont(11);
  rateText.textColor = new Color("#cbd5e1");

  widget.addSpacer(8);

  // Mini progress indicator bar
  const barStack = widget.addStack();
  barStack.size = new Size(0, 4);
  barStack.backgroundColor = new Color("#1e293b");
  barStack.cornerRadius = 2;

  return widget;
}

// Running script check
const widget = await createWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  // Preview in Scriptable app
  widget.presentMedium();
}
Script.complete();
