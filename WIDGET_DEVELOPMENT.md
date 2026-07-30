# 桌面小部件开发指南

## 概述

为 To-Do List 安卓 App 添加桌面小部件（App Widget），以卡片形式显示今日待办任务。

**技术方案**：Capacitor 原生插件桥接 SharedPreferences → Android AppWidget（RemoteViews）

**关键决策**
| 项 | 结论 |
|----|------|
| 数据存储 | SharedPreferences 统一数据源（替代 localStorage） |
| 显示范围 | 仅显示当天创建的任务（`createdAt` 落在今天） |
| 最大条数 | 5 条，超出显示"+N 更多" |
| 交互 | 可勾选完成 + "+"按钮跳转 app 添加 |
| 尺寸 | 4×2 和 4×3 两种可选 |
| 刷新 | app 操作即时刷新 + 每天凌晨 0:00 定时刷新 |
| 样式 | 跟随系统深浅模式，与 app 风格统一 |
| "+"行为 | 跳转主页 + 高亮输入框 |
| 数据冲突 | onResume 时从 SharedPreferences 拉最新数据覆盖 localStorage |

---

## 目录结构（新增文件）

```
android/app/src/main/java/com/example/todolist/
├── MainActivity.java                          # 已有，需修改
├── TodoStoragePlugin.java                     # 新增：Capacitor 存储插件
└── widget/
    ├── TodoWidgetProvider.java                # 新增：AppWidget 逻辑
    └── TodoWidgetRefreshReceiver.java         # 新增：每日定时刷新广播

android/app/src/main/res/
├── layout/
│   ├── widget_todo_4x2.xml                    # 新增：4×2 布局
│   └── widget_todo_4x3.xml                    # 新增：4×3 布局
├── xml/
│   ├── widget_todo_4x2_info.xml               # 新增：4×2 元数据
│   └── widget_todo_4x3_info.xml               # 新增：4×3 元数据
├── drawable/
│   ├── widget_bg.xml                          # 新增：卡片圆角背景（浅色）
│   ├── widget_bg_night.xml                    # 新增：卡片圆角背景（深色）
│   ├── ic_widget_add.xml                      # 新增：+ 按钮图标
│   └── ic_widget_checkbox.xml                 # 新增：复选框 selector
├── values/
│   └── widget_colors.xml                      # 新增：小部件颜色（浅色）
└── values-night/
    └── widget_colors.xml                      # 新增：小部件颜色（深色）

android/app/src/main/AndroidManifest.xml       # 需修改：注册插件和小部件

src/
├── plugins/
│   └── todoStorage.js                       # 新增：Web 端插件接口
├── hooks/
│   └── useTodos.js                            # 需修改：改用插件存储
└── App.jsx                                    # 需修改：处理 intent 参数
```

---

## 阶段 1：Capacitor 存储插件

### 目标
创建 `TodoStoragePlugin`，用 SharedPreferences 替代 localStorage 作为 Todo 数据的唯一存储。

### 为什么先做这一步
小部件是原生 Android 组件，只能读原生存储。把数据从 localStorage 迁到 SharedPreferences 是所有后续工作的基础。

---

### 1.1 创建插件 Java 类

**文件**：`android/app/src/main/java/com/example/todolist/TodoStoragePlugin.java`

```java
package com.example.todolist;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TodoStorage")
public class TodoStoragePlugin extends Plugin {

    private static final String PREFS_NAME = "todo_prefs";
    private static final String KEY_TODOS = "todos_json";

    private SharedPreferences getPrefs() {
        return getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    // 读取所有任务 JSON 字符串
    @PluginMethod
    public void load(PluginCall call) {
        String json = getPrefs().getString(KEY_TODOS, "[]");
        JSObject result = new JSObject();
        result.put("data", json);
        call.resolve(result);
    }

    // 保存所有任务 JSON 字符串
    @PluginMethod
    public void save(PluginCall call) {
        String json = call.getString("data", "[]");
        getPrefs().edit().putString(KEY_TODOS, json).apply();
        call.resolve();
    }
}
```

**要点**：
- SharedPreferences 名称：`todo_prefs`
- 键名：`todos_json`，存储 JSON 字符串
- `save` 调用 `apply()`（异步写入，不阻塞 UI）
- `load` 和 `save` 两个方法足够覆盖所有场景

---

### 1.2 在 MainActivity 注册插件

**文件**：`android/app/src/main/java/com/example/todolist/MainActivity.java`

**注意：Capacitor 8 没有 `init(Bundle, ArrayList)` 方法**，需用 `registerPlugin()` + `onCreate()`：

