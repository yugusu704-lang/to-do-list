package com.example.todolist.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Paint;
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

        // 清空任务容器
        views.removeAllViews(R.id.widget_task_container);

        // 控制空状态和容器的显示
        if (todayTodos.isEmpty()) {
            views.setViewVisibility(R.id.widget_task_container, View.GONE);
            views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
        } else {
            views.setViewVisibility(R.id.widget_task_container, View.VISIBLE);
            views.setViewVisibility(R.id.widget_empty, View.GONE);

            for (TodoItem item : todayTodos) {
                RemoteViews taskView = createTaskView(context, item);
                views.addView(R.id.widget_task_container, taskView);
            }
        }

        // 底部文字
        if (todayTodos.isEmpty()) {
            views.setTextViewText(R.id.widget_footer, "");
        } else {
            views.setTextViewText(R.id.widget_footer, todayTodos.size() + " 个待办任务");
        }

        // "+"按钮 → 打开 app 添加任务
        views.setOnClickPendingIntent(R.id.widget_btn_add, createAddPendingIntent(context));

        manager.updateAppWidget(widgetId, views);
    }

    // 创建单条任务的 RemoteViews
    private RemoteViews createTaskView(Context context, TodoItem item) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_task_item);

        // 任务内容
        v.setTextViewText(R.id.task_text, item.text);

        // 时间
        if (item.dueAt > 0) {
            SimpleDateFormat sdf = new SimpleDateFormat("HH:mm", Locale.getDefault());
            v.setTextViewText(R.id.task_time, sdf.format(new Date(item.dueAt)));
            v.setViewVisibility(R.id.task_time, View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.task_time, View.GONE);
        }

        // 地点
        boolean hasLocation = item.location != null && !item.location.isEmpty();
        if (hasLocation) {
            v.setTextViewText(R.id.task_location, item.location);
            v.setViewVisibility(R.id.task_location, View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.task_location, View.GONE);
        }

        // 分隔符：仅当时间+地点都存在时显示
        boolean hasTime = item.dueAt > 0;
        v.setViewVisibility(R.id.task_separator,
                (hasTime && hasLocation) ? View.VISIBLE : View.GONE);

        // 复选框图片（未完成状态，因为已完成的不会进入此列表）
        v.setImageViewResource(R.id.task_checkbox, R.drawable.ic_checkbox_unchecked);

        // 文字样式
        v.setInt(R.id.task_text, "setPaintFlags", Paint.ANTI_ALIAS_FLAG);
        v.setTextColor(R.id.task_text,
                context.getResources().getColor(R.color.widget_text_primary, null));
        v.setTextColor(R.id.task_time,
                context.getResources().getColor(R.color.widget_text_secondary, null));
        v.setTextColor(R.id.task_location,
                context.getResources().getColor(R.color.widget_text_secondary, null));

        // 复选框点击 → 标记完成（从小组件移除）
        Intent completeIntent = new Intent(context, TodoWidgetProvider.class);
        completeIntent.setAction(ACTION_COMPLETE);
        completeIntent.putExtra(EXTRA_TODO_ID, item.id);
        completeIntent.setData(Uri.parse("todo://" + item.id));
        PendingIntent pi = PendingIntent.getBroadcast(
                context, item.id.hashCode(), completeIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.task_checkbox, pi);

        return v;
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
