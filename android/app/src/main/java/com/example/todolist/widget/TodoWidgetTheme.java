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

    // 巴川纸暖骨白配色
    public static final int COLOR_TOMOE_TEXT_PRIMARY = 0xFF2C2C2A;
    public static final int COLOR_TOMOE_TEXT_SECONDARY = 0xFF6E6D67;

    // 低饱和波普风配色
    public static final int COLOR_POP_TEXT_PRIMARY = 0xFF2A2C2E;
    public static final int COLOR_POP_TEXT_SECONDARY = 0xFF4A4D50;

    /**
     * 获取小组件解析后的当前主题模式 ("light", "dark", "tomoe", "pop")
     */
    public static String getResolvedThemeMode(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String mode = prefs.getString(KEY_THEME_MODE, "system");
        if ("dark".equalsIgnoreCase(mode) || "tomoe".equalsIgnoreCase(mode) || "pop".equalsIgnoreCase(mode) || "light".equalsIgnoreCase(mode)) {
            return mode.toLowerCase();
        } else {
            int nightMode = context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
            return (nightMode == Configuration.UI_MODE_NIGHT_YES) ? "dark" : "light";
        }
    }

    /**
     * 判断小组件当前是否为深色模式
     */
    public static boolean isDarkMode(Context context) {
        return "dark".equals(getResolvedThemeMode(context));
    }

    /**
     * 为小组件外壳及 Header、Footer 渲染对应主题配色
     */
    public static void applyThemeToWidget(Context context, RemoteViews views) {
        String theme = getResolvedThemeMode(context);
        int bgRes;
        int textPrimary;
        int textSecondary;
        int addIcon;

        switch (theme) {
            case "dark":
                bgRes = R.drawable.widget_bg_dark;
                textPrimary = COLOR_DARK_TEXT_PRIMARY;
                textSecondary = COLOR_DARK_TEXT_SECONDARY;
                addIcon = R.drawable.ic_widget_add_dark;
                break;
            case "tomoe":
                bgRes = R.drawable.widget_bg_tomoe;
                textPrimary = COLOR_TOMOE_TEXT_PRIMARY;
                textSecondary = COLOR_TOMOE_TEXT_SECONDARY;
                addIcon = R.drawable.ic_widget_add_light;
                break;
            case "pop":
                bgRes = R.drawable.widget_bg_pop;
                textPrimary = COLOR_POP_TEXT_PRIMARY;
                textSecondary = COLOR_POP_TEXT_SECONDARY;
                addIcon = R.drawable.ic_widget_add_light;
                break;
            case "light":
            default:
                bgRes = R.drawable.widget_bg_light;
                textPrimary = COLOR_LIGHT_TEXT_PRIMARY;
                textSecondary = COLOR_LIGHT_TEXT_SECONDARY;
                addIcon = R.drawable.ic_widget_add_light;
                break;
        }

        views.setInt(R.id.widget_root, "setBackgroundResource", bgRes);
        views.setTextColor(R.id.widget_empty, textSecondary);
        views.setTextColor(R.id.widget_footer, textSecondary);
        views.setImageViewResource(R.id.widget_btn_add, addIcon);
    }

    /**
     * 为单条任务列表项渲染对应主题配色
     */
    public static void applyThemeToTaskItem(Context context, RemoteViews views, Float animAlpha) {
        String theme = getResolvedThemeMode(context);
        int textPrimary;
        int textSecondary;
        boolean isDark = "dark".equals(theme);

        switch (theme) {
            case "dark":
                textPrimary = COLOR_DARK_TEXT_PRIMARY;
                textSecondary = COLOR_DARK_TEXT_SECONDARY;
                break;
            case "tomoe":
                textPrimary = COLOR_TOMOE_TEXT_PRIMARY;
                textSecondary = COLOR_TOMOE_TEXT_SECONDARY;
                break;
            case "pop":
                textPrimary = COLOR_POP_TEXT_PRIMARY;
                textSecondary = COLOR_POP_TEXT_SECONDARY;
                break;
            case "light":
            default:
                textPrimary = COLOR_LIGHT_TEXT_PRIMARY;
                textSecondary = COLOR_LIGHT_TEXT_SECONDARY;
                break;
        }

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
