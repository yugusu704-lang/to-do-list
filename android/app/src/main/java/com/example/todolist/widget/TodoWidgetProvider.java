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
import android.widget.RemoteViews;

import com.example.todolist.MainActivity;
import com.example.todolist.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class TodoWidgetProvider extends AppWidgetProvider {

    static final String PREFS_NAME = "todo_prefs";
    static final String KEY_TODOS = "todos_json";
    private static final int MAX_VISIBLE_ITEMS = 5;
    private static final String ACTION_TOGGLE = "com.example.todolist.TOGGLE_TODO";
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
        if (ACTION_TOGGLE.equals(action)) {
            String todoId = intent.getStringExtra(EXTRA_TODO_ID);
            if (todoId != null) {
                toggleTodo(context, todoId);
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
        int totalToday = todayTodos.size();

        RemoteViews views = new RemoteViews(context.getPackageName(), getLayoutResId());

        // 清空任务容器
        views.removeAllViews(R.id.widget_task_container);

        // 填充可见任务（最多 5 条）
        int visibleCount = Math.min(todayTodos.size(), MAX_VISIBLE_ITEMS);
        for (int i = 0; i < visibleCount; i++) {
            TodoItem item = todayTodos.get(i);
            RemoteViews taskView = createTaskView(context, item);
            views.addView(R.id.widget_task_container, taskView);
        }

        // 底部文字
        if (totalToday == 0) {
            views.setTextViewText(R.id.widget_footer, "今天没有待办任务");
        } else if (totalToday > MAX_VISIBLE_ITEMS) {
            views.setTextViewText(R.id.widget_footer,
                    "+" + (totalToday - MAX_VISIBLE_ITEMS) + " 更多");
        } else {
            int unfinished = 0;
            for (TodoItem t : todayTodos) {
                if (!t.completed) unfinished++;
            }
            views.setTextViewText(R.id.widget_footer, unfinished + " 个未完成");
        }

        // "+"按钮 → 广播到 onReceive
        views.setOnClickPendingIntent(R.id.widget_btn_add, createAddPendingIntent(context));

        // 整个任务容器空白区 → 打开 app（复选框有自己的 PendingIntent 覆盖）
        views.setOnClickPendingIntent(R.id.widget_task_container, createOpenPendingIntent(context));

        manager.updateAppWidget(widgetId, views);
    }

    // 创建单条任务的 RemoteViews
    private RemoteViews createTaskView(Context context, TodoItem item) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_task_item);

        v.setTextViewText(R.id.task_text, item.text);
        v.setBoolean(R.id.task_checkbox, "setChecked", item.completed);

        // 已完成：文字加删除线 + 变灰
        if (item.completed) {
            v.setInt(R.id.task_text, "setPaintFlags",
                    Paint.STRIKE_THRU_TEXT_FLAG | Paint.ANTI_ALIAS_FLAG);
            v.setTextColor(R.id.task_text,
                    context.getResources().getColor(R.color.widget_text_secondary, null));
        } else {
            v.setInt(R.id.task_text, "setPaintFlags", Paint.ANTI_ALIAS_FLAG);
            v.setTextColor(R.id.task_text,
                    context.getResources().getColor(R.color.widget_text_primary, null));
        }

        // 复选框点击 → 广播切换状态
        Intent toggleIntent = new Intent(context, TodoWidgetProvider.class);
        toggleIntent.setAction(ACTION_TOGGLE);
        toggleIntent.putExtra(EXTRA_TODO_ID, item.id);
        toggleIntent.setData(Uri.parse("todo://" + item.id)); // URI 区分 PendingIntent
        PendingIntent pi = PendingIntent.getBroadcast(
                context, item.id.hashCode(), toggleIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.task_checkbox, pi);

        return v;
    }

    // ---- 数据读取 ----

    // 读取今天创建的任务（createdAt 在今天 0:00 ~ 明天 0:00），未完成排前面
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
                long createdAt = obj.optLong("createdAt", 0);
                if (createdAt >= todayStart && createdAt < todayEnd) {
                    result.add(new TodoItem(
                            obj.optString("id", ""),
                            obj.optString("text", ""),
                            obj.optBoolean("completed", false)
                    ));
                }
            }
        } catch (Exception ignored) {
        }

        // 未完成在前，已完成在后
        Collections.sort(result, new Comparator<TodoItem>() {
            @Override
            public int compare(TodoItem a, TodoItem b) {
                return Boolean.compare(a.completed, b.completed);
            }
        });
        return result;
    }

    // ---- 数据写入 ----

    // 切换任务完成状态
    private void toggleTodo(Context context, String todoId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_TODOS, "[]");

        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                if (todoId.equals(obj.optString("id"))) {
                    boolean current = obj.optBoolean("completed", false);
                    obj.put("completed", !current);
                    obj.put("completedAt", !current ? System.currentTimeMillis() : JSONObject.NULL);
                    break;
                }
            }
            prefs.edit().putString(KEY_TODOS, arr.toString()).apply();
        } catch (Exception ignored) {
        }
    }

    // ---- PendingIntent 工厂 ----

    // 打开 app 进入添加模式
    private void openAppToAdd(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.putExtra("action", "ADD");
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        context.startActivity(intent);
    }

    // "+"按钮 → 直接启动 MainActivity（带 action=ADD）
    private PendingIntent createAddPendingIntent(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.putExtra("action", "ADD");
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private PendingIntent createOpenPendingIntent(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        return PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    // ---- 工具方法 ----

    // 获取今天 0:00 的毫秒时间戳
    static long getTodayStartMillis() {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        return cal.getTimeInMillis();
    }

    // 刷新所有已注册的小部件实例
    public static void refreshAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        // 刷新4×2
        ComponentName comp4x2 = new ComponentName(context, TodoWidgetProvider.class);
        int[] ids4x2 = manager.getAppWidgetIds(comp4x2);
        if (ids4x2.length > 0) {
            Intent intent = new Intent(context, TodoWidgetProvider.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids4x2);
            context.sendBroadcast(intent);
        }
        // 刷新4×3
        ComponentName comp4x3 = new ComponentName(context, TodoWidgetProviderLarge.class);
        int[] ids4x3 = manager.getAppWidgetIds(comp4x3);
        if (ids4x3.length > 0) {
            Intent intent = new Intent(context, TodoWidgetProviderLarge.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids4x3);
            context.sendBroadcast(intent);
        }
    }

    // 内部数据类
    static class TodoItem {
        String id;
        String text;
        boolean completed;

        TodoItem(String id, String text, boolean completed) {
            this.id = id;
            this.text = text;
            this.completed = completed;
        }
    }
}
