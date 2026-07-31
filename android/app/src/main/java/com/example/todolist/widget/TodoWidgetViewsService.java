package com.example.todolist.widget;

import android.content.Intent;
import android.widget.RemoteViewsService;

/**
 * 小部件 ListView 的数据服务。
 * Android 系统通过此服务获取 RemoteViewsFactory，为 ListView 提供数据。
 */
public class TodoWidgetViewsService extends RemoteViewsService {

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new TodoWidgetViewsFactory(getApplicationContext(), intent);
    }
}
