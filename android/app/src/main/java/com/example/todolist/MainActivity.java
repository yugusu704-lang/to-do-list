package com.example.todolist;

import android.content.Intent;
import android.os.Bundle;
import com.example.todolist.widget.TodoWidgetRefreshReceiver;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 在 bridge 初始化前注册自定义插件
        registerPlugin(TodoStoragePlugin.class);
        super.onCreate(savedInstanceState);

        // 启动时注册每日 0:00 定时刷新小部件
        TodoWidgetRefreshReceiver.scheduleNextAlarm(this);

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
