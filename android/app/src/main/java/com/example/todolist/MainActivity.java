package com.example.todolist;

import android.content.Intent;
import android.os.Bundle;
import com.example.todolist.widget.TodoWidgetRefreshReceiver;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 使用 initialPlugins 注册自定义插件（比 registerPlugin 更兼容）
        initialPlugins.add(TodoStoragePlugin.class);
        super.onCreate(savedInstanceState);

        // 启动时注册每日 0:00 定时刷新小部件
        // 用 try-catch 保护，因为 Android 12+ 需要精确闹钟权限，可能抛出 SecurityException
        try {
            TodoWidgetRefreshReceiver.scheduleNextAlarm(this);
        } catch (SecurityException e) {
            // 权限未授予，忽略（小部件刷新功能受限，但不影响主 App）
        }

        // 冷启动时如果带 action=ADD，立即写入标记供 Web 端读取
        handleFocusAdd(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // app 已在前台时，从 widget 打开也会触发此方法
        handleFocusAdd(intent);
    }

    private void handleFocusAdd(Intent intent) {
        if (intent != null && "ADD".equals(intent.getStringExtra("action"))) {
            TodoStoragePlugin.setFocusAdd(this);
        }
    }
}
