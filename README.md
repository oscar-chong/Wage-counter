# 💰 WageTicker - Real-Time Salary & iOS/Android Widget Companion

> **100% Offline, Privacy-First Live Wage Counter and Home Screen Widget Companion.**  
> Track your earnings second-by-second, record bathroom break earnings, track unpaid overtime, manage work schedules, and add live ticking widgets to your Android or iPhone Home Screen!

---

## ⚡ Direct Mobile Downloads (Direct in Source Code)

You do **not** need to press any button in the web UI. You can download the installable packages directly from this repository:

* 📱 **[Download WageTicker.apk (Signed Android APK, 562 KB)](./WageTicker.apk)**  
  *(Raw direct download: `https://raw.githubusercontent.com/<username>/<repo>/main/WageTicker.apk`)*  
  * **OS**: Android 5.0 to Android 15 (Samsung, Pixel, Xiaomi, OnePlus, Motorola, etc.)
  * **Verified**: Compiled binary AXML, Dalvik bytecode (`classes.dex`), 4-byte zipalign, signed with v1, v2, and v3 APK signatures.
  * **Includes**: Full native Home Screen widget provider (`WageWidgetProvider`).

* 🍏 **[Download iOS Scriptable Widget Script (JavaScript)](./scripts/wageticker-scriptable.js)**  
  * **OS**: iOS 14, 15, 16, 17, and 18 (iPhone & iPad)
  * **App**: Uses the free **Scriptable** app from the App Store.
  * **Format**: 100% pure JavaScript widget. Copy and paste in 1 click!

* 📦 **[Download Android Studio Full Project (.zip)](./public/WageTicker-Android-Studio-Project.zip)**  
  * Complete source code with `build.gradle.kts`, `MainActivity.java`, and `WageWidgetProvider.java`.

* 🍏 **[Download iOS .IPA Package](./public/WageTicker.ipa)**

---

## 🌐 How to Deploy to GitHub Pages (Fix Blank Screen)

When deploying a Vite React app to GitHub Pages, the page may appear blank if:
1. GitHub Pages is serving the raw repository root instead of the compiled build output.
2. Asset URLs are not relative.
3. Jekyll is hiding assets (missing `.nojekyll`).

This repository is already pre-configured to fix all these issues! Choose either deployment method below:

### Method 1: Automatic Deployment via GitHub Actions (Recommended)

1. Push this repository to your GitHub account (`main` or `master` branch).
2. Go to your GitHub repository on **github.com**.
3. Click on **Settings** (top navigation bar).
4. Click on **Pages** (in the left sidebar under *Code and automation*).
5. Under **Build and deployment** > **Source**, select:
   👉 **`GitHub Actions`**
6. That's it! GitHub will automatically trigger the included workflow (`.github/workflows/deploy.yml`), build the app, and publish it to:
   `https://<your-username>.github.io/<your-repo-name>/`
7. Every time you push code changes to `main`, GitHub Pages updates automatically!

---

### Method 2: Deploy from Branch (`/docs` folder)

If you prefer deploying directly from a branch without GitHub Actions:

1. Run the build command locally:
   ```bash
   npm run build
   ```
   *(This compiles Vite into `dist/` and automatically mirrors the production build to `docs/` with `.nojekyll` and `404.html`)*.
2. Commit and push your changes:
   ```bash
   git add docs/ dist/
   git commit -m "Build website for GitHub Pages"
   git push
   ```
3. In your GitHub repository, go to **Settings** > **Pages**.
4. Under **Build and deployment** > **Source**, choose:
   👉 **`Deploy from a branch`**
5. Under **Branch**, select:
   👉 **`main`** (or `master`) and folder **`/docs`**
6. Click **Save**. Your site will be live in 1–2 minutes!

---

## 🍏 How to Set Up the iOS Scriptable Widget (iPhone & iPad)

You can run the live earnings widget on your iPhone Home Screen using the free **Scriptable** app:

1. Install **[Scriptable](https://apps.apple.com/app/scriptable/id1405459188)** from the Apple App Store (free, no ads, runs offline).
2. Open Scriptable and tap the **`+`** icon in the top right to create a new script.
3. Open **[`scripts/wageticker-scriptable.js`](./scripts/wageticker-scriptable.js)** in this repository, copy all the code, and paste it into Scriptable.
4. Rename the script to **`WageTicker`**.
5. *(Optional)* Change `hourlyRate`, `workStartHour`, or `currency` in the `CONFIG` block at the top of the script.
6. Tap the **Play** button (bottom right) to test it.
7. Go to your iPhone Home Screen:
   - Long-press any empty space until icons jiggle.
   - Tap the **`+`** icon (top left).
   - Search for **Scriptable** and add a **Medium** or **Small** widget.
   - Tap the newly added widget on your Home Screen, select **Script** → choose **WageTicker**.
8. Your live earnings counter is now ticking right on your iPhone Home Screen!

---

## 🤖 How to Install WageTicker.apk on Android

1. Download **[`WageTicker.apk`](./WageTicker.apk)** directly to your Android phone (or download from the web interface).
2. Tap the downloaded file in your notification drawer or open your phone's **Files** / **Downloads** app.
3. If Android prompts: *"For your security, your phone is not allowed to install unknown apps from this source"*:
   - Tap **Settings**.
   - Toggle **"Allow from this source"** to **ON**.
4. Tap **Install**. WageTicker installs immediately as a native app!
5. **Add the Home Screen Widget**:
   - Long-press an empty space on your Android Home Screen.
   - Tap **Widgets**.
   - Search for **WageTicker**.
   - Drag and drop the **WageTicker Live Widget** onto your screen.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev

# Build for production (outputs to dist/ and docs/ with GitHub Pages support)
npm run build

# Preview production build locally
npm run preview
```

---

## 🔒 Privacy & Security

WageTicker runs **100% offline** and stores all salary figures, working schedules, and break logs exclusively in your browser's local `localStorage` or device `SharedPreferences`. No telemetry, no ads, no trackers, and no external servers.