```java
import android.os.Bundle;
import com.example.todolist.widget.TodoWidgetRefreshReceiver;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 在 super.onCreate 之前注册自定义插件（bridge 初始化前）
        registerPlugin(TodoStoragePlugin.class);
        super.onCreate(savedInstanceState);

        // 启动时注册每日 0:00 定时刷新小部件
        TodoWidgetRefreshReceiver.scheduleNextAlarm(this);
    }
}
```

---

### 1.3 创建 Web 端插件接口

**文件**：`src/plugins/todoStorage.js`

```javascript
import { registerPlugin } from '@capacitor/core';

// Web 端 fallback：开发环境用 localStorage，与现有行为一致
const TodoStorage = registerPlugin('TodoStorage', {
  web: {
    load: async () => ({ data: localStorage.getItem('todos') || '[]' }),
    save: async (options) => { localStorage.setItem('todos', options.data); },
  },
});

export default TodoStorage;
```

**要点**：
- `registerPlugin` 的 `web` 回调提供浏览器环境 fallback
- 在浏览器开发时（`npm run dev`）自动走 localStorage，不影响开发体验
- 真机/模拟器运行时走原生 SharedPreferences

---

### 自检点 1

完成后，Claude 必须执行以下检查：

```
□ TodoStoragePlugin.java 文件存在且无语法错误
□ MainActivity.java 中已注册 TodoStoragePlugin
□ src/plugins/todoStorage.js 文件存在
□ npm run build 能成功（Web 端 fallback 逻辑无语法错误）
□ 用 capacitor.config.json 的 appId 确认与 Java 包名一致（com.example.todolist）
```

---

## 阶段 2：迁移 useTodos 到 SharedPreferences

### 目标
修改 `useTodos.js`，启动时从 SharedPreferences 读数据，变更时同步写入 SharedPreferences，并通知原生端刷新小部件。

---

### 2.1 修改 useTodos.js 的存储逻辑

**文件**：`src/hooks/useTodos.js`

**改动点**：

1. 将同步的 `loadTodos()` 和 `localStorage.setItem` 替换为异步的插件调用
2. 每次 `setTodos` 后，额外调用插件通知原生端刷新小部件
3. 新增 `resyncFromNative()` 函数，供 app 从后台回到前台时调用

**核心代码变更**：

```javascript
import { useState, useEffect, useCallback, useRef } from 'react';
import TodoStorage from '../plugins/todoStorage';

const STORAGE_KEY = 'todos';
const AUTO_CLEAN_DAYS = 30;

// generateId() 和 autoClean() 保持不变

// 异步加载（优先 SharedPreferences，fallback localStorage）
async function loadTodosAsync() {
  try {
    const { data } = await TodoStorage.load();
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // fallback 到 localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

// 异步保存
async function saveTodosAsync(todos) {
  const json = JSON.stringify(todos);
  try {
    await TodoStorage.save({ data: json });
  } catch {
    // fallback
  }
  // 同步写 localStorage 作为备份（开发环境用）
  try {
    localStorage.setItem(STORAGE_KEY, json);
  } catch {}
}

export default function useTodos() {
  const [todos, setTodos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const isFirstRun = useRef(true);

  // 启动时异步加载
  useEffect(() => {
    loadTodosAsync().then((data) => {
      setTodos(autoClean(data));
      setLoaded(true);
    });
  }, []);

  // 数据变化时异步保存（跳过首次渲染）
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!loaded) return;
    saveTodosAsync(todos);
  }, [todos, loaded]);

  // addTodo / toggleTodo / deleteTodo / clearCompleted / restoreTodos
  // 保持不变，它们修改的是 state，上面的 effect 会自动触发保存

  // 从原生端重新同步（app 回到前台时调用）
  const resyncFromNative = useCallback(async () => {
    const fresh = await loadTodosAsync();
    setTodos(autoClean(fresh));
  }, []);

  return { todos, loaded, addTodo, toggleTodo, deleteTodo, clearCompleted, restoreTodos, resyncFromNative };
}
```

**要点**：
- `isFirstRun` ref 防止初始渲染时触发无效保存
- `loaded` 状态可用于在加载完成前显示骨架屏（可选）
- `saveTodosAsync` 写入 SharedPreferences 的同时备份一份到 localStorage
- `resyncFromNative` 供 App.jsx 在 onResume 时调用

---

### 2.2 在 App.jsx 添加 onResume 同步

**文件**：`src/App.jsx`

在组件顶部添加：

