package com.example.todolist;

import android.content.Context;
import android.content.SharedPreferences;
import com.example.todolist.db.TodoDbHelper;
import com.example.todolist.widget.TodoWidgetProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

@CapacitorPlugin(name = "TodoStorage")
public class TodoStoragePlugin extends Plugin {

    private static final String PREFS_NAME = "todo_prefs";
    private static final String KEY_FOCUS_ADD = "focus_add";

    private SharedPreferences getPrefs() {
        return getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    // 从 SQLite 读取所有有效任务 JSON 字符串
    @PluginMethod
    public void load(PluginCall call) {
        TodoDbHelper db = TodoDbHelper.getInstance(getContext());
        db.checkAndMigrateFromSharedPrefs(getContext());

        JSONArray todos = db.getAllActiveTodosJson();
        JSObject result = new JSObject();
        result.put("data", todos.toString());
        call.resolve(result);
    }

    // 事务批量同步保存任务到 SQLite（更新有效任务并清理已删除任务），并通知小部件刷新
    @PluginMethod
    public void save(PluginCall call) {
        String json = call.getString("data", "[]");
        try {
            JSONArray arr = new JSONArray(json);
            TodoDbHelper.getInstance(getContext()).syncTodos(arr);
        } catch (Exception e) {
            // 静默处理解析异常
        }

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

    // 同步设置深浅色模式（system / light / dark），并立即刷新桌面小组件
    @PluginMethod
    public void setThemeMode(PluginCall call) {
        String themeMode = call.getString("themeMode", "system");
        getPrefs().edit().putString("theme_mode", themeMode).apply();

        // 立即触发桌面小组件全量重绘
        TodoWidgetProvider.refreshAllWidgets(getContext());

        call.resolve();
    }

    // 获取当前保存的主题模式
    @PluginMethod
    public void getThemeMode(PluginCall call) {
        String themeMode = getPrefs().getString("theme_mode", "system");
        JSObject result = new JSObject();
        result.put("themeMode", themeMode);
        call.resolve(result);
    }
}
