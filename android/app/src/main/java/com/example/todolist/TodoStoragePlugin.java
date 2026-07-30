package com.example.todolist;

import android.content.Context;
import android.content.SharedPreferences;
import com.example.todolist.widget.TodoWidgetProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TodoStorage")
public class TodoStoragePlugin extends Plugin {

    private static final String PREFS_NAME = "todo_prefs";
    private static final String KEY_TODOS = "todos_json";
    private static final String KEY_FOCUS_ADD = "focus_add";

    private SharedPreferences getPrefs() {
        return getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    // 读取所有任务 JSON 字符串
    @PluginMethod
    public void load(PluginCall call) {
        String json = getPrefs().getString(KEY_TODOS, "[]");
        JSObject result = new JSObject();
        result.put("data", json);
        call.resolve(result);
    }

    // 保存所有任务 JSON 字符串，并通知小部件刷新
    @PluginMethod
    public void save(PluginCall call) {
        String json = call.getString("data", "[]");
        getPrefs().edit().putString(KEY_TODOS, json).apply();

        // 通知桌面小部件刷新（app 内每次操作都触发）
        TodoWidgetProvider.refreshAllWidgets(getContext());

        call.resolve();
    }

    // 供 MainActivity.onNewIntent 调用：写入焦点标记
    public static void setFocusAdd(Context context) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit().putBoolean(KEY_FOCUS_ADD, true).apply();
    }

    // 供 Web 端调用：读取并清除焦点标记（一次性消费）
    @PluginMethod
    public void getAndClearFocusAdd(PluginCall call) {
        SharedPreferences prefs = getPrefs();
        boolean focus = prefs.getBoolean(KEY_FOCUS_ADD, false);
        if (focus) {
            prefs.edit().putBoolean(KEY_FOCUS_ADD, false).apply();
        }
        JSObject result = new JSObject();
        result.put("focus", focus);
        call.resolve(result);
    }
}