```javascript
import { App as CapApp } from '@capacitor/app';
import { useEffect } from 'react';

// 在 App() 函数内部：
const { resyncFromNative } = useTodos();

// app 从后台回到前台时，从 SharedPreferences 重新加载
useEffect(() => {
  const listener = CapApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      resyncFromNative();
    }
  });
  return () => { listener.then((l) => l.remove()); };
}, [resyncFromNative]);
```

---

### 自检点 2

完成后，Claude 必须执行以下检查：

```
□ src/plugins/todoStorage.js 文件存在
□ src/hooks/useTodos.js 中无 localStorage.setItem 直接调用（仅在 saveTodosAsync 的 fallback 中）
□ useTodos 的返回值包含 resyncFromNative
□ App.jsx 中有 appStateChange 监听器
□ npm run test 所有测试通过（现有功能不受影响）
□ 手动验证：npm run dev 后，添加任务刷新页面，数据仍存在（fallback 到 localStorage）
```

**重要**：此阶段可能需要更新现有测试用例，因为 useTodos 从同步变为异步加载。用 `waitFor` 等待 `loaded` 为 true 再断言。

---

## 阶段 3：Widget 布局与资源

### 目标
创建小部件的 XML 布局文件和相关资源，完成视觉设计。

---

### 3.1 颜色资源（支持深浅模式）

**文件**：`android/app/src/main/res/values/widget_colors.xml`（浅色模式）

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="widget_bg">#FFFFFF</color>
    <color name="widget_bg_secondary">#F5F5F4</color>
    <color name="widget_text_primary">#1C1917</color>
    <color name="widget_text_secondary">#78716C</color>
    <color name="widget_accent">#2563EB</color>
    <color name="widget_done">#16A34A</color>
    <color name="widget_checkbox_border">#D6D3D1</color>
    <color name="widget_divider">#E7E5E4</color>
    <color name="widget_add_bg">#2F3437</color>
</resources>
```

**文件**：`android/app/src/main/res/values-night/widget_colors.xml`（深色模式）

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="widget_bg">#1C1917</color>
    <color name="widget_bg_secondary">#292524</color>
    <color name="widget_text_primary">#FAFAF9</color>
    <color name="widget_text_secondary">#A8A29E</color>
    <color name="widget_accent">#3B82F6</color>
    <color name="widget_done">#22C55E</color>
    <color name="widget_checkbox_border">#57534E</color>
    <color name="widget_divider">#44403C</color>
    <color name="widget_add_bg">#44403C</color>
</resources>
```

---

### 3.2 Drawable 资源

**文件**：`android/app/src/main/res/drawable/widget_bg.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="@color/widget_bg" />
    <corners android:radius="16dp" />
</shape>
```

**文件**：`android/app/src/main/res/drawable/ic_widget_add.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="@color/widget_text_primary"
        android:pathData="M12,4a1,1 0,0 1,1 1v6h6a1,1 0,1 1,0 2h-6v6a1,1 0,1 1,-2 0v-6H5a1,1 0,1 1,0 -2h6V5a1,1 0,0 1,1 -1z" />
</vector>
```

**文件**：`android/app/src/main/res/drawable/ic_widget_checkbox.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<selector xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 未完成状态：空心圆 -->
    <item android:state_checked="false">
        <shape android:shape="oval">
            <stroke android:width="2dp" android:color="@color/widget_checkbox_border" />
            <size android:width="20dp" android:height="20dp" />
        </shape>
    </item>
    <!-- 已完成状态：实心绿圆 + 白色对勾 -->
    <item android:state_checked="true">
        <layer-list>
            <item>
                <shape android:shape="oval">
                    <solid android:color="@color/widget_done" />
                    <size android:width="20dp" android:height="20dp" />
                </shape>
            </item>
        </layer-list>
    </item>
</selector>
```

---

### 3.3 Widget 布局（4×2）

**文件**：`android/app/src/main/res/layout/widget_todo_4x2.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_bg"
    android:orientation="vertical"
    android:padding="16dp">

    <!-- 顶部：标题 + 添加按钮 -->
    <RelativeLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginBottom="12dp">

        <TextView
            android:id="@+id/widget_title"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_alignParentStart="true"
            android:layout_centerVertical="true"
            android:text="今日待办"
            android:textColor="@color/widget_text_primary"
            android:textSize="16sp"
            android:textStyle="bold" />

        <ImageButton
            android:id="@+id/widget_btn_add"
            android:layout_width="36dp"
            android:layout_height="36dp"
            android:layout_alignParentEnd="true"
            android:layout_centerVertical="true"
            android:background="?android:attr/selectableItemBackgroundBorderless"
            android:contentDescription="添加任务"
            android:src="@drawable/ic_widget_add" />
    </RelativeLayout>

    <!-- 任务列表区域（RemoteViews 填充） -->
    <LinearLayout
        android:id="@+id/widget_task_container"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:orientation="vertical" />

    <!-- 底部：剩余数量 -->
    <TextView
        android:id="@+id/widget_footer"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:gravity="center"
        android:textColor="@color/widget_text_secondary"
        android:textSize="12sp" />

</LinearLayout>
```

