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
