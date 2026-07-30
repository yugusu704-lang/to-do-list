# 桌面小部件功能 Handoff 文档

> **项目**：To-Do List 安卓 App  
> **功能**：桌面小部件（App Widget）  
> **版本**：v4（功能）→ v5 → v6（修复）  
> **日期**：2026-07-30  

---

## 一、架构总览

### 1.1 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | React + Vite | React 19 / Vite 8 | Web UI |
| 打包方案 | Capacitor | 8.4.2 | Web → Android 桥接 |
| 存储层 | SharedPreferences | Android 原生 | 统一数据源（替代 localStorage） |
| 小部件框架 | AppWidgetProvider | Android SDK | RemoteViews 渲染 |
| 定时刷新 | AlarmManager + BroadcastReceiver | Android SDK | 每日 0:00 刷新 |

### 1.2 数据流

```
┌─────────────────────────────────────────────────────────────┐
│                        Android 原生层                        │
│                                                              │
│  ┌─────────────────┐    ┌────────────────────────────────┐  │
│  │  桌面小部件       │    │  SharedPreferences              │  │
│  │  (RemoteViews)   │◄──►│  todo_prefs / todos_json        │  │
│  │                  │    │                                  │  │
│  │  复选框点击 ──────┼──► │  toggleTodo() → 写入 JSON       │  │
│  │  "+"按钮 ────────┼──► │  MainActivity (action=ADD)       │  │
│  └─────────────────┘    └───────────────┬────────────────┘  │
│                                         │                    │
│  ┌──────────────────────────────────────┼────────────────┐  │
│  │  Capacitor 插件桥接                    │                 │  │
│  │  TodoStoragePlugin.java              │                 │  │
│  │    load() ← 读 SharedPreferences     │                 │  │
│  │    save() → 写 SharedPreferences      │                 │  │
│  │    setFocusAdd() → 写焦点标记         │                 │  │
│  │    getAndClearFocusAdd() → 读+清除标记│                 │  │
│  └──────────────┬───────────────────────┘                 │  │
└─────────────────┼──────────────────────────────────────────┘  │
                  │  JS ↔ Java 桥接                              │
┌─────────────────┼──────────────────────────────────────────────┐
│  Web 层 (React)  │                                              │
│                  ▼                                              │
│  todoStorage.js  ← registerPlugin('TodoStorage', { web: ... }) │
│  useTodos.js     ← loadTodosAsync() / saveTodosAsync()         │
│  App.jsx         ← appStateChange → resyncFromNative()          │
│                 ← appStateChange → checkAndFocusInput()         │
│  AddTodo.jsx     ← forwardRef → inputRef.focus()                │
└────────────────────────────────────────────────────────────────┘
```

---

## 二、完整文件清单

### 2.1 新增 Java 文件（3 个）

| 文件 | 路径 | 说明 |
|------|------|------|
| `TodoStoragePlugin.java` | `android/app/src/main/java/com/example/todolist/` | Capacitor 原生插件，桥接 SharedPreferences |
| `TodoWidgetProvider.java` | `android/app/src/main/java/com/example/todolist/widget/` | AppWidget 核心：读取/渲染/交互 |
| `TodoWidgetProviderLarge.java` | 同上 | 4×3 子类（Android 不允许同一个 Provider 注册两次） |
| `TodoWidgetRefreshReceiver.java` | 同上 | 每日 0:00 定时刷新广播 |

### 2.2 修改的 Java 文件（1 个）

| 文件 | 改动 |
|------|------|
| `MainActivity.java` | 新增 `initialPlugins.add()`、`onNewIntent`、`handleFocusAdd`、`scheduleNextAlarm` |

### 2.3 新增 Android 资源文件（10 个）

| 文件 | 路径 | 说明 |
|------|------|------|
| `widget_colors.xml` | `res/values/` | 浅色模式 6 色 |
| `widget_colors.xml` | `res/values-night/` | 深色模式 6 色 |
| `widget_bg.xml` | `res/drawable/` | 16dp 圆角卡片背景 |
| `ic_widget_add.xml` | `res/drawable/` | + 号矢量图标 |
| `ic_widget_checkbox.xml` | `res/drawable/` | 复选框状态 selector |
| `widget_task_item.xml` | `res/layout/` | 单条任务行（CheckBox + TextView） |
| `widget_todo_4x2.xml` | `res/layout/` | 4×2 布局 |
| `widget_todo_4x3.xml` | `res/layout/` | 4×3 布局 |
| `widget_todo_4x2_info.xml` | `res/xml/` | 4×2 元数据 |
| `widget_todo_4x3_info.xml` | `res/xml/` | 4×3 元数据 |

### 2.4 修改的 Android 资源文件（1 个）

| 文件 | 改动 |
|------|------|
| `strings.xml` | 新增 `widget_description` 字符串 |