---

### 3.4 单条任务行布局

**文件**：`android/app/src/main/res/layout/widget_task_item.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:gravity="center_vertical"
    android:orientation="horizontal"
    android:paddingTop="6dp"
    android:paddingBottom="6dp">

    <!-- 复选框（用 CheckBox，支持 checked 状态切换） -->
    <CheckBox
        android:id="@+id/task_checkbox"
        android:layout_width="20dp"
        android:layout_height="20dp"
        android:button="@drawable/ic_widget_checkbox"
        android:clickable="true" />

    <!-- 任务文字 -->
    <TextView
        android:id="@+id/task_text"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginStart="12dp"
        android:layout_weight="1"
        android:ellipsize="end"
        android:maxLines="1"
        android:textColor="@color/widget_text_primary"
        android:textSize="14sp" />

</LinearLayout>
```

---

### 3.5 Widget 布局（4×3）

**文件**：`android/app/src/main/res/layout/widget_todo_4x3.xml`

与 4×2 结构相同，唯一区别：`widget_task_container` 的 `minHeight` 更大，允许显示 5 条任务（4×2 默认显示 3 条）。

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_bg"
    android:orientation="vertical"
    android:padding="16dp">

    <!-- 顶部：标题 + 添加按钮（与 4×2 相同） -->
    <RelativeLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginBottom="12dp">

        <TextView
            android:id="@+id/widget_title"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_alignParentStart="true"
            android:layout_centerVertical="true"
            android:text="今日待办"
            android:textColor="@color/widget_text_primary"
            android:textSize="16sp"
            android:textStyle="bold" />

        <ImageButton
            android:id="@+id/widget_btn_add"
            android:layout_width="36dp"
            android:layout_height="36dp"
            android:layout_alignParentEnd="true"
            android:layout_centerVertical="true"
            android:background="?android:attr/selectableItemBackgroundBorderless"
            android:contentDescription="添加任务"
            android:src="@drawable/ic_widget_add" />
    </RelativeLayout>

    <!-- 任务列表区域（更大的最小高度） -->
    <LinearLayout
        android:id="@+id/widget_task_container"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:minHeight="180dp"
        android:orientation="vertical" />

    <!-- 底部：剩余数量 -->
    <TextView
        android:id="@+id/widget_footer"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:gravity="center"
        android:textColor="@color/widget_text_secondary"
        android:textSize="12sp" />

</LinearLayout>
```

---

### 3.6 Widget 元数据

**文件**：`android/app/src/main/res/xml/widget_todo_4x2_info.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:initialLayout="@layout/widget_todo_4x2"
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:minResizeWidth="200dp"
    android:minResizeHeight="80dp"
    android:resizeMode="horizontal|vertical"
    android:updatePeriodMillis="0"
    android:widgetCategory="home_screen"
    android:description="@string/widget_description" />
```

**文件**：`android/app/src/main/res/xml/widget_todo_4x3_info.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:initialLayout="@layout/widget_todo_4x3"
    android:minWidth="250dp"
    android:minHeight="180dp"
    android:minResizeWidth="200dp"
    android:minResizeHeight="120dp"
    android:resizeMode="horizontal|vertical"
    android:updatePeriodMillis="0"
    android:widgetCategory="home_screen"
    android:description="@string/widget_description" />
