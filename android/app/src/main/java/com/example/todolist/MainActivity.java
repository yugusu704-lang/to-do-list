package com.example.todolist;

import android.content.Intent;
import android.os.Bundle;
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