### 2.5 新增/修改的 Web 文件（6 个）

| 文件 | 改动 |
|------|------|
| `src/plugins/todoStorage.js` | **新增** Capacitor 插件 Web 端接口 |
| `src/hooks/useTodos.js` | **重写** 异步存储 + 迁移逻辑 |
| `src/App.jsx` | **新增** onResume 同步 + focus_add 处理 |
| `src/components/AddTodo.jsx` | **新增** forwardRef 支持 |
| `package.json` | **新增** `@capacitor/app` 依赖 |
| `.gitignore` | **移除** `android/` 目录忽略 |

---

## 三、已解决的问题

### 问题 1：数据源不统一（阶段 1-2）

**问题**：Web 端用 localStorage，Android 原生小部件无法读取 WebView 的 localStorage。  
**解决**：创建 `TodoStoragePlugin` Capacitor 原生插件，用 SharedPreferences 统一数据源。Web 端通过 `registerPlugin` 桥接，开发环境自动 fallback 到 localStorage。

### 问题 2：存量数据迁移（阶段 2）

**问题**：老用户的任务存在 localStorage 里，升级后 SharedPreferences 是空的。  
**解决**：`loadTodosAsync()` 中加入迁移逻辑——如果 SharedPreferences 为空且 localStorage 有数据，自动把 localStorage 数据写入 SharedPreferences。对用户完全无感。

### 问题 3：useTodos 异步化带来的测试问题（阶段 2）

**问题**：useTodos 从同步 localStorage 变为异步 SharedPreferences 后，所有测试用例都出现 timing 问题。

**三个子问题**：

**3a. `loaded` 作为 state 导致 save effect 不触发**  
- **现象**：`saveTodosAsync` 从未被调用，localStorage 无写入  
- **根因**：`loaded` 是 React state，`addTodo` 在 `act()` 内调用时，`loaded` 的闭包值仍为 `false`（异步加载未完成），导致 save effect 的 `if (!loaded) return` 跳过  
- **修复**：将 `loaded` 从 `useState` 改为 `useRef`（`loadedRef`），effect 直接读 ref 的当前值，不依赖闭包

**3b. `loadedPromise` 的 state 更新延迟**  
- **现象**：`await loadedPromise` 后 `result.current.todos` 仍为空  
- **根因**：Promise 在 `.then()` 中 resolve，但 React 的 `setTodos()` 需要再一个 microtask 才提交  
- **修复**：测试中用 `await waitFor(() => expect(result.current.todos).toHaveLength(1))` 替代直接断言

**3c. 测试中异步保存不写 localStorage**  
- **现象**：`addTodo` 后立即读 `localStorage.getItem('todos')` 返回 null  
- **根因**：`@capacitor/core` 的 `registerPlugin` 返回的 Promise 需要 microtask flush，`act()` 不保证异步 Promise 完成  
- **修复**：测试中在 `act()` 后加 `await new Promise(r => setTimeout(r, 50))` 显式等待

### 问题 4：Capacitor 8 API 变更（阶段 1 构建）

**问题**：编译报错 `方法不会覆盖或实现超类型的方法`，`init(Bundle, ArrayList)` 不存在。  
**根因**：指导文件中写的 `init()` 方法是 Capacitor 3-4 的旧 API。Capacitor 8 的 `BridgeActivity` 没有 `init` 方法，改用 `registerPlugin()` + `onCreate()`。  
**修复**：改用 `registerPlugin(TodoStoragePlugin.class)` 在 `super.onCreate()` 之前调用。

### 问题 5：`registerPlugin()` 在小米 MIUI 设备上闪退（阶段 6 构建后）

**问题**：v4 APK 在小米 14 上启动即闪退。  
**根因**：`registerPlugin()` 内部直接操作 `bridgeBuilder`，在 `super.onCreate()` 之前调用可能与 MIUI 等定制系统的 Activity 初始化时序冲突。  
**修复**：改用 `initialPlugins.add(TodoStoragePlugin.class)`，这是 `BridgeActivity` 的 `protected` 字段，在 `super.onCreate()` 内部的 `load()` 方法中才会被读取，时序更安全。

**两种注册方式对比**：
```java
// ❌ 方式 A：registerPlugin（MIUI 等设备可能崩溃）
registerPlugin(TodoStoragePlugin.class);  // 直接操作 bridgeBuilder
super.onCreate(savedInstanceState);

// ✅ 方式 B：initialPlugins（推荐）
initialPlugins.add(TodoStoragePlugin.class);  // 只写入列表，super.onCreate 中的 load() 才读取
super.onCreate(savedInstanceState);
```

### 问题 6：缺少 `@capacitor/app` 依赖（阶段 2 构建）

**问题**：`npm run build` 报错 `Failed to resolve import "@capacitor/app"`。  
**根因**：代码中 import 了 `App as CapApp`，但 `@capacitor/app` 未安装。  
**修复**：`npm install @capacitor/app`。