```

**要点**：
- `updatePeriodMillis="0"` — 禁用系统自动刷新（我们自己管理刷新时机）
- `resizeMode` — 允许用户自由调整尺寸
- `widgetCategory="home_screen"` — 仅在主屏幕显示（不含锁屏）

---

### 3.7 添加字符串资源

在 `android/app/src/main/res/values/strings.xml` 中添加：

```xml
<string name="widget_description">在桌面显示今日待办任务</string>
```

---

### 自检点 3

完成后，Claude 必须执行以下检查：

```
□ 所有 XML 文件存在且无语法错误（用 xmllint 或手动检查标签闭合）
□ values/widget_colors.xml 和 values-night/widget_colors.xml 颜色名称一一对应
□ widget_bg.xml drawable 引用了存在的颜色资源
□ ic_widget_checkbox.xml 的 selector 在两个状态都有 drawable
□ 两种 widget 元数据的 initialLayout 引用正确的布局文件
□ strings.xml 中有 widget_description 字符串
□ npx cap sync 无报错
```

---

## 阶段 4：Widget 核心逻辑

### 目标
实现 `TodoWidgetProvider`（AppWidgetProvider 子类），负责读取 SharedPreferences 数据、渲染任务列表、处理勾选和添加按钮的点击事件。

---

### 4.1 TodoWidgetProvider.java

**文件**：`android/app/src/main/java/com/example/todolist/widget/TodoWidgetProvider.java`

**核心逻辑**：

```java
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

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class TodoWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "todo_prefs";
    private static final String KEY_TODOS = "todos_json";
    private static final int MAX_VISIBLE_ITEMS = 5;
    private static final String ACTION_TOGGLE = "com.example.todolist.TOGGLE_TODO";
    private static final String ACTION_ADD = "com.example.todolist.ADD_TODO";
    private static final String EXTRA_TODO_ID = "todo_id";

    // 每次更新时调用
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    // 接收广播（勾选/添加按钮）
    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        if (ACTION_TOGGLE.equals(intent.getAction())) {
            String todoId = intent.getStringExtra(EXTRA_TODO_ID);
            if (todoId != null) {
                toggleTodo(context, todoId);
                refreshAllWidgets(context);
            }
        }

        if (ACTION_ADD.equals(intent.getAction())) {
            openAppToAdd(context);
        }
    }

    // 渲染单个小部件
    private void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        // 读取数据
        List<TodoItem> todayTodos = loadTodayTodos(context);
        int totalToday = todayTodos.size();

        // 判断使用哪个布局（通过 widget 尺寸判断）
        // 实际中根据 widgetId 查询 provider 信息来选布局
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_todo_4x3);

        // 清空任务容器
        views.removeAllViews(R.id.widget_task_container);

        // 渲染可见任务（最多 5 条）
        int visibleCount = Math.min(todayTodos.size(), MAX_VISIBLE_ITEMS);
        for (int i = 0; i < visibleCount; i++) {
            TodoItem item = todayTodos.get(i);
            RemoteViews taskView = new RemoteViews(context.getPackageName(), R.layout.widget_task_item);

            // 设置任务文字
            taskView.setTextViewText(R.id.task_text, item.text);

            // 设置复选框状态
            taskView.setBoolean(R.id.task_checkbox, "setChecked", item.completed);

            // 已完成任务：文字加删除线 + 变灰
            if (item.completed) {
                taskView.setInt(R.id.task_text, "setPaintFlags",
                    Paint.STRIKE_THRU_TEXT_FLAG | Paint.ANTI_ALIAS_FLAG);
                taskView.setTextColor(R.id.task_text,
                    context.getResources().getColor(R.color.widget_text_secondary, null));
            } else {
                taskView.setInt(R.id.task_text, "setPaintFlags", Paint.ANTI_ALIAS_FLAG);
                taskView.setTextColor(R.id.task_text,
                    context.getResources().getColor(R.color.widget_text_primary, null));
            }

            // 复选框点击 → 发送广播切换完成状态
            Intent toggleIntent = new Intent(context, TodoWidgetProvider.class);
            toggleIntent.setAction(ACTION_TOGGLE);
            toggleIntent.putExtra(EXTRA_TODO_ID, item.id);
            // 用 id 区分 PendingIntent，避免全部指向同一个
            toggleIntent.setData(Uri.parse("todo:" + item.id));
            PendingIntent togglePI = PendingIntent.getBroadcast(
                context, 0, toggleIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            taskView.setOnClickPendingIntent(R.id.task_checkbox, togglePI);

            views.addView(R.id.widget_task_container, taskView);
        }

        // 底部文字：显示超出数量或空状态
        if (totalToday == 0) {
            views.setTextViewText(R.id.widget_footer, "今天没有待办任务");
        } else if (totalToday > MAX_VISIBLE_ITEMS) {
            views.setTextViewText(R.id.widget_footer,
                "+" + (totalToday - MAX_VISIBLE_ITEMS) + " 更多");
        } else {
            long unfinished = todayTodos.stream().filter(t -> !t.completed).count();
            views.setTextViewText(R.id.widget_footer, unfinished + " 个未完成");
        }

        // "+"按钮 → 打开 app 添加任务
        Intent addIntent = new Intent(context, TodoWidgetProvider.class);
        addIntent.setAction(ACTION_ADD);
        PendingIntent addPI = PendingIntent.getBroadcast(
            context, 0, addIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_btn_add, addPI);

        // 整个 widget 点击 → 打开 app 主页
        Intent openIntent = new Intent(context, MainActivity.class);
        PendingIntent openPI = PendingIntent.getActivity(
            context, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_title, openPI);

        manager.updateAppWidget(widgetId, views);
    }

    // 读取今日任务（createdAt 在今天 0:00 之后的未完成任务，最多 5 条）
    private List<TodoItem> loadTodayTodos(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_TODOS, "[]");

        List<TodoItem> result = new ArrayList<>();
        long todayStart = getTodayStartMillis();
        long todayEnd = todayStart + 86400000L;

        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length() && result.size() < MAX_VISIBLE_ITEMS; i++) {
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
        } catch (Exception ignored) {}

        // 未完成排前面，已完成排后面
        result.sort((a, b) -> Boolean.compare(a.completed, b.completed));
        return result;
    }

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
                    if (!current) {
                        obj.put("completedAt", System.currentTimeMillis());
                    } else {
                        obj.put("completedAt", JSONObject.NULL);
                    }
                    break;
                }
            }
            prefs.edit().putString(KEY_TODOS, arr.toString()).apply();
        } catch (Exception ignored) {}
    }

    // 打开 app 进入添加模式
    private void openAppToAdd(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.putExtra("action", "ADD");
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        context.startActivity(intent);
    }

    // 获取今天 0:00 的毫秒时间戳
    private long getTodayStartMillis() {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
        cal.set(java.util.Calendar.MINUTE, 0);
        cal.set(java.util.Calendar.SECOND, 0);
        cal.set(java.util.Calendar.MILLISECOND, 0);
        return cal.getTimeInMillis();
    }

    // 刷新所有小部件
    public static void refreshAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, TodoWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(component);
        Intent intent = new Intent(context, TodoWidgetProvider.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        context.sendBroadcast(intent);
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
```

**要点**：
- `loadTodayTodos` 只读取 `createdAt` 在今天 0:00~23:59 范围内的任务
- 排序规则：未完成在前，已完成在后
- 每条任务的复选框用独立的 `PendingIntent`（通过 `Uri.parse("todo:" + id)` 区分）
- `"setPaintFlags"` 实现文字删除线效果
- `refreshAllWidgets` 是静态方法，供外部（插件/广播）调用

---

### 4.2 每日定时刷新

**文件**：`android/app/src/main/java/com/example/todolist/widget/TodoWidgetRefreshReceiver.java`

```java
package com.example.todolist.widget;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

// 每天凌晨 0:00 收到广播后刷新小部件
public class TodoWidgetRefreshReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        TodoWidgetRefreshReceiver.scheduleNextAlarm(context);
        TodoWidgetProvider.refreshAllWidgets(context);
    }

    // 注册每日定时（在 App 启动时调用一次）
    public static void scheduleNextAlarm(Context context) {
        android.app.AlarmManager alarm = (android.app.AlarmManager)
            context.getSystemService(Context.ALARM_SERVICE);
        android.content.Intent intent = new android.content.Intent(context, TodoWidgetRefreshReceiver.class);
        android.app.PendingIntent pi = android.app.PendingIntent.getBroadcast(
            context, 0, intent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE);

        // 计算下一个 0:00 的时间
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.add(java.util.Calendar.DAY_OF_YEAR, 1);
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
        cal.set(java.util.Calendar.MINUTE, 0);
        cal.set(java.util.Calendar.SECOND, 0);

        alarm.setExactAndAllowWhileIdle(
            android.app.AlarmManager.RTC_WAKEUP,
            cal.getTimeInMillis(),
            pi);
    }
}
```

**要点**：
- 用 `setExactAndAllowWhileIdle` 确保在 Doze 模式下也能准时触发
- `scheduleNextAlarm` 在每次触发后自动注册下一天的闹钟
- 需要在 app 启动时（MainActivity）调用一次 `scheduleNextAlarm` 来启动定时链

---

### 4.3 Capacitor 插件触发刷新

在 `TodoStoragePlugin.java` 的 `save` 方法末尾，添加刷新小部件的调用：

```java
@PluginMethod
public void save(PluginCall call) {
    String json = call.getString("data", "[]");
    getPrefs().edit().putString(KEY_TODOS, json).apply();

    // 通知小部件刷新
    TodoWidgetProvider.refreshAllWidgets(getContext());

    call.resolve();
}
```

这样每次 app 内修改任务，小部件都会立即更新。

---

### 自检点 4

完成后，Claude 必须执行以下检查：

```
□ TodoWidgetProvider.java 文件存在
□ TodoWidgetRefreshReceiver.java 文件存在
□ 两个类的包名与 MainActivity 一致（com.example.todolist.widget）
□ TodoStoragePlugin.save() 末尾调用了 refreshAllWidgets
□ loadTodayTodos 中的时间范围判断逻辑正确（今天 0:00 ~ 明天 0:00）
□ toggleTodo 正确处理 completedAt 字段
□ PendingIntents 使用 FLAG_IMMUTABLE（Android 12+ 要求）
□ npx cap sync 无报错
```

---

## 阶段 5：注册 Widget 和 Intent 处理

### 目标
在 AndroidManifest 中注册小部件组件，并在 MainActivity 中处理从 widget 传来的 intent 参数。

---

### 5.1 更新 AndroidManifest.xml

**文件**：`android/app/src/main/AndroidManifest.xml`

在 `<application>` 标签内、`<activity>` 之后添加：

```xml
<!-- Widget Provider: 4×2 -->
<receiver
    android:name=".widget.TodoWidgetProvider"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
        <action android:name="com.example.todolist.TOGGLE_TODO" />
        <action android:name="com.example.todolist.ADD_TODO" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_todo_4x2_info" />
