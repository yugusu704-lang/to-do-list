package com.example.todolist.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import com.example.todolist.MainActivity;
import com.example.todolist.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class TodoWidgetProvider extends AppWidgetProvider {

    static final String PREFS_NAME = "todo_prefs";
    static final String KEY_TODOS = "todos_json";
    private static final String ACTION_COMPLETE = "com.example.todolist.COMPLETE_TODO";
    private static final String ACTION_ADD = "com.example.todolist.ADD_TODO";
    private static final String EXTRA_TODO_ID = "todo_id";

    // ---- 生命周期 ----

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (ACTION_COMPLETE.equals(action)) {
            String todoId = intent.getStringExtra(EXTRA_TODO_ID);
            if (todoId != null) {
                markCompleted(context, todoId);
                refreshAllWidgets(context);
            }
        } else if (ACTION_ADD.equals(action)) {
            openAppToAdd(context);
        }
    }

    // ---- 渲染 ----

    protected int getLayoutResId() {
        return R.layout.widget_todo_4x3;
    }

    private void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        List<TodoItem> todayTodos = loadTodayTodos(context);

        RemoteViews views = new RemoteViews(context.getPackageName(), getLayoutResId());

        // 设置 ListView 的数据适配器（通过 RemoteViewsService）
        Intent serviceIntent = new Intent(context, TodoWidgetViewsService.class);
        serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
        serviceIntent.setData(Uri.parse(serviceIntent.toUri(Intent.URI_INTENT_SCHEME)));
        views.setRemoteAdapter(R.id.widget_task_container, serviceIntent);

        // 控制空状态和 ListView 的显示
        if (todayTodos.isEmpty()) {
            views.setViewVisibility(R.id.widget_task_container, View.GONE);
            views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
            views.setTextViewText(R.id.widget_footer, "");
        } else {
            views.setViewVisibility(R.id.widget_task_container, View.VISIBLE);
            views.setViewVisibility(R.id.widget_empty, View.GONE);
            views.setTextViewText(R.id.widget_footer, todayTodos.size() + " 个待办任务");
        }

        // 空列表时显示空状态视图模板
        views.setEmptyView(R.id.widget_task_container, R.id.widget_empty);

        // "+"按钮 → 打开 app 添加任务
        views.setOnClickPendingIntent(R.id.widget_btn_add, createAddPendingIntent(context));

        // 设置 ListView 的点击模板（每个任务行的 PendingIntent 基础）
        // 必须使用显式 Intent + FLAG_MUTABLE，fillInIntent 才能合并 extras 到模板 Intent
        // 注意：FLAG_IMMUTABLE 会忽略 fillInIntent 的所有额外参数，导致 todo_id 丢失
        Intent templateIntent = new Intent(context, TodoWidgetProvider.class);
        templateIntent.setAction(ACTION_COMPLETE);
        templateIntent.setPackage(context.getPackageName());
        views.setPendingIntentTemplate(R.id.widget_task_container,
                PendingIntent.getBroadcast(context, 0, templateIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE));

        manager.updateAppWidget(widgetId, views);

        // 通知 ListView 数据已变更，触发 RemoteViewsFactory 重新加载
        manager.notifyAppWidgetViewDataChanged(widgetId, R.id.widget_task_container);
    }

    // ---- 数据读取 ----

    // 读取今日待办：dueAt 在今天的未完成任务，按时间升序
    static List<TodoItem> loadTodayTodos(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_TODOS, "[]");
        long todayStart = getTodayStartMillis();
        long todayEnd = todayStart + 86400000L;

        List<TodoItem> result = new ArrayList<>();
        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);

                // 未完成任务才显示
                if (obj.optBoolean("completed", false)) continue;

                // 解析 dueAt
                long dueAt = parseDueAt(obj);
                if (dueAt == 0) continue; // 没有时间的任务不显示

                // 只显示今天的任务
                if (dueAt < todayStart || dueAt >= todayEnd) continue;

                TodoItem item = new TodoItem();
                item.id = obj.getString("id");
                item.text = obj.getString("text");
                item.dueAt = dueAt;
                item.location = obj.optString("location", null);
                result.add(item);
            }
        } catch (Exception ignored) {
        }

        // 按时间升序排序
        Collections.sort(result, new Comparator<TodoItem>() {
            @Override
            public int compare(TodoItem a, TodoItem b) {
                return Long.compare(a.dueAt, b.dueAt);
            }
        });

        return result;
    }

    // 解析 dueAt 字段（支持 ISO 字符串和时间戳）
    private static long parseDueAt(JSONObject obj) {
        try {
            if (!obj.has("dueAt") || obj.isNull("dueAt")) return 0;

            Object dueAtObj = obj.get("dueAt");
            if (dueAtObj instanceof Number) {
                return ((Number) dueAtObj).longValue();
            }
            if (dueAtObj instanceof String) {
                String str = (String) dueAtObj;
                if (str.isEmpty() || "null".equals(str)) return 0;

                // ISO 格式
                SimpleDateFormat sdf;
                if (str.split(":").length == 2) {
                    sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.getDefault());
                } else {
                    sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());
                }
                Date date = sdf.parse(str);
                if (date != null) return date.getTime();

                // 尝试时间戳
                return Long.parseLong(str);
            }
        } catch (Exception ignored) {
        }
        return 0;
    }

    private static long getTodayStartMillis() {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        return cal.getTimeInMillis();
    }

    // ---- 交互 ----

    // 标记任务完成（从今日待办中移除）
    private void markCompleted(Context context, String todoId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_TODOS, "[]");
        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                if (todoId.equals(obj.getString("id"))) {
                    obj.put("completed", true);
                    obj.put("completedAt", System.currentTimeMillis());
                    break;
                }
            }
            prefs.edit().putString(KEY_TODOS, arr.toString()).apply();
        } catch (Exception ignored) {
        }
    }

    // 刷新所有小部件
    public static void refreshAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName provider4x2 = new ComponentName(context, TodoWidgetProvider.class);
        ComponentName provider4x3 = new ComponentName(context, TodoWidgetProviderLarge.class);

        int[] ids4x2 = manager.getAppWidgetIds(provider4x2);
        int[] ids4x3 = manager.getAppWidgetIds(provider4x3);

        if (ids4x2.length > 0) {
            new TodoWidgetProvider().onUpdate(context, manager, ids4x2);
        }
        if (ids4x3.length > 0) {
            new TodoWidgetProviderLarge().onUpdate(context, manager, ids4x3);
        }
    }

    private void openAppToAdd(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.putExtra("action", "ADD");
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        context.startActivity(intent);
    }

    private PendingIntent createAddPendingIntent(Context context) {
        Intent intent = new Intent(context, TodoWidgetProvider.class);
        intent.setAction(ACTION_ADD);
        return PendingIntent.getBroadcast(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    // ---- 数据类 ----

    static class TodoItem {
        String id;
        String text;
        long dueAt;
        String location;
    }
}
