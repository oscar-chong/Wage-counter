import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { generateOfflineHTML } from '../src/utils/iosPackageGenerator.js';
import { DEFAULT_SALARY_CONFIG, DEFAULT_WEEKLY_SCHEDULE, getDefaultLeaves } from '../src/utils/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function buildRealAPK() {
  console.log('--- Starting Native Real Android APK Build Pipeline ---');
  const rootDir = path.resolve(__dirname, '..');
  const buildDir = '/tmp/wageticker-apk-build';
  const androidJar = '/usr/lib/android-sdk/platforms/android-23/android.jar';
  const publicDir = path.join(rootDir, 'public');
  const artifactDir = '/.aistudio/artifacts/brain/75c5a839-4bc0-44e0-9de2-ace48012b244';

  if (!fs.existsSync(androidJar)) {
    throw new Error(`Android SDK platform jar not found at ${androidJar}`);
  }

  // Clean build dir
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }

  const dirs = [
    buildDir,
    path.join(buildDir, 'gen'),
    path.join(buildDir, 'bin'),
    path.join(buildDir, 'src/com/wageticker/app'),
    path.join(buildDir, 'res/values'),
    path.join(buildDir, 'res/layout'),
    path.join(buildDir, 'res/xml'),
    path.join(buildDir, 'res/drawable'),
    path.join(buildDir, 'assets/www'),
  ];
  for (const d of dirs) {
    fs.mkdirSync(d, { recursive: true });
  }

  // 1. AndroidManifest.xml
  const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.wageticker.app"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/ic_launcher"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <receiver
            android:name=".WageWidgetProvider"
            android:label="@string/widget_name"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/wage_widget_info" />
        </receiver>

    </application>
</manifest>`;
  fs.writeFileSync(path.join(buildDir, 'AndroidManifest.xml'), manifest);

  // 2. Resources
  fs.writeFileSync(
    path.join(buildDir, 'res/values/strings.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">WageTicker</string>
    <string name="widget_name">WageTicker Live Widget</string>
</resources>`
  );

  fs.writeFileSync(
    path.join(buildDir, 'res/xml/wage_widget_info.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="140dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_layout"
    android:previewImage="@drawable/ic_launcher"
    android:widgetCategory="home_screen|keyguard" />`
  );

  fs.writeFileSync(
    path.join(buildDir, 'res/layout/widget_layout.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="#0f172a"
    android:padding="16dp">

    <TextView
        android:id="@+id/widget_title"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="TODAY\\'S EARNINGS (LIVE)"
        android:textColor="#10b981"
        android:textSize="12sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/widget_amount"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="$142.85"
        android:textColor="#ffffff"
        android:textSize="28sp"
        android:textStyle="bold"
        android:layout_marginTop="8dp" />

    <TextView
        android:id="@+id/widget_rate"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="100% Offline Real-Time Salary Tracker"
        android:textColor="#94a3b8"
        android:textSize="11sp"
        android:layout_marginTop="4dp" />
</LinearLayout>`
  );

  // Copy icon
  const iconPath = path.join(publicDir, 'icon-192.png');
  if (fs.existsSync(iconPath)) {
    fs.copyFileSync(iconPath, path.join(buildDir, 'res/drawable/ic_launcher.png'));
  }

  // 3. Offline Web Assets
  const offlineHtml = generateOfflineHTML(DEFAULT_SALARY_CONFIG, DEFAULT_WEEKLY_SCHEDULE, getDefaultLeaves());
  fs.writeFileSync(path.join(buildDir, 'assets/www/index.html'), offlineHtml);

  // 4. Java Sources
  const mainActivityJava = `package com.wageticker.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setDatabaseEnabled(true);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        webView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
`;
  fs.writeFileSync(path.join(buildDir, 'src/com/wageticker/app/MainActivity.java'), mainActivityJava);

  const wageWidgetProviderJava = `package com.wageticker.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;

public class WageWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int i = 0; i < appWidgetIds.length; i++) {
            int appWidgetId = appWidgetIds[i];
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
`;
  fs.writeFileSync(path.join(buildDir, 'src/com/wageticker/app/WageWidgetProvider.java'), wageWidgetProviderJava);

  // 5. Execution Pipeline
  console.log('Step 1: Generating R.java with aapt...');
  execSync(
    `aapt package -f -m -J "${path.join(buildDir, 'gen')}" -M "${path.join(buildDir, 'AndroidManifest.xml')}" -S "${path.join(buildDir, 'res')}" -I "${androidJar}"`,
    { stdio: 'inherit' }
  );

  console.log('Step 2: Compiling Java sources with javac...');
  execSync(
    `javac -target 1.8 -source 1.8 -bootclasspath "${androidJar}" -d "${path.join(buildDir, 'bin')}" -cp "${androidJar}" "${path.join(buildDir, 'gen/com/wageticker/app/R.java')}" "${path.join(buildDir, 'src/com/wageticker/app/MainActivity.java')}" "${path.join(buildDir, 'src/com/wageticker/app/WageWidgetProvider.java')}"`,
    { stdio: 'inherit' }
  );

  console.log('Step 3: Compiling Dalvik bytecode with dx...');
  execSync(
    `dx --dex --output="${path.join(buildDir, 'bin/classes.dex')}" "${path.join(buildDir, 'bin')}"`,
    { stdio: 'inherit' }
  );

  console.log('Step 4: Packaging resources & assets with aapt...');
  const unalignedApk = path.join(buildDir, 'bin/unaligned.apk');
  execSync(
    `aapt package -f -m -F "${unalignedApk}" -M "${path.join(buildDir, 'AndroidManifest.xml')}" -S "${path.join(buildDir, 'res')}" -A "${path.join(buildDir, 'assets')}" -I "${androidJar}"`,
    { stdio: 'inherit' }
  );

  console.log('Step 5: Adding classes.dex to APK...');
  execSync(`cd "${path.join(buildDir, 'bin')}" && aapt add unaligned.apk classes.dex`, {
    stdio: 'inherit',
  });

  console.log('Step 6: Aligning APK with zipalign...');
  const alignedApk = path.join(buildDir, 'bin/aligned.apk');
  execSync(`zipalign -f -v 4 "${unalignedApk}" "${alignedApk}"`, { stdio: 'inherit' });

  console.log('Step 7: Creating or locating debug keystore...');
  const keystore = path.join(rootDir, 'debug.keystore');
  if (!fs.existsSync(keystore)) {
    execSync(
      `keytool -genkeypair -validity 10000 -dname "CN=WageTicker,O=WageTicker,C=US" -keystore "${keystore}" -storepass android -keypass android -alias androiddebugkey -keyalg RSA -keysize 2048`,
      { stdio: 'inherit' }
    );
  }

  console.log('Step 8: Signing APK with apksigner (v1 + v2 signatures)...');
  const finalApk = path.join(publicDir, 'WageTicker.apk');
  execSync(
    `apksigner sign --ks "${keystore}" --ks-pass pass:android --key-pass pass:android --out "${finalApk}" "${alignedApk}"`,
    { stdio: 'inherit' }
  );

  console.log('Step 9: Verifying signed APK with apksigner verify...');
  const verifyOutput = execSync(`apksigner verify --verbose "${finalApk}"`).toString();
  console.log(verifyOutput);

  // Copy to artifact directory
  if (fs.existsSync(artifactDir)) {
    fs.copyFileSync(finalApk, path.join(artifactDir, 'WageTicker.apk'));
  }

  const stats = fs.statSync(finalApk);
  console.log(`SUCCESS! Valid, signed Android APK created: ${finalApk} (${stats.size} bytes)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildRealAPK();
}