### 问题 7：缺少 `colors.xml` 导致启动崩溃（v5 修复）

**问题**：v4 APK 在所有设备上启动崩溃。  
**根因**：`styles.xml` 引用 `@color/colorPrimary`、`@color/colorPrimaryDark`、`@color/colorAccent`，但这些颜色未在 app 模块的 `colors.xml` 中定义。虽然 `capacitor-android` 库模块中有定义，但某些设备的资源合并机制可能不正确继承。  
**修复**：新增 `android/app/src/main/res/values/colors.xml`，显式定义这三个颜色。

---

## 四、当前 MainActivity.java 最终状态

```java
package com.example.todolist;

import android.content.Intent;
import android.os.Bundle;
import com.example.todolist.widget.TodoWidgetRefreshReceiver;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // ✅ 使用 initialPlugins 而非 registerPlugin（兼容 MIUI）
        initialPlugins.add(TodoStoragePlugin.class);
        super.onCreate(savedInstanceState);

        // ✅ 注册每日 0:00 定时刷新小部件
        TodoWidgetRefreshReceiver.scheduleNextAlarm(this);

        // ✅ 冷启动时如果带 action=ADD，写入焦点标记
        handleFocusAdd(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // ✅ app 已在前台时从 widget 打开
        handleFocusAdd(intent);
    }

    private void handleFocusAdd(Intent intent) {
        if (intent != null && "ADD".equals(intent.getStringExtra("action"))) {
            TodoStoragePlugin.setFocusAdd(this);
        }
    }
}
```

---

## 五、构建流程

```bash
# 1. 构建前端
npm run build

# 2. 同步到 Android
npx cap sync android

# 3. 构建 APK（需 Android Studio JDK）
export JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"
cd android && ./gradlew.bat assembleDebug

# 4. 输出位置
# android/app/build/outputs/apk/debug/app-debug.apk

# 5. 发布到 GitHub Release
gh release create vX apk-releases/app-vX.apk --title "vX - 标题" --notes "..."
```

---

## 六、已知问题与待改进项

### 6.1 尚未验证的功能

- [ ] 小部件在桌面的实际显示效果（未在真机上测试小部件添加流程）
- [ ] 复选框在 RemoteViews 中的 CheckBox 行为（不同 Android 版本可能有差异）
- [ ] 每日 0:00 定时刷新在 Doze 模式下是否准时（`setExactAndAllowWhileIdle` 理论上可行，但厂商定制可能拦截）
- [ ] "+"按钮跳转 app 后输入框聚焦（forwardRef 实现，未真机验证）
- [ ] `appStateChange` 在小米 MIUI 上是否可靠触发（MIUI 可能限制后台状态变化回调）

### 6.2 潜在改进建议

**存储层**  
- 考虑把 SharedPreferences 迁移到 SQLite，支持更复杂的查询（如按分类筛选）
- 或使用 `@capacitor/preferences` 替代自定义插件（更标准化）

**小部件交互**  
- 当前用 `setBoolean(checkbox, "setChecked", ...)` 切换复选框状态，某些老设备可能不支持，备选方案是用 `ImageView` + `setImageViewResource` 切换两个图片资源
- 可以添加 StackView 实现滚动任务列表（当前限制 5 条）

**定时刷新**  
- 国产 ROM（MIUI、ColorOS 等）可能限制 AlarmManager 精确触发
- 备选方案：使用 WorkManager 作为定时任务调度器（更可靠，但更复杂）

**跨天场景**  
- 当前 `loadTodayTodos` 按 `createdAt` 过滤"今天"的任务
- 如果用户希望任务在"到期日"（`dueAt`）而非"创建日"显示，需要修改过滤逻辑

---

## 七、提交历史

| 版本 | Commit | 说明 |
|------|--------|------|
| v4 | `26d46ec` | feat: 桌面小部件，Capacitor 存储插件，SharedPreferences 数据桥接 |
| v5 | `df962a5` | fix: 补充缺失的 colors.xml |
| v6 | `4cf0538` | fix: 改用 initialPlugins 注册插件，修复小米等设备闪退 |

---

## 八、关键配置文件内容

### capacitor.config.json
```json
{
  "appId": "com.example.todolist",
  "appName": "待办清单",
  "webDir": "dist"
}
```

### SharedPreferences 存储结构
```
文件名：todo_prefs
键：todos_json  → JSON 字符串（任务数组）
键：focus_add   → boolean（widget "+"按钮触发的焦点标记）
```

### 任务数据模型
```json
{
  "id": "uuid-string",
  "text": "任务内容",
  "completed": false,
  "completedAt": null,
  "category": null,
  "createdAt": 1785404145919,
  "dueAt": null,
  "location": null
}
```