</receiver>

<!-- Widget Provider: 4×3（复用同一个 Provider 类，不同元数据） -->
<!-- 注意：Android 不支持同一个 Provider 类注册两次，需创建子类 -->
<receiver
    android:name=".widget.TodoWidgetProviderLarge"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
        <action android:name="com.example.todolist.TOGGLE_TODO" />
        <action android:name="com.example.todolist.ADD_TODO" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_todo_4x3_info" />
</receiver>

<!-- 定时刷新广播 -->
<receiver
    android:name=".widget.TodoWidgetRefreshReceiver"
    android:exported="false" />
```

---

### 5.2 创建 TodoWidgetProviderLarge 子类

**文件**：`android/app/src/main/java/com/example/todolist/widget/TodoWidgetProviderLarge.java`

```java
package com.example.todolist.widget;

// 4×3 版本，与 TodoWidgetProvider 逻辑完全相同，仅用于 Manifest 注册区分
// Android 要求同一个 Provider 类不能注册两次
public class TodoWidgetProviderLarge extends TodoWidgetProvider {
    // 继承所有逻辑，无额外代码
}
```

---

### 5.3 处理 MainActivity 的 Intent

**文件**：`android/app/src/main/java/com/example/todolist/MainActivity.java`

在 `onNewIntent` 方法中添加处理（如果没有该方法则新建）：

```java
@Override
protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
}
```

---

### 5.4 Web 端处理 intent 参数

**文件**：`src/App.jsx`

在组件中添加 intent 处理逻辑：

```javascript
import { App as CapApp } from '@capacitor/app';
import { useRef, useEffect } from 'react';

