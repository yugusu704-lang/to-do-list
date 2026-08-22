package com.example.todolist.widget;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.widget.RemoteViews;

import com.example.todolist.R;

/**
 * 小组件主题自适应助手：
 * 1. 同步 App 手动设置的浅色/深色/跟随系统模式
 * 2. 保证小组件与 App 内部 1:1 像素级统一（纯净暖白 vs 深炭黑 #1C1C1F）
 */
public class TodoWidgetTheme {

    public static final String PREFS_NAME = "todo_prefs";
    public static final String KEY_THEME_MODE = "theme_mode";

    // 浅色配色 (匹配 App 浅色规范)
    public static final int COLOR_LIGHT_TEXT_PRIMARY = 0xFF2F3437;
    public static final int COLOR_LIGHT_TEXT_SECONDARY = 0xFF78716C;

    // 深色配色 (匹配 App 温暖深炭黑 #1C1C1F 规范)
    public static final int COLOR_DARK_TEXT_PRIMARY = 0xFFF4F4F5;
    public static final int COLOR_DARK_TEXT_SECONDARY = 0xFFA1A1AA;

    /**
     * 判断小组件当前应采用深色还是浅色模式：
     * - "dark" -> 深色
     * - "light" -> 浅色
     * - "system" (默认) -> 读取 Android 系统 UI mode
     */
    public static boolean isDarkMode(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String mode = prefs.getString(KEY_THEME_MODE, "system");
        if ("dark".equalsIgnoreCase(mode)) {
            return true;
        } else if ("light".equalsIgnoreCase(mode)) {
            return false;
        } else {
            int nightMode = context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
            return nightMode == Configuration.UI_MODE_NIGHT_YES;
        }
    }

    /**
     * 为小组件外壳及 Header、Footer 渲染对应主题配色
     */
    public static void applyThemeToWidget(Context context, RemoteViews views) {
        boolean isDark = isDarkMode(context);
        int bgRes = isDark ? R.drawable.widget_bg_dark : R.drawable.widget_bg_light;
        int textPrimary = isDark ? COLOR_DARK_TEXT_PRIMARY : COLOR_LIGHT_TEXT_PRIMARY;
        int textSecondary = isDark ? COLOR_DARK_TEXT_SECONDARY : COLOR_LIGHT_TEXT_SECONDARY;

        views.setInt(R.id.widget_root, "setBackgroundResource", bgRes);
        views.setTextColor(R.id.widget_title, textPrimary);
        views.setTextColor(R.id.widget_empty, textSecondary);
        views.setTextColor(R.id.widget_footer, textSecondary);

        int addIcon = isDark ? R.drawable.ic_widget_add_dark : R.drawable.ic_widget_add_light;
        views.setImageViewResource(R.id.widget_btn_add, addIcon);
    }

    /**
     * 为单条任务列表项渲染对应主题配色
     */
    public static void applyThemeToTaskItem(Context context, RemoteViews views, Float animAlpha) {
        boolean isDark = isDarkMode(context);
        int textPrimary = isDark ? COLOR_DARK_TEXT_PRIMARY : COLOR_LIGHT_TEXT_PRIMARY;
        int textSecondary = isDark ? COLOR_DARK_TEXT_SECONDARY : COLOR_LIGHT_TEXT_SECONDARY;

        views.setTextColor(R.id.task_text, textPrimary);
        views.setTextColor(R.id.task_time, textSecondary);
        views.setTextColor(R.id.task_location, textSecondary);
        views.setTextColor(R.id.task_separator, textSecondary);

        if (animAlpha != null) {
            views.setImageViewResource(R.id.task_checkbox, R.drawable.ic_checkbox_checked);
            views.setFloat(R.id.widget_task_item_root, "setAlpha", animAlpha);
        } else {
            int uncheckedRes = isDark ? R.drawable.ic_checkbox_unchecked_dark : R.drawable.ic_checkbox_unchecked_light;
            views.setImageViewResource(R.id.task_checkbox, uncheckedRes);
            views.setFloat(R.id.widget_task_item_root, "setAlpha", 1f);
        }
    }
}
