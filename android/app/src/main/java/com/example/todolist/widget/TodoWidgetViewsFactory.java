package com.example.todolist.widget;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Paint;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import com.example.todolist.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
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

    // 与 TodoWidgetProvider 保持一致的 SharedPreferences 配置
    private static final String PREFS_NAME = "todo_prefs";
    private static final String KEY_TODOS = "todos_json";
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

        // 时间
        if (item.dueAt > 0) {
            SimpleDateFormat sdf = new SimpleDateFormat("HH:mm", Locale.getDefault());
            v.setTextViewText(R.id.task_time, sdf.format(new Date(item.dueAt)));
            v.setViewVisibility(R.id.task_time, android.view.View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.task_time, android.view.View.GONE);
        }

        // 地点
        boolean hasLocation = item.location != null && !item.location.isEmpty();
        if (hasLocation) {
            v.setTextViewText(R.id.task_location, item.location);
            v.setViewVisibility(R.id.task_location, android.view.View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.task_location, android.view.View.GONE);
        }

        // 分隔符：仅当时间+地点都存在时显示
        boolean hasTime = item.dueAt > 0;
        v.setViewVisibility(R.id.task_separator,
                (hasTime && hasLocation) ? android.view.View.VISIBLE : android.view.View.GONE);

        // 复选框：完成动效中的任务显示绿勾并按帧淡出，其余为空心圆
        Float alpha = TodoWidgetProvider.completingRows.get(item.id);
        if (alpha != null) {
            v.setImageViewResource(R.id.task_checkbox, R.drawable.ic_checkbox_checked);
            v.setFloat(R.id.widget_task_item_root, "setAlpha", alpha);
        } else {
            v.setImageViewResource(R.id.task_checkbox, R.drawable.ic_checkbox_unchecked);
            v.setFloat(R.id.widget_task_item_root, "setAlpha", 1f);
        }

        // 文字样式
        v.setInt(R.id.task_text, "setPaintFlags", Paint.ANTI_ALIAS_FLAG);
        v.setTextColor(R.id.task_text,
                context.getResources().getColor(R.color.widget_text_primary, null));
        v.setTextColor(R.id.task_time,
                context.getResources().getColor(R.color.widget_text_secondary, null));
        v.setTextColor(R.id.task_location,
                context.getResources().getColor(R.color.widget_text_secondary, null));

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

    // ---- 数据加载（复用 TodoWidgetProvider 的筛选逻辑） ----

    private void loadTodayTodos() {
        todoItems.clear();

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_TODOS, "[]");

        long todayStart = getTodayStartMillis();
        long todayEnd = todayStart + 86400000L;

        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);

                // 未完成任务才显示；仅"完成动效"播放期间短暂保留刚完成的行
                if (obj.optBoolean("completed", false)
                        && !TodoWidgetProvider.completingRows.containsKey(obj.getString("id"))) continue;

                // 解析 dueAt
                long dueAt = parseDueAt(obj);
                if (dueAt == 0) continue;

                // 只显示今天的任务
                if (dueAt < todayStart || dueAt >= todayEnd) continue;

                TodoItem item = new TodoItem();
                item.id = obj.getString("id");
                item.text = obj.getString("text");
                item.dueAt = dueAt;
                item.location = obj.optString("location", null);
                todoItems.add(item);
            }
        } catch (Exception ignored) {
        }

        // 按时间升序排序
        Collections.sort(todoItems, new Comparator<TodoItem>() {
            @Override
            public int compare(TodoItem a, TodoItem b) {
                return Long.compare(a.dueAt, b.dueAt);
            }
        });
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

                SimpleDateFormat sdf;
                if (str.split(":").length == 2) {
                    sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.getDefault());
                } else {
                    sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());
                }
                Date date = sdf.parse(str);
                if (date != null) return date.getTime();

                return Long.parseLong(str);
            }
        } catch (Exception ignored) {
        }
        return 0;
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
    }
}