function App() {
  const inputRef = useRef(null); // 需要 AddTodo 组件支持 forwardRef

  // 处理从 widget 传来的 intent
  useEffect(() => {
    const handleIntent = async () => {
      const info = await CapApp.getInfo();
      // Capacitor 不直接暴露 intent extras，需要用插件读取
      // 替代方案：通过 App.addListener('appUrlOpen') 处理
    };

    // 处理 app 从 widget 打开的情况
    CapApp.addListener('appUrlOpen', ({ url }) => {
      if (url.includes('action=ADD')) {
        // 聚焦到输入框
        setTimeout(() => {
          const input = document.querySelector('input[placeholder="添加新任务..."]');
          if (input) input.focus();
        }, 300);
      }
    });
  }, []);

  // ... 其余不变
}
```

**要点**：
- 由于 Capacitor 的 intent 传递机制，推荐用 URL scheme 方式传递 `action=ADD`
- 在 `capacitor.config.json` 中添加 URL scheme 配置
- 备选方案：用自定义 Capacitor 插件方法 `getLaunchAction()` 在 MainActivity 中读取 intent extras

---

### 5.5 更新 capacitor.config.json（URL scheme）

```json
{
  "appId": "com.example.todolist",
  "appName": "待办清单",
  "webDir": "dist",
  "server": {
    "url": "https://localhost"
  }
}
```

（如需自定义 scheme，在 `server` 中加 `"scheme": "todo"`）

---

### 自检点 5

完成后，Claude 必须执行以下检查：

```
□ AndroidManifest.xml 中注册了两个 receiver（4×2 和 4×3）
□ TodoWidgetRefreshReceiver 也在 Manifest 中注册
□ TodoWidgetProviderLarge.java 文件存在且继承 TodoWidgetProvider
□ MainActivity 中有 onNewIntent 处理
□ App.jsx 中有处理 action=ADD 的逻辑（聚焦输入框）
□ npx cap sync 无报错
```

---

## 阶段 6：构建、测试与验收

### 目标
构建完整 APK，在真机或模拟器上验证所有功能。

---

### 6.1 构建步骤

```bash
# 1. 构建前端
npm run build

