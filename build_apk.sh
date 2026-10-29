#!/usr/bin/env bash
set -e

echo "=== Building Production Web Distribution ==="
npm run build

echo "=== Preparing Android Build Directory ==="
rm -rf android_build
mkdir -p android_build/src/com/wageticker/app
mkdir -p android_build/gen
mkdir -p android_build/bin/classes
mkdir -p android_build/res/values
mkdir -p android_build/res/layout
mkdir -p android_build/res/xml
mkdir -p android_build/res/drawable
mkdir -p android_build/assets/www

# Copy web dist to assets/www
cp -r dist/* android_build/assets/www/

# Copy launcher icon
cp public/icon-192.png android_build/res/drawable/ic_launcher.png

# Strings.xml
cat << 'EOF' > android_build/res/values/strings.xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">WageTicker</string>
    <string name="widget_name">WageTicker Widget</string>
</resources>
EOF

# Layout: activity_main.xml
cat << 'EOF' > android_build/res/layout/activity_main.xml
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#0b0d13">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</RelativeLayout>
EOF

# Layout: widget_layout.xml
cat << 'EOF' > android_build/res/layout/widget_layout.xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@drawable/widget_bg"
    android:padding="16dp"
    android:gravity="center_vertical">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <TextView
            android:id="@+id/widget_title"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="WAGE TICKER"
            android:textColor="#34d399"
            android:textSize="12sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/widget_status"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="• LIVE TRACKING"
            android:textColor="#10b981"
            android:textSize="10sp"
            android:textStyle="bold" />
    </LinearLayout>

    <TextView
        android:id="@+id/widget_amount"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="$ 0.00"
        android:textColor="#ffffff"
        android:textSize="26sp"
        android:textStyle="bold"
        android:layout_marginTop="6dp" />

    <TextView
        android:id="@+id/widget_period"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="TODAY EARNINGS"
        android:textColor="#94a3b8"
        android:textSize="11sp"
        android:layout_marginTop="2dp" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Tap to open app &amp; settings"
        android:textColor="#64748b"
        android:textSize="9sp"
        android:layout_marginTop="8dp" />
</LinearLayout>
EOF

# Drawable: widget_bg.xml
cat << 'EOF' > android_build/res/drawable/widget_bg.xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#141824" />
    <corners android:radius="16dp" />
    <stroke android:width="1dp" android:color="#263147" />
</shape>
EOF

# XML: wage_widget_info.xml
cat << 'EOF' > android_build/res/xml/wage_widget_info.xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="140dp"
    android:minHeight="70dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_layout"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen">
</appwidget-provider>
EOF

# AndroidManifest.xml
cat << 'EOF' > android_build/AndroidManifest.xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.wageticker.app"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="33" />

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
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize"
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
                <action android:name="com.wageticker.app.UPDATE_WIDGET" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/wage_widget_info" />
        </receiver>

    </application>
</manifest>
EOF

# Java sources
cat << 'EOF' > android_build/src/com/wageticker/app/MainActivity.java
package com.wageticker.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.Window;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        setContentView(R.layout.activity_main);

        webView = (WebView) findViewById(R.id.webview);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new WageTickerBridge(this), "WageTickerBridge");

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
EOF

cat << 'EOF' > android_build/src/com/wageticker/app/WageWidgetProvider.java
package com.wageticker.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class WageWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if ("com.wageticker.app.UPDATE_WIDGET".equals(intent.getAction()) ||
            AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(intent.getAction())) {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, WageWidgetProvider.class);
            int[] allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
            for (int widgetId : allWidgetIds) {
                updateAppWidget(context, appWidgetManager, widgetId);
            }
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences("wageticker_prefs", Context.MODE_PRIVATE);
        String currency = prefs.getString("currency", "$");
        String amount = prefs.getString("amount", "0.00");
        String period = prefs.getString("period", "Today");
        String status = prefs.getString("status", "Live Tracking");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
        views.setTextViewText(R.id.widget_amount, currency + " " + amount);
        views.setTextViewText(R.id.widget_period, period.toUpperCase() + " EARNINGS");
        views.setTextViewText(R.id.widget_status, "• " + status.toUpperCase());

        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
EOF

cat << 'EOF' > android_build/src/com/wageticker/app/WageTickerBridge.java
package com.wageticker.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.webkit.JavascriptInterface;

public class WageTickerBridge {
    private Context context;

    public WageTickerBridge(Context context) {
        this.context = context;
    }

    @JavascriptInterface
    public void updateWidget(String currency, String amount, String period, String status) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("wageticker_prefs", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putString("currency", currency != null ? currency : "$");
            editor.putString("amount", amount != null ? amount : "0.00");
            editor.putString("period", period != null ? period : "Today");
            editor.putString("status", status != null ? status : "Working");
            editor.apply();

            Intent intent = new Intent(context, WageWidgetProvider.class);
            intent.setAction("com.wageticker.app.UPDATE_WIDGET");
            context.sendBroadcast(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @JavascriptInterface
    public String getStoredWidgetData() {
        SharedPreferences prefs = context.getSharedPreferences("wageticker_prefs", Context.MODE_PRIVATE);
        String currency = prefs.getString("currency", "$");
        String amount = prefs.getString("amount", "0.00");
        String period = prefs.getString("period", "Today");
        return "{\"currency\":\"" + currency + "\",\"amount\":\"" + amount + "\",\"period\":\"" + period + "\"}";
    }
}
EOF

ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"

echo "=== 1. Generating R.java via aapt ==="
aapt package -f -m \
    -J android_build/gen \
    -M android_build/AndroidManifest.xml \
    -S android_build/res \
    -I "$ANDROID_JAR"

echo "=== 2. Compiling Java sources via javac ==="
javac -source 1.8 -target 1.8 \
    -cp "$ANDROID_JAR" \
    -d android_build/bin/classes \
    android_build/gen/com/wageticker/app/R.java \
    android_build/src/com/wageticker/app/*.java

echo "=== 3. Converting to Dalvik bytecode (classes.dex) via dalvik-exchange ==="
dalvik-exchange --dex --output=android_build/bin/classes.dex android_build/bin/classes

echo "=== 4. Packaging resources & assets into unaligned APK via aapt ==="
aapt package -f \
    -M android_build/AndroidManifest.xml \
    -S android_build/res \
    -A android_build/assets \
    -I "$ANDROID_JAR" \
    -F android_build/bin/unaligned.apk

echo "=== 5. Adding classes.dex to APK ==="
(cd android_build/bin && zip -u unaligned.apk classes.dex)

echo "=== 6. Aligning APK to 4-byte boundaries via zipalign ==="
zipalign -f -p 4 android_build/bin/unaligned.apk android_build/bin/aligned.apk

echo "=== 7. Generating keystore and signing APK via apksigner ==="
if [ ! -f android_build/wageticker.keystore ]; then
    keytool -genkey -v \
        -keystore android_build/wageticker.keystore \
        -alias wageticker \
        -storepass password123 \
        -keypass password123 \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname "CN=WageTicker,OU=Mobile,O=WageTicker,L=City,ST=State,C=US"
fi

apksigner sign \
    --ks android_build/wageticker.keystore \
    --ks-pass pass:password123 \
    --key-pass pass:password123 \
    --out public/WageTicker.apk \
    android_build/bin/aligned.apk

echo "=== 8. Verifying final APK signature ==="
apksigner verify -v public/WageTicker.apk

echo "=== 9. Validating APK package badging with aapt ==="
aapt dump badging public/WageTicker.apk | head -n 25

echo "=== BUILD COMPLETED SUCCESSFULLY! ==="
