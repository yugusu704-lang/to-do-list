package com.example.todolist.widget;

import com.example.todolist.R;

// 4×3 版本，复用所有逻辑，仅切换布局
// Android 不允许同一个 Provider 类注册两次，因此需要子类
public class TodoWidgetProviderLarge extends TodoWidgetProvider {

    @Override
    protected int getLayoutResId() {
        return R.layout.widget_todo_4x3;
    }
}