# 2. 同步到 Capacitor
npx cap sync android

# 3. 在 Android Studio 中构建
# 方式 A：命令行构建（推荐 CI 用）
cd android && ./gradlew assembleDebug

# 方式 B：Android Studio 构建
npx cap open android
# Build → Build APK(s)
```

---

### 6.2 测试清单

**存储迁移**
- [ ] 首次安装后，app 任务数据写入 SharedPreferences（用 `adb shell` 验证）
- [ ] 在 app 中添加/删除/完成任务后，SharedPreferences 中的 JSON 实时更新
- [ ] 浏览器开发环境（npm run dev）功能不受影响（fallback 到 localStorage）

**小部件基础**
- [ ] 长按桌面空白处 → 小部件列表中能看到"待办清单"
- [ ] 4×2 和 4×3 两种尺寸都能添加到桌面
- [ ] 小部件正确显示今日创建的任务（未完成在前，已完成在后）
- [ ] 超过 5 条任务时，底部显示"+N 更多"
- [ ] 无任务时显示"今天没有待办任务"

**交互功能**
- [ ] 点击复选框 → 任务完成，文字出现删除线
- [ ] 再次点击复选框 → 取消完成
- [ ] 勾选后打开 app，app 中该任务也是已完成状态（数据同步）
- [ ] 点击"+"按钮 → 跳转到 app，输入框自动聚焦并弹出键盘

**刷新机制**
- [ ] 在 app 中添加任务后，桌面小部件立即更新（无需手动刷新）
- [ ] 在 app 中删除任务后，桌面小部件立即更新
- [ ] 跨天后（手动调整系统时间到明天），小部件自动显示新一天的任务

**视觉**
- [ ] 浅色模式下：白底、深灰文字、蓝色/绿色复选框
- [ ] 深色模式下：深色底、浅色文字（在系统设置中切换深浅模式）
- [ ] 卡片圆角正确（16dp）
- [ ] 文字超出时正确截断（ellipsis）

**数据冲突**
- [ ] app 在后台时，通过小部件完成任务 → 切回 app，数据已同步（onResume 拉取）
- [ ] app 在前台时，通过小部件完成任务 → 切回 app，数据已同步

---

### 6.3 adb 调试命令

```bash
# 查看 SharedPreferences 内容
adb shell run-as com.example.todolist cat /data/data/com.example.todolist/shared_prefs/todo_prefs.xml

# 触发小部件刷新（测试用）
adb shell am broadcast -a android.appwidget.action.APPWIDGET_UPDATE \
  --es "appWidgetIds" "" \
  -n com.example.todolist/.widget.TodoWidgetProvider

# 查看 logcat 中的小部件日志
adb logcat | grep TodoWidget
```

---

### 最终自检点

```
□ 所有 npm run test 测试通过
□ APK 构建成功无错误
□ 小部件出现在系统小部件列表中
□ 4×2 和 4×3 两种尺寸都正常显示
□ 复选框勾选/取消功能正常
□ "+"按钮跳转并聚焦输入框
□ app 操作后小部件立即刷新
□ 深色/浅色模式视觉正确
□ 跨天后数据正确更新
□ onResume 后 app 与小部件数据一致
□ 无内存泄漏（小部件不持有多余的 Context 引用）
□ 无 crash（logcat 无 FATAL EXCEPTION）
```

---

## 已知限制与注意事项

1. **同一 Provider 类不能注册两次** — 所以需要 `TodoWidgetProviderLarge` 子类
2. **RemoteViews 限制** — 不能用自定义 View，只能用系统提供的标准控件（TextView、CheckBox、LinearLayout 等）
3. **PendingIntent mutability** — Android 12+ 要求必须声明 `FLAG_IMMUTABLE`，代码中已处理
4. **SharedPreferences 大小** — Todo 数据量很小（通常 < 10KB），完全够用；不建议用 SharedPreferences 存大量数据
5. **复选框 selector 在 RemoteViews 中的限制** — 部分系统可能不支持 `<selector>` 的 `state_checked`，如果遇到问题，改用 `setImageViewResource` 动态切换图片资源
6. **华为/小米等国产 ROM** — 部分厂商限制后台广播，`setExactAndAllowWhileIdle` 可能不准时。这是系统限制，无法完全解决，但 `onUpdate` 在用户解锁时会触发一次，保证一天至少更新一次
