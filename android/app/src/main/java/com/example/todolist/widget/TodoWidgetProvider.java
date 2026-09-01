package com.example.todolist.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.widget.RemoteViews;

import com.example.todolist.MainActivity;
import com.example.todolist.R;

import com.example.todolist.db.TodoDbHelper;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

public class TodoWidgetProvider extends AppWidgetProvider {

    private static final String ACTION_COMPLETE = "com.example.todolist.COMPLETE_TODO";
    private static final String ACTION_ADD = "com.example.todolist.ADD_TODO";
    private static final String EXTRA_TODO_ID = "todo_id";
    private static final String TAG = "TodoWidget";

    // ---- 完成动效：id -> 当前帧透明度（1.0=不透明），工厂按帧读取 ----
    static final ConcurrentHashMap<String, Float> completingRows = new ConcurrentHashMap<>();
    private static final float ANIM_ALPHA_1 = 1.0f;
    private static final float ANIM_ALPHA_2 = 0.45f;
    private static final float ANIM_ALPHA_3 = 0.12f;
    private static final long ANIM_STEP_1_MS = 150L;
    private static final long ANIM_STEP_2_MS = 280L;
    private static final long ANIM_REMOVE_MS = 380L;

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
                startCompleteAnimation(context, todoId);
            }
        } else if (ACTION_ADD.equals(action)) {
            openAppToAdd(context);
        }
    }

    // ---- 渲染 ----

    // 4x2 小部件使用 4x2 布局（Large 子类覆写为 4x3）
    protected int getLayoutResId() {
        return R.layout.widget_todo_4x2;
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

        // 动态应用深浅色主题（同步 App 内部显示模式）
        TodoWidgetTheme.applyThemeToWidget(context, views);

        // 空列表时显示空状态视图模板
        views.setEmptyView(R.id.widget_task_container, R.id.widget_empty);

        // "+"按钮 → 打开 app 添加任务
        views.setOnClickPendingIntent(R.id.widget_btn_add, createAddPendingIntent(context));

        // 设置 ListView 的点击模板（每个任务行的 PendingIntent 基础）
        // 必须使用显式 Intent + FLAG_MUTABLE，fillInIntent 才能合并 extras 到模板 Intent
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

    // 读取今日待办：SQLite 直查 dueAt 在今天的未完成任务，按时间升序
    static List<TodoItem> loadTodayTodos(Context context) {
        long todayStart = getTodayStartMillis();
        long todayEnd = todayStart + 86400000L;

        List<TodoDbHelper.WidgetTodoItem> dbItems = TodoDbHelper.getInstance(context)
                .getTodayActiveTodosForWidget(todayStart, todayEnd, completingRows.keySet());

        List<TodoItem> result = new ArrayList<>(dbItems.size());
        for (TodoDbHelper.WidgetTodoItem item : dbItems) {
            TodoItem ti = new TodoItem();
            ti.id = item.id;
            ti.text = item.text;
            ti.dueAt = item.dueAt;
            ti.location = item.location;
            ti.isRoutine = item.isRoutine;
            result.add(ti);
        }
        return result;
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

    // 标记任务完成（更新 SQLite 状态）
    private void markCompleted(Context context, String todoId) {
        try {
            TodoDbHelper.getInstance(context).setTodoCompleted(todoId, true, System.currentTimeMillis());
        } catch (Exception e) {
            Log.e(TAG, "markCompleted failed for " + todoId, e);
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

    // 点击完成 → 播放动效：绿勾 → 淡出 → 移除；同一 id 未播完时不重复
    private void startCompleteAnimation(Context context, String todoId) {
        if (completingRows.containsKey(todoId)) return;
        completingRows.put(todoId, ANIM_ALPHA_1);
        notifyAllWidgetsDataChanged(context);
        Handler h = new Handler(Looper.getMainLooper());
        h.postDelayed(() -> {
            completingRows.put(todoId, ANIM_ALPHA_2);
            notifyAllWidgetsDataChanged(context);
        }, ANIM_STEP_1_MS);
        h.postDelayed(() -> {
            completingRows.put(todoId, ANIM_ALPHA_3);
            notifyAllWidgetsDataChanged(context);
        }, ANIM_STEP_2_MS);
        h.postDelayed(() -> {
            completingRows.remove(todoId);
            refreshAllWidgets(context);
        }, ANIM_REMOVE_MS);
    }

    // 仅通知 ListView 数据变化（工厂按最新帧重渲染），不重建整个小部件，避免闪烁
    private static void notifyAllWidgetsDataChanged(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName[] providers = {
                new ComponentName(context, TodoWidgetProvider.class),
                new ComponentName(context, TodoWidgetProviderLarge.class)
        };
        for (ComponentName cn : providers) {
            for (int id : manager.getAppWidgetIds(cn)) {
                manager.notifyAppWidgetViewDataChanged(id, R.id.widget_task_container);
            }
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
        boolean isRoutine;
    }
}
