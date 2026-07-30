package com.example.todolist;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.window.OnBackInvokedCallback;
import android.webkit.WebView;
import com.example.todolist.widget.TodoWidgetRefreshReceiver;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        initialPlugins.add(TodoStoragePlugin.class);
        super.onCreate(savedInstanceState);
        try {
            TodoWidgetRefreshReceiver.scheduleNextAlarm(this);
        } catch (SecurityException e) {}
        handleFocusAdd(getIntent());
        registerBackCallback();
    }

    private void registerBackCallback() {
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    1000000,  // 最高优先级，优先于系统默认处理
                    new OnBackInvokedCallback() {
                        @Override
                        public void onBackInvoked() {
                            WebView webView = getBridge().getWebView();
                            if (webView != null && webView.canGoBack()) {
                                webView.goBack();
                            } else {
                                finish();
                            }
                        }
                    }
            );
        }
    }

    @Override
    public void onBackPressed() {
        WebView webView = getBridge().getWebView();
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            finish();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleFocusAdd(intent);
    }

    private void handleFocusAdd(Intent intent) {
        if (intent != null && "ADD".equals(intent.getStringExtra("action"))) {
            TodoStoragePlugin.setFocusAdd(this);
        }
    }
}
