package com.example.todolist.widget;

import android.content.Context;
import android.content.Intent;
import android.graphics.Paint;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import com.example.todolist.R;
import com.example.todolist.db.TodoDbHelper;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * 小部件 ListView 的数据适配器。
 * 为每个今日任务创建一行 RemoteViews，支持垂直滚动浏览。
 */
public class TodoWidgetViewsFactory implements RemoteViewsService.RemoteViewsFactory {

    private Context context;
    private List<TodoItem> todoItems = new ArrayList<>();
    private static final String EXTRA_TODO_ID = "todo_id";

    public TodoWidgetViewsFactory(Context context, Intent intent) {
        this.context = context;
    }

    // ---- RemoteViewsFactory 生命周期 ----

    @Override
    public void onCreate() {
        loadTodayTodos();
    }

    @Override
    public void onDataSetChanged() {
        // 每次小部件刷新时重新加载数据
        loadTodayTodos();
    }

    @Override
    public void onDestroy() {
        todoItems.clear();
    }

    // ---- 数据提供 ----

    @Override
    public int getCount() {
        return todoItems.size();
    }

    @Override
    public RemoteViews getViewAt(int position) {
        if (position < 0 || position >= todoItems.size()) {
            return null;
        }

        TodoItem item = todoItems.get(position);
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_task_item);

        // 任务内容
        v.setTextViewText(R.id.task_text, item.text);

        // 每日习惯专属徽标
        if (item.isRoutine) {
            v.setViewVisibility(R.id.task_routine_badge, android.view.View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.task_routine_badge, android.view.View.GONE);
        }

        // 时间
        boolean hasTime = item.dueAt > 0;
        if (hasTime) {
            SimpleDateFormat sdf = new SimpleDateFormat("HH:mm", Locale.getDefault());
            v.setTextViewText(R.id.task_time, sdf.format(new Date(item.dueAt)));
            v.setViewVisibility(R.id.task_time, android.view.View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.task_time, android.view.View.GONE);
        }

        // 每日徽标与时间的分隔符
        v.setViewVisibility(R.id.task_routine_separator,
                (item.isRoutine && hasTime) ? android.view.View.VISIBLE : android.view.View.GONE);

        // 地点
        boolean hasLocation = item.location != null && !item.location.isEmpty();
        if (hasLocation) {
            v.setTextViewText(R.id.task_location, item.location);
            v.setViewVisibility(R.id.task_location, android.view.View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.task_location, android.view.View.GONE);
        }

        // 时间/每日 与 地点间的分隔符
        boolean hasLeft = hasTime || item.isRoutine;
        v.setViewVisibility(R.id.task_separator,
                (hasLeft && hasLocation) ? android.view.View.VISIBLE : android.view.View.GONE);

        // 复选框与主题配色：根据 App 当前主题模式动态渲染
        Float alpha = TodoWidgetProvider.completingRows.get(item.id);
        TodoWidgetTheme.applyThemeToTaskItem(context, v, alpha);

        // 文字抗锯齿
        v.setInt(R.id.task_text, "setPaintFlags", Paint.ANTI_ALIAS_FLAG);

        // 点击任务行/复选框 → 通过 fillInIntent 携带 todoId，触发模板的标记完成
        // 注意：checkbox ImageView 必须单独设置 fillInIntent，
        // 否则点击事件会被 ImageView 消费而不传递到根视图
        Intent fillInIntent = new Intent();
        fillInIntent.putExtra(EXTRA_TODO_ID, item.id);
        v.setOnClickFillInIntent(R.id.widget_task_item_root, fillInIntent);
        v.setOnClickFillInIntent(R.id.task_checkbox, fillInIntent);

        return v;
    }

    @Override
    public RemoteViews getLoadingView() {
        return null; // 使用默认加载视图
    }

    @Override
    public int getViewTypeCount() {
        return 1; // 所有行使用同一类型
    }

    @Override
    public long getItemId(int position) {
        if (position >= 0 && position < todoItems.size()) {
            return todoItems.get(position).id.hashCode();
        }
        return position;
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }

    // ---- 数据加载（使用 TodoDbHelper 原生 SQL 查询） ----

    private void loadTodayTodos() {
        todoItems.clear();

        long todayStart = getTodayStartMillis();
        long todayEnd = todayStart + 86400000L;

        List<TodoDbHelper.WidgetTodoItem> dbItems = TodoDbHelper.getInstance(context)
                .getTodayActiveTodosForWidget(todayStart, todayEnd, TodoWidgetProvider.completingRows.keySet());

        for (TodoDbHelper.WidgetTodoItem item : dbItems) {
            TodoItem ti = new TodoItem();
            ti.id = item.id;
            ti.text = item.text;
            ti.dueAt = item.dueAt;
            ti.location = item.location;
            ti.isRoutine = item.isRoutine;
            todoItems.add(ti);
        }
    }

    private static long getTodayStartMillis() {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
        cal.set(java.util.Calendar.MINUTE, 0);
        cal.set(java.util.Calendar.SECOND, 0);
        cal.set(java.util.Calendar.MILLISECOND, 0);
        return cal.getTimeInMillis();
    }

    // ---- 内部数据类 ----

    static class TodoItem {
        String id;
        String text;
        long dueAt;
        String location;
        boolean isRoutine;
    }
}
