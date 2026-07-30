package com.example.todolist.widget;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import java.util.Calendar;

// 每天凌晨 0:00 接收广播，刷新小部件并注册下一天的闹钟
public class TodoWidgetRefreshReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        // 先注册下一天的闹钟（保持链条不断）
        scheduleNextAlarm(context);
        // 刷新小部件
        TodoWidgetProvider.refreshAllWidgets(context);
    }

    // 注册下一个凌晨 0:00 的精确闹钟
    public static void scheduleNextAlarm(Context context) {
        AlarmManager alarm = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, TodoWidgetRefreshReceiver.class);
        PendingIntent pi = PendingIntent.getBroadcast(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_YEAR, 1);
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);

        // setExactAndAllowWhileIdle：即使在 Doze 模式下也能准时触发
        alarm.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                cal.getTimeInMillis(),
                pi);
    }
}
